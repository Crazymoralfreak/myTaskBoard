import React, { useState } from 'react';
import { 
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import BoardMembersModal from './BoardMembersModal';

interface BoardHeaderProps {
  boardId: string;
  boardName: string;
  currentUserId: number;
  ownerId?: number;
  isAdmin: boolean;
  onEditClick?: () => void;
}

/**
 * Компонент заголовка доски с кнопками управления
 */
const BoardHeader: React.FC<BoardHeaderProps> = ({
  boardId,
  boardName,
  currentUserId,
  ownerId,
  isAdmin,
  onEditClick
}) => {
  const navigate = useNavigate();
  const [membersModalOpen, setMembersModalOpen] = useState<boolean>(false);
  
  const handleBackClick = () => {
    navigate('/boards');
  };
  
  const handleMembersClick = () => {
    setMembersModalOpen(true);
  };
  
  return (
    <>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        px={2} 
        py={1}
        bgcolor="background.paper"
        borderBottom={1}
        borderColor="divider"
      >
        <Box display="flex" alignItems="center">
          <Tooltip title="Назад к доскам">
            <IconButton onClick={handleBackClick} size="small" sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="h6" noWrap sx={{ maxWidth: '300px' }}>
            {boardName}
          </Typography>
          
          {isAdmin && onEditClick && (
            <Tooltip title="Редактировать доску">
              <IconButton onClick={onEditClick} size="small" sx={{ ml: 1 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PeopleAltIcon />}
            onClick={handleMembersClick}
          >
            Участники
          </Button>
        </Box>
      </Box>
      
      <BoardMembersModal
        open={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        boardId={boardId}
        currentUserId={currentUserId}
        ownerId={ownerId}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default BoardHeader; 