import React, { useState } from 'react';
import { Typography, Box, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { taskService } from '../services/taskService';

interface TextRendererProps {
    content: string;
    variant?: 'body1' | 'body2' | 'caption';
    maxHeight?: string;
    enableScroll?: boolean;
    taskId?: number; // Для обработки файлов
    onAttachmentAdd?: (attachment: any) => void; // Коллбек для добавления вложений
}

/**
 * Компонент для правильного отображения HTML контента от ReactQuill
 * Преобразует HTML в красивый читаемый текст с сохранением форматирования
 * Поддерживает файлы и автоматическое добавление их в attachments
 */
export const TextRenderer: React.FC<TextRendererProps> = ({ 
    content, 
    variant = 'body2', 
    maxHeight = '200px',
    enableScroll = true,
    taskId,
    onAttachmentAdd 
}) => {
    const theme = useTheme();
    const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

    // Функция для загрузки файла
    const handleFileUpload = async (file: File) => {
        if (!taskId || !onAttachmentAdd) return;

        const fileId = `${file.name}-${Date.now()}`;
        setUploadingFiles(prev => new Set([...prev, fileId]));

        try {
            // TODO: Добавить метод uploadAttachment в taskService
            // Пока используем заглушку
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`/api/tasks/${taskId}/attachments`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки файла');
            
            const attachment = await response.json();
            onAttachmentAdd(attachment);
            
            // Возвращаем URL для вставки в текст
            return attachment.url || `/api/tasks/${taskId}/attachments/${attachment.id}/download`;
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            throw error;
        } finally {
            setUploadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(fileId);
                return newSet;
            });
        }
    };

    // Функция для обработки drag & drop файлов
    const handleFileDrop = async (event: React.DragEvent) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        
        for (const file of files) {
            try {
                await handleFileUpload(file);
            } catch (error) {
                console.error('Ошибка при загрузке файла:', error);
            }
        }
    };

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
                        case 'img':
                            const src = element.getAttribute('src');
                            const alt = element.getAttribute('alt') || 'Изображение';
                            if (src) {
                                result.push(
                                    <Box key={index} sx={{ margin: '8px 0', textAlign: 'center' }}>
                                        <img 
                                            src={src} 
                                            alt={alt}
                                            style={{
                                                maxWidth: '100%',
                                                height: 'auto',
                                                borderRadius: '8px',
                                                boxShadow: theme.shadows[2]
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        {alt !== 'Изображение' && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                {alt}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            }
                            break;
                        case 'video':
                            const videoSrc = element.getAttribute('src');
                            if (videoSrc) {
                                result.push(
                                    <Box key={index} sx={{ margin: '8px 0', textAlign: 'center' }}>
                                        <video 
                                            src={videoSrc}
                                            controls
                                            style={{
                                                maxWidth: '100%',
                                                height: 'auto',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            Ваш браузер не поддерживает воспроизведение видео.
                                        </video>
                                    </Box>
                                );
                            }
                            break;
                        // Обработка ссылок на файлы
                        case 'span':
                            const dataFile = element.getAttribute('data-file');
                            if (dataFile) {
                                const fileName = element.getAttribute('data-filename') || 'Файл';
                                const fileType = element.getAttribute('data-filetype') || '';
                                
                                const getFileIcon = (type: string) => {
                                    if (type.includes('image')) return <ImageIcon />;
                                    if (type.includes('video')) return <VideoFileIcon />;
                                    if (type.includes('pdf')) return <PictureAsPdfIcon />;
                                    return <AttachFileIcon />;
                                };

                                result.push(
                                    <Button
                                        key={index}
                                        variant="outlined"
                                        size="small"
                                        startIcon={getFileIcon(fileType)}
                                        onClick={() => window.open(dataFile, '_blank')}
                                        sx={{ 
                                            margin: '4px 8px 4px 0',
                                            textTransform: 'none'
                                        }}
                                    >
                                        {fileName}
                                    </Button>
                                );
                            } else {
                                result.push(...childContent);
                            }
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
        <Box 
            sx={{ 
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
            }}
            onDrop={taskId ? handleFileDrop : undefined}
            onDragOver={taskId ? (e) => e.preventDefault() : undefined}
        >
            {renderedContent}
            {uploadingFiles.size > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Загрузка файлов...
                    </Typography>
                    <LinearProgress sx={{ mt: 1 }} />
                </Box>
            )}
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

/**
 * Функция для создания HTML с файлом
 * Используется в Rich Text Editor для вставки ссылок на файлы
 */
export const createFileHtml = (fileName: string, fileUrl: string, fileType?: string): string => {
    return `<span data-file="${fileUrl}" data-filename="${fileName}" data-filetype="${fileType || ''}" class="file-attachment">${fileName}</span>`;
};

/**
 * Расширенный Rich Text Editor с поддержкой файлов
 */
export const EnhancedRichTextEditor: React.FC<{
    value: string;
    onChange: (value: string) => void;
    taskId?: number;
    onAttachmentAdd?: (attachment: any) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ value, onChange, taskId, onAttachmentAdd, placeholder, disabled = false }) => {
    const [fileDialogOpen, setFileDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const handleFileSelect = async (files: File[]) => {
        if (!taskId || !onAttachmentAdd) return;
        
        setUploading(true);
        try {
            for (const file of files) {
                // TODO: Добавить метод uploadAttachment в taskService
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch(`/api/tasks/${taskId}/attachments`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) throw new Error('Ошибка загрузки файла');
                
                const attachment = await response.json();
                onAttachmentAdd(attachment);
                
                // Вставляем ссылку на файл в текст
                const fileHtml = createFileHtml(file.name, attachment.url || '', file.type);
                onChange(value + ' ' + fileHtml);
            }
        } catch (error) {
            console.error('Ошибка загрузки файлов:', error);
        } finally {
            setUploading(false);
            setFileDialogOpen(false);
        }
    };

    // Здесь можно добавить ReactQuill с кастомными инструментами для файлов
    // Пока возвращаем простой интерфейс для демонстрации
    return (
        <Box>
            {/* Здесь будет ReactQuill с расширенными возможностями */}
            <Typography variant="caption" color="text.secondary">
                Перетащите файлы в область описания или используйте кнопку для добавления вложений
            </Typography>
        </Box>
    );
}; 