import profile from './profile.json';
import auth from './auth.json';
import home from './home.json';
import shared from './shared.json';
import settings from './settings.json';
import board from './board.json';
import navigation from './navigation.json';
import task from './task.json';
import notifications from './notifications.json';

export default {
  ...profile,
  ...auth,
  ...home,
  ...shared,
  ...settings,
  ...board,
  ...navigation,
  ...task,
  ...notifications
}; 