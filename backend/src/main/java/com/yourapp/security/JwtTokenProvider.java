package com.yourapp.security;

import com.yourapp.model.User;
import com.yourapp.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@Component
public class JwtTokenProvider {
    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;
    
    @Autowired
    private UserRepository userRepository;
    
    // Ключ для HS256 (используется для подписи и проверки токенов)
    private SecretKey signingKey;
    
    /**
     * Создает стабильный ключ из строки секрета
     * Гарантирует, что один и тот же секрет всегда дает одинаковый ключ даже при перезапусках сервера
     */
    private SecretKey createStableKeyFromSecret(String secret) {
        try {
            // Используем SHA-256 для получения хеша фиксированной длины (32 байта / 256 бит)
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
            
            log.debug("Создан стабильный ключ длиной {} байт", keyBytes.length);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException e) {
            log.error("Ошибка создания хеша для ключа", e);
            throw new RuntimeException("Ошибка инициализации JWT провайдера", e);
        }
    }
    
    @PostConstruct
    public void init() {
        // Всегда используем стабильный ключ на основе секрета
        signingKey = createStableKeyFromSecret(jwtSecret);
        log.info("JWT провайдер инициализирован со стабильным ключом");
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        String token = Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
        
        log.debug("Создан новый JWT токен для пользователя: {}", subject);
        return token;
    }

    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    private Claims getAllClaimsFromToken(String token) {
        try {
            log.debug("Проверка JWT токена...");
            
            // Декодируем и логируем части токена для отладки
            String[] parts = token.split("\\.");
            if (parts.length == 3) {
                String header = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
                String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                log.debug("JWT Header: {}", header);
                log.debug("JWT Payload: {}", payload);
            }
            
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            log.debug("JWT токен успешно проверен, subject: {}", claims.getSubject());
            return claims;
        } catch (JwtException e) {
            log.error("Ошибка при проверке токена: {} - {}", e.getClass().getName(), e.getMessage());
            
            // Дополнительная отладочная информация
            try {
                Claims claims = Jwts.parser()
                        .unsecured()
                        .build()
                        .parseUnsecuredClaims(token)
                        .getPayload();
                log.debug("Содержимое непроверенного токена: subject={}, issuedAt={}", 
                        claims.getSubject(), claims.getIssuedAt());
            } catch (Exception ex) {
                log.debug("Невозможно распарсить токен даже без проверки подписи");
            }
            
            throw e;
        }
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            
            // Проверяем не просрочен ли токен
            if (claims.getExpiration().before(new Date())) {
                log.debug("JWT токен просрочен: {}", claims.getExpiration());
                return false;
            }

            // Проверяем не был ли сброшен пароль после выдачи токена
            String username = claims.getSubject();
            User user = null;
            Optional<User> userByEmail = userRepository.findByEmail(username);
            if (userByEmail.isPresent()) {
                user = userByEmail.get();
            } else {
                Optional<User> userByUsername = userRepository.findByUsername(username);
                if (userByUsername.isPresent()) {
                    user = userByUsername.get();
                }
            }
            
            // Если пользователь найден и есть дата сброса пароля, проверяем ее
            if (user != null && user.getLastPasswordResetDate() != null) {
                Date tokenIssuedAt = claims.getIssuedAt();
                // Если токен был выдан до сброса пароля, считаем его недействительным
                if (tokenIssuedAt != null && tokenIssuedAt.before(java.sql.Timestamp.valueOf(user.getLastPasswordResetDate()))) {
                    log.debug("JWT токен был выдан до сброса пароля и больше недействителен");
                    return false;
                }
            }
            
            log.debug("JWT токен для пользователя {} прошел все проверки", username);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT валидация не пройдена: {}", e.getMessage());
            return false;
        }
    }
    
    /*
     * TODO: Для повышения безопасности в будущем реализовать:
     * 1. Ротацию ключей с сохранением истории
     * 2. Переход на более криптостойкий алгоритм (например, HS512)
     * 3. Хранение ключей в защищенном хранилище
     */
} 