import { createTheme } from '@mui/material/styles';

// Светлая тема
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff',
        },
        text: {
            primary: '#172b4d',
            secondary: '#6b778c',
        },
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
});

// Темная тема
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9', // Светло-синий
        },
        secondary: {
            main: '#f48fb1', // Светло-розовый
        },
        background: {
            default: '#1c1c1c', // Темно-серый (чуть светлее для фона)
            paper: '#2c2c2c',   // Серый (для карточек и Paper)
        },
        text: {
            primary: '#ffffff', // Белый для основного текста
            secondary: '#b0bec5', // Светло-серый для второстепенного
        },
        divider: 'rgba(255, 255, 255, 0.12)' // Светлый разделитель
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    // По умолчанию фон будет браться из palette.background.paper
                    // boxShadow: '0 1px 3px rgba(255,255,255,0.1)' // Можно добавить легкую белую тень
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    // Адаптация Chip для темной темы
                    // Пример: сделать фон чуть светлее
                    // backgroundColor: 'rgba(255, 255, 255, 0.08)' 
                },
                icon: {
                     // color: '#e0e0e0' // Цвет иконки в Chip
                }
            }
        }
        // ... другие настройки компонентов
    },
}); 