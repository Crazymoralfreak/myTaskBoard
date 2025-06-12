import React from 'react';
import { Typography, Box, useTheme } from '@mui/material';

interface TextRendererProps {
    content: string;
    variant?: 'body1' | 'body2' | 'caption';
    maxHeight?: string;
    enableScroll?: boolean;
}

/**
 * Компонент для правильного отображения HTML контента от ReactQuill
 * Преобразует HTML в красивый читаемый текст с сохранением форматирования
 */
export const TextRenderer: React.FC<TextRendererProps> = ({ 
    content, 
    variant = 'body2', 
    maxHeight = '200px',
    enableScroll = true 
}) => {
    const theme = useTheme();

    // Функция для очистки и преобразования HTML в текст с сохранением структуры
    const renderHtmlContent = (htmlContent: string) => {
        // Создаем временный элемент для парсинга HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Рекурсивная функция для обработки узлов
        const processNode = (node: Node): React.ReactNode[] => {
            const result: React.ReactNode[] = [];
            
            node.childNodes.forEach((child, index) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.textContent?.trim();
                    if (text) {
                        result.push(text);
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const element = child as Element;
                    const childContent = processNode(child);
                    
                    switch (element.tagName.toLowerCase()) {
                        case 'strong':
                        case 'b':
                            result.push(
                                <Typography key={index} component="strong" sx={{ fontWeight: 700, display: 'inline' }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'em':
                        case 'i':
                            result.push(
                                <Typography key={index} component="em" sx={{ fontStyle: 'italic', display: 'inline' }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'u':
                            result.push(
                                <Typography key={index} component="span" sx={{ textDecoration: 'underline', display: 'inline' }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 's':
                        case 'strike':
                            result.push(
                                <Typography key={index} component="span" sx={{ textDecoration: 'line-through', display: 'inline' }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'code':
                            result.push(
                                <Typography 
                                    key={index}
                                    component="code" 
                                    sx={{ 
                                        backgroundColor: theme.palette.action.hover,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9em',
                                        display: 'inline'
                                    }}
                                >
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'blockquote':
                            result.push(
                                <Box 
                                    key={index}
                                    sx={{ 
                                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                                        paddingLeft: 2,
                                        margin: '8px 0',
                                        fontStyle: 'italic',
                                        color: theme.palette.text.secondary,
                                        backgroundColor: theme.palette.action.hover,
                                        borderRadius: '0 4px 4px 0',
                                        padding: '8px 12px'
                                    }}
                                >
                                    {childContent}
                                </Box>
                            );
                            break;
                        case 'h1':
                            result.push(
                                <Typography key={index} variant="h5" component="h1" sx={{ margin: '16px 0 8px 0', fontWeight: 600 }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'h2':
                            result.push(
                                <Typography key={index} variant="h6" component="h2" sx={{ margin: '12px 0 6px 0', fontWeight: 600 }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'ul':
                            result.push(
                                <Box key={index} component="ul" sx={{ margin: '8px 0', paddingLeft: '20px' }}>
                                    {childContent}
                                </Box>
                            );
                            break;
                        case 'ol':
                            result.push(
                                <Box key={index} component="ol" sx={{ margin: '8px 0', paddingLeft: '20px' }}>
                                    {childContent}
                                </Box>
                            );
                            break;
                        case 'li':
                            result.push(
                                <Typography key={index} component="li" variant={variant} sx={{ margin: '2px 0' }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'br':
                            result.push(<br key={index} />);
                            break;
                        case 'p':
                            result.push(
                                <Typography key={index} variant={variant} component="p" sx={{ margin: '8px 0', '&:first-of-type': { marginTop: 0 }, '&:last-child': { marginBottom: 0 } }}>
                                    {childContent}
                                </Typography>
                            );
                            break;
                        case 'a':
                            const href = element.getAttribute('href');
                            result.push(
                                <Typography 
                                    key={index}
                                    component="a" 
                                    href={href || '#'}
                                    target={href?.startsWith('http') ? '_blank' : undefined}
                                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    sx={{ 
                                        color: theme.palette.primary.main,
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    {childContent}
                                </Typography>
                            );
                            break;
                        default:
                            // Для неизвестных тегов просто возвращаем содержимое
                            result.push(...childContent);
                            break;
                    }
                }
            });
            
            return result;
        };

        return processNode(tempDiv);
    };

    // Если контент пустой
    if (!content || content.trim() === '') {
        return null;
    }

    const renderedContent = renderHtmlContent(content);

    return (
        <Box sx={{ 
            maxHeight: enableScroll ? maxHeight : 'auto',
            overflow: enableScroll ? 'auto' : 'visible',
            padding: '12px 16px',
            backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.03)',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            '& > *:first-of-type': {
                marginTop: 0
            },
            '& > *:last-child': {
                marginBottom: 0
            }
        }}>
            {renderedContent}
        </Box>
    );
};

/**
 * Функция для извлечения чистого текста из HTML
 * Полезна для превью или когда нужен только текст без форматирования
 */
export const stripHtmlTags = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Функция для обрезки текста с сохранением слов
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 0) {
        return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
};

/**
 * Компонент для отображения краткого превью текста
 */
export const TextPreview: React.FC<{ content: string; maxLength?: number }> = ({ 
    content, 
    maxLength = 100 
}) => {
    const cleanText = stripHtmlTags(content);
    const previewText = truncateText(cleanText, maxLength);
    
    if (!previewText) return null;
    
    return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {previewText}
        </Typography>
    );
}; 