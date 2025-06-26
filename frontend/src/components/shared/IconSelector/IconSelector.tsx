import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    IconButton,
    Popover,
    TextField,
    InputAdornment,
    Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { iconNameToComponent } from './iconMapping';
import { useLocalization } from '../../../hooks/useLocalization';

interface IconSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, label }) => {
    const { t } = useLocalization();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
        setSearchQuery('');
    };
    
    const handleSelectIcon = (iconName: string) => {
        onChange(iconName);
        handleClose();
    };
    
    const handleClearIcon = () => {
        onChange('');
    };
    
    const open = Boolean(anchorEl);
    
    // Фильтруем иконки по поисковому запросу
    const filteredIconNames = Object.keys(iconNameToComponent).filter(name => 
        searchQuery ? name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );
    
    return (
        <Box>
            <Button
                variant="outlined"
                onClick={handleClick}
                startIcon={value && iconNameToComponent[value] 
                    ? React.cloneElement(iconNameToComponent[value]) 
                    : null}
                fullWidth
                sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
                {value ? `${t('iconSelectorSelected')}: ${value}` : (label || t('iconSelectorDefaultLabel'))}
                {value && (
                    <IconButton 
                        size="small" 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleClearIcon(); 
                        }}
                        sx={{ ml: 'auto' }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Button>
            
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: { width: '400px', p: 2, maxHeight: '400px' }
                }}
            >
                <TextField
                    placeholder={t('iconSelectorSearchPlaceholder')}
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                
                <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                    <Grid container spacing={1}>
                        {filteredIconNames.map(iconName => (
                            <Grid item key={iconName} xs={3}>
                                <Paper 
                                    elevation={value === iconName ? 3 : 1}
                                    sx={{
                                        p: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        bgcolor: value === iconName ? 'primary.light' : 'background.paper',
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        }
                                    }}
                                    onClick={() => handleSelectIcon(iconName)}
                                >
                                    {iconNameToComponent[iconName]}
                                    <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                                        {iconName}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Popover>
        </Box>
    );
}; 