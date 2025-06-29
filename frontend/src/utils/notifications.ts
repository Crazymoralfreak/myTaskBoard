/**
 * Единообразная система уведомлений для myTaskBoard
 * 
 * Этот модуль предоставляет универсальные функции для показа локализованных уведомлений
 * через различные библиотеки (notistack, react-hot-toast) с поддержкой параметров.
 * 
 * ОСНОВНЫЕ ПРИНЦИПЫ:
 * 1. Все уведомления должны быть локализованы
 * 2. Используем типизированные ключи для каждой категории операций
 * 3. Поддержка параметров в сообщениях через {param}
 * 4. Единообразный API для всех типов уведомлений
 * 
 * ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
 * 
 * // В компоненте:
 * const { t } = useLocalization();
 * const { enqueueSnackbar } = useSnackbar();
 * 
 * // Уведомления для операций с задачами:
 * showTaskNotification(t, enqueueSnackbar, 'taskCreated', { title: 'Моя задача' }, 'success');
 * showTaskNotification(t, enqueueSnackbar, 'taskDeleteError', {}, 'error');
 * 
 * // Уведомления для операций с досками:
 * showBoardNotification(t, enqueueSnackbar, 'boardUpdated', {}, 'success');
 * showBoardNotification(t, enqueueSnackbar, 'columnAdded', { name: 'Новая колонка' }, 'success');
 * 
 * // Уведомления для участников:
 * showMemberNotification(t, enqueueSnackbar, 'memberAdded', { name: 'Иван Иванов' }, 'success');
 * 
 * // Общие уведомления:
 * showGeneralNotification(t, enqueueSnackbar, 'validationError', {}, 'error');
 * 
 * // Использование toast вместо snackbar:
 * showLocalizedToast(t, 'profile.profileUpdated', {}, 'success');
 * 
 * // Универсальная обработка ошибок:
 * showError(t, error, 'shared.unknownError', true); // useToast = true
 * 
 * СТРУКТУРА КЛЮЧЕЙ ЛОКАЛИЗАЦИИ:
 * - task.* - операции с задачами
 * - board.* - операции с досками, колонками, участниками, приглашениями
 * - profile.* - операции с профилем
 * - auth.* - операции аутентификации
 * - notifications.* - операции с уведомлениями
 * - settings.* - операции с настройками
 * - shared.* - общие операции
 */

import { SnackbarKey, VariantType, OptionsObject } from 'notistack';
import { toast } from 'react-hot-toast';

// Форматирует строку с параметрами {param}
function formatString(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replace(new RegExp(`{${key}}`, 'g'), String(value)),
    template
  );
}

// Универсальный util для показа локализованных нотификаций через notistack
export function showLocalizedNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: string,
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const message = formatString(t(key), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Универсальный util для показа локализованных нотификаций через react-hot-toast
export function showLocalizedToast(
  t: (key: string) => string,
  key: string,
  params?: Record<string, string | number>,
  variant: 'success' | 'error' | 'info' = 'info'
) {
  const message = formatString(t(key), params);
  
  switch (variant) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    default:
      toast(message);
      break;
  }
}

// Специальная функция для уведомлений о настройках
export function showSettingsNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'settingSaved' | 'settingSaveError' | 'settingSaveWarning',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  // Используем префикс settings. для ключей настроек
  const settingsKey = `settings.${key}`;
  const message = formatString(t(settingsKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с досками
export function showBoardNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'boardCreated' | 'boardUpdated' | 'boardDeleted' | 'boardLoadError' | 'boardCreateError' | 'boardUpdateError' | 'boardDeleteError' | 'columnAdded' | 'columnUpdated' | 'columnDeleted' | 'columnAddError' | 'columnUpdateError' | 'columnDeleteError' | 'columnMoved' | 'columnMoveError',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const boardKey = `board.${key}`;
  const message = formatString(t(boardKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с задачами
export function showTaskNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'taskCreated' | 'taskUpdated' | 'taskDeleted' | 'taskCopied' | 'taskMoved' | 'taskLoadError' | 'taskCreateError' | 'taskUpdateError' | 'taskDeleteError' | 'taskCopyError' | 'taskMoveError' | 'taskNotFound' | 'commentAdded' | 'commentUpdated' | 'commentDeleted' | 'commentAddError' | 'commentUpdateError' | 'commentDeleteError' | 'attachmentUploaded' | 'attachmentDeleted' | 'attachmentUploadError' | 'attachmentDeleteError',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const taskKey = `task.${key}`;
  const message = formatString(t(taskKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с участниками
export function showMemberNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'memberAdded' | 'memberRemoved' | 'memberRoleChanged' | 'memberInvited' | 'memberAddError' | 'memberRemoveError' | 'memberRoleChangeError' | 'memberInviteError' | 'memberAlreadyExists' | 'memberNotFound',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const memberKey = `board.${key}`;
  const message = formatString(t(memberKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с приглашениями
export function showInviteNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'inviteCreated' | 'inviteAccepted' | 'inviteDeclined' | 'inviteExpired' | 'inviteCreateError' | 'inviteAcceptError' | 'inviteDeclineError' | 'inviteLoadError' | 'inviteInvalid',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const inviteKey = `board.${key}`;
  const message = formatString(t(inviteKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с профилем
export function showProfileNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'profileUpdated' | 'profileUpdateError' | 'profileLoadError' | 'avatarUploaded' | 'avatarUploadError' | 'passwordChanged' | 'passwordChangeError',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const profileKey = `profile.${key}`;
  const message = formatString(t(profileKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с аутентификацией
export function showAuthNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'loginSuccess' | 'loginError' | 'logoutSuccess' | 'registerSuccess' | 'registerError' | 'sessionExpired' | 'tokenRefreshed' | 'tokenRefreshError',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const authKey = `auth.${key}`;
  const message = formatString(t(authKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для общих операций
export function showGeneralNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'dataSaved' | 'dataLoaded' | 'dataDeleted' | 'dataSaveError' | 'dataLoadError' | 'dataDeleteError' | 'operationSuccess' | 'operationError' | 'validationError' | 'networkError' | 'unknownError',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const generalKey = `shared.${key}`;
  const message = formatString(t(generalKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с шаблонами
export function showTemplateNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'templateCreated' | 'templateUpdated' | 'templateDeleted' | 'templateApplied' | 'templateCreateError' | 'templateUpdateError' | 'templateDeleteError' | 'templateApplyError' | 'templateLoadError',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const templateKey = `task.${key}`;
  const message = formatString(t(templateKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Функция для операций с уведомлениями
export function showNotificationSettingNotification(
  t: (key: string) => string,
  enqueueSnackbar: (msg: string, opts?: OptionsObject) => SnackbarKey,
  key: 'notificationSettingUpdated' | 'notificationSettingUpdateError' | 'notificationSettingLoadError' | 'notificationMarkedRead' | 'notificationMarkReadError' | 'notificationCleared' | 'notificationClearError',
  params?: Record<string, string | number>,
  variant: VariantType = 'info',
  options?: OptionsObject
) {
  const notificationKey = `notifications.${key}`;
  const message = formatString(t(notificationKey), params);
  enqueueSnackbar(message, { variant, ...options });
}

// Универсальная функция для показа ошибок с возможностью использования toast
export function showError(
  t: (key: string) => string,
  error: any,
  fallbackKey: string = 'shared.unknownError',
  useToast: boolean = false,
  enqueueSnackbar?: (msg: string, opts?: OptionsObject) => SnackbarKey
) {
  const errorMessage = error?.response?.data?.message || error?.message || t(fallbackKey);
  
  if (useToast) {
    toast.error(errorMessage);
  } else if (enqueueSnackbar) {
    enqueueSnackbar(errorMessage, { variant: 'error' });
  }
}

// Универсальная функция для показа успешных операций
export function showSuccess(
  t: (key: string) => string,
  key: string,
  params?: Record<string, string | number>,
  useToast: boolean = false,
  enqueueSnackbar?: (msg: string, opts?: OptionsObject) => SnackbarKey
) {
  const message = formatString(t(key), params);
  
  if (useToast) {
    toast.success(message);
  } else if (enqueueSnackbar) {
    enqueueSnackbar(message, { variant: 'success' });
  }
}

/**
 * РУКОВОДСТВО ПО МИГРАЦИИ
 * 
 * Замените старые вызовы уведомлений на новые:
 * 
 * БЫЛО:
 * enqueueSnackbar('Задача создана', { variant: 'success' });
 * toast.error('Ошибка создания задачи');
 * setError('Ошибка валидации');
 * 
 * СТАЛО:
 * showTaskNotification(t, enqueueSnackbar, 'taskCreated', {}, 'success');
 * showTaskNotification(t, enqueueSnackbar, 'taskCreateError', {}, 'error');
 * showGeneralNotification(t, enqueueSnackbar, 'validationError', {}, 'error');
 * 
 * ПРЕИМУЩЕСТВА:
 * 1. Автоматическая локализация всех сообщений
 * 2. Типизированные ключи - нет опечаток
 * 3. Единообразный API для всех операций
 * 4. Поддержка параметров в сообщениях
 * 5. Централизованное управление уведомлениями
 * 6. Легкость поддержки и расширения
 * 
 * ВАЖНО: Не забудьте добавить соответствующие ключи локализации в файлы:
 * - frontend/src/locales/ru/[category].json
 * - frontend/src/locales/en/[category].json
 */ 