import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import EmailIcon from '@mui/icons-material/Email';
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ListIcon from '@mui/icons-material/List';
import LockIcon from '@mui/icons-material/Lock';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import PhotoIcon from '@mui/icons-material/Photo';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import VideocamIcon from '@mui/icons-material/Videocam';
import ViewListIcon from '@mui/icons-material/ViewList';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import WorkIcon from '@mui/icons-material/Work';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ForumIcon from '@mui/icons-material/Forum';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PublicIcon from '@mui/icons-material/Public';
import ShareIcon from '@mui/icons-material/Share';

// Карта соответствия имен иконок компонентам
export const iconNameToComponent: Record<string, React.ReactElement> = {
    'add': <AddIcon />,
    'bug_report': <BugReportIcon />,
    'build': <BuildIcon />,
    'code': <CodeIcon />,
    'dashboard': <DashboardIcon />,
    'description': <DescriptionIcon />,
    'email': <EmailIcon />,
    'folder': <FolderIcon />,
    'home': <HomeIcon />,
    'info': <InfoIcon />,
    'lightbulb': <LightbulbIcon />,
    'list': <ListIcon />,
    'lock': <LockIcon />,
    'menu': <MenuIcon />,
    'notifications': <NotificationsIcon />,
    'person': <PersonIcon />,
    'photo': <PhotoIcon />,
    'send': <SendIcon />,
    'settings': <SettingsIcon />,
    'star': <StarIcon />,
    'task_alt': <TaskAltIcon />,
    'thumb_up': <ThumbUpIcon />,
    'videocam': <VideocamIcon />,
    'view_list': <ViewListIcon />,
    'watch_later': <WatchLaterIcon />,
    'work': <WorkIcon />,
    'edit': <EditIcon />,
    'delete': <DeleteIcon />,
    'forum': <ForumIcon />,
    'more_horiz': <MoreHorizIcon />,
    'priority_high': <PriorityHighIcon />,
    'assignment': <AssignmentIcon />,
    'access_time': <AccessTimeIcon />,
    'attach_file': <AttachFileIcon />,
    'emoji_events': <EmojiEventsIcon />,
    'group': <GroupIcon />,
    'local_offer': <LocalOfferIcon />,
    'public': <PublicIcon />,
    'share': <ShareIcon />
}; 