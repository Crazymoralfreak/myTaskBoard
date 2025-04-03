package com.yourapp.service;

import com.yourapp.model.User;
import com.yourapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Сначала ищем по email
        Optional<User> userByEmail = userRepository.findByEmail(username);
        if (userByEmail.isPresent()) {
            return userByEmail.get();
        }
        
        // Если по email не найдено, ищем по username
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // Устанавливаем дату последнего сброса пароля при создании пользователя
        if (user.getLastPasswordResetDate() == null) {
            user.setLastPasswordResetDate(LocalDateTime.now());
        }
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (userDetails.getUsername() != null) {
            user.setUsername(userDetails.getUsername());
        }
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        if (userDetails.getAvatarUrl() != null) {
            user.setAvatarUrl(userDetails.getAvatarUrl());
        }
        if (userDetails.getPhoneNumber() != null) {
            user.setPhoneNumber(userDetails.getPhoneNumber());
        }
        if (userDetails.getPosition() != null) {
            user.setPosition(userDetails.getPosition());
        }
        if (userDetails.getBio() != null) {
            user.setBio(userDetails.getBio());
        }
        if (userDetails.getTelegramId() != null) {
            user.setTelegramId(userDetails.getTelegramId());
        }
        if (userDetails.getTelegramChatId() != null) {
            user.setTelegramChatId(userDetails.getTelegramChatId());
        }
        if (userDetails.getDisplayName() != null) {
            user.setDisplayName(userDetails.getDisplayName());
        }
        
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<UserDetails> loadUserById(Long id) {
        return getUserById(id).map(user -> (UserDetails) user);
    }

    /**
     * Изменение пароля пользователя
     * @param email email пользователя
     * @param currentPassword текущий пароль
     * @param newPassword новый пароль
     */
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        // Устанавливаем дату последнего сброса пароля
        user.setLastPasswordResetDate(LocalDateTime.now());
        userRepository.save(user);
        
        log.info("Password changed successfully for user: {}", email);
    }
}