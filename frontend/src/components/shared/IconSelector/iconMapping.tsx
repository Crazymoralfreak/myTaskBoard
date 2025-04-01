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

// Добавляем новые иконки
import FireplaceIcon from '@mui/icons-material/Fireplace'; // Огонь/горячая задача
import SpeedIcon from '@mui/icons-material/Speed'; // Скорость/производительность
import BlockIcon from '@mui/icons-material/Block'; // Блокировка
import WarningIcon from '@mui/icons-material/Warning'; // Предупреждение
import ErrorIcon from '@mui/icons-material/Error'; // Ошибка
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Завершено
import CancelIcon from '@mui/icons-material/Cancel'; // Отменено
import UpdateIcon from '@mui/icons-material/Update'; // Обновление
import CloudIcon from '@mui/icons-material/Cloud'; // Облако
import SecurityIcon from '@mui/icons-material/Security'; // Безопасность
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Тренд вверх
import TrendingDownIcon from '@mui/icons-material/TrendingDown'; // Тренд вниз
import ScienceIcon from '@mui/icons-material/Science'; // Наука/исследования
import BookmarkIcon from '@mui/icons-material/Bookmark'; // Закладка
import LabelIcon from '@mui/icons-material/Label'; // Ярлык
import LayersIcon from '@mui/icons-material/Layers'; // Слои
import MobileFriendlyIcon from '@mui/icons-material/MobileFriendly'; // Мобильное приложение
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows'; // Десктоп
import StorageIcon from '@mui/icons-material/Storage'; // База данных
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions'; // Интеграции
import SourceIcon from '@mui/icons-material/Source'; // Исходный код
import TerminalIcon from '@mui/icons-material/Terminal'; // Терминал
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Автоисправление
import ArchitectureIcon from '@mui/icons-material/Architecture'; // Архитектура
import AlarmIcon from '@mui/icons-material/Alarm'; // Будильник/напоминание
import RouterIcon from '@mui/icons-material/Router'; // Сеть
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard'; // Разработка/плата
import MemoryIcon from '@mui/icons-material/Memory'; // Память/процессор
import BiotechIcon from '@mui/icons-material/Biotech'; // Тестирование
import ExtensionIcon from '@mui/icons-material/Extension'; // Расширение
import CallSplitIcon from '@mui/icons-material/CallSplit'; // Ветвление
import MergeTypeIcon from '@mui/icons-material/MergeType'; // Слияние

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
    'share': <ShareIcon />,
    
    // Новые иконки
    'fireplace': <FireplaceIcon />,
    'speed': <SpeedIcon />,
    'block': <BlockIcon />,
    'warning': <WarningIcon />,
    'error': <ErrorIcon />,
    'check_circle': <CheckCircleIcon />,
    'cancel': <CancelIcon />,
    'update': <UpdateIcon />,
    'cloud': <CloudIcon />,
    'security': <SecurityIcon />,
    'trending_up': <TrendingUpIcon />,
    'trending_down': <TrendingDownIcon />,
    'science': <ScienceIcon />,
    'bookmark': <BookmarkIcon />,
    'label': <LabelIcon />,
    'layers': <LayersIcon />,
    'mobile_friendly': <MobileFriendlyIcon />,
    'desktop_windows': <DesktopWindowsIcon />,
    'storage': <StorageIcon />,
    'integration_instructions': <IntegrationInstructionsIcon />,
    'source': <SourceIcon />,
    'terminal': <TerminalIcon />,
    'auto_fix_high': <AutoFixHighIcon />,
    'architecture': <ArchitectureIcon />,
    'alarm': <AlarmIcon />,
    'router': <RouterIcon />,
    'developer_board': <DeveloperBoardIcon />,
    'memory': <MemoryIcon />,
    'biotech': <BiotechIcon />,
    'extension': <ExtensionIcon />,
    'call_split': <CallSplitIcon />,
    'merge_type': <MergeTypeIcon />
}; 