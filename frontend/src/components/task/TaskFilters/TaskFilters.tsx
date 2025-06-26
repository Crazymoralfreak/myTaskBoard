import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Grid,
  SelectChangeEvent,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { TaskType, BoardStatus } from '../../../types/board';
import { useLocalization } from '../../../hooks/useLocalization';

interface TaskFiltersProps {
  taskTypes: TaskType[];
  boardStatuses: BoardStatus[];
  onFilter: (filters: {
    statusIds: number[];
    typeIds: number[];
    dueDate: Date | null;
    hasTags: boolean;
    search: string;
  }) => void;
  onReset: () => void;
  onSort: (sortBy: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  taskTypes = [],
  boardStatuses = [],
  onFilter,
  onReset,
  onSort
}) => {
  const { t } = useLocalization();
  const [statusFilters, setStatusFilters] = useState<number[]>([]);
  const [typeFilters, setTypeFilters] = useState<number[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<Date | null>(null);
  const [hasTagsFilter, setHasTagsFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

  const handleFilter = () => {
    onFilter({
      statusIds: statusFilters,
      typeIds: typeFilters,
      dueDate: dueDateFilter,
      hasTags: hasTagsFilter,
      search: searchTerm
    });
  };

  const handleReset = () => {
    setStatusFilters([]);
    setTypeFilters([]);
    setDueDateFilter(null);
    setHasTagsFilter(false);
    setSearchTerm('');
    setSortBy('dueDate');
    onReset();
  };

  const handleStatusChange = (statusId: number) => {
    setStatusFilters(prev => 
      prev.includes(statusId)
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId]
    );
  };

  const handleTypeChange = (typeId: number) => {
    setTypeFilters(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSortBy(value);
    onSort(value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('filtersTitle')}
        </Typography>
        
        <Grid container spacing={2}>
          {/* Поиск */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('filtersSearchTasks')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              margin="dense"
            />
          </Grid>
          
          {/* Статусы */}
          <Grid item xs={12}>
            <Typography variant="subtitle1">{t('filtersStatuses')}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {boardStatuses.map(status => (
                <Chip
                  key={status.id}
                  label={status.name}
                  onClick={() => handleStatusChange(status.id)}
                  sx={{
                    bgcolor: statusFilters.includes(status.id) ? status.color : 'transparent',
                    color: statusFilters.includes(status.id) ? '#fff' : 'text.primary',
                    borderColor: status.color,
                    border: 1
                  }}
                />
              ))}
            </Box>
          </Grid>
          
          {/* Типы задач */}
          <Grid item xs={12}>
            <Typography variant="subtitle1">{t('filtersTaskTypes')}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {taskTypes.map(type => (
                <Chip
                  key={type.id}
                  label={type.name}
                  onClick={() => handleTypeChange(type.id)}
                  sx={{
                    bgcolor: typeFilters.includes(type.id) ? `${type.color}40` : 'transparent',
                    color: type.color,
                    borderColor: type.color,
                    border: 1
                  }}
                />
              ))}
            </Box>
          </Grid>
          
          {/* Другие фильтры */}
          <Grid item xs={12} sm={6}>
            <DatePicker
              label={t('filtersDueBefore')}
              value={dueDateFilter}
              onChange={(date) => setDueDateFilter(date)}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('filtersSortBy')}</InputLabel>
              <Select
                value={sortBy}
                label={t('filtersSortBy')}
                onChange={handleSortChange}
              >
                        <MenuItem value="dueDate">{t('filtersSortOptionsDueDate')}</MenuItem>
        <MenuItem value="status">{t('filtersSortOptionsStatus')}</MenuItem>
        <MenuItem value="title">{t('filtersSortOptionsTitle')}</MenuItem>
        <MenuItem value="priority">{t('filtersSortOptionsPriority')}</MenuItem>
        <MenuItem value="type">{t('filtersSortOptionsType')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasTagsFilter}
                    onChange={() => setHasTagsFilter(!hasTagsFilter)}
                  />
                }
                label={t('filtersOnlyWithTags')}
              />
            </FormGroup>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={handleReset}>
                {t('filtersReset')}
              </Button>
              <Button variant="contained" onClick={handleFilter}>
                {t('filtersApply')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};