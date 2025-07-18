import { NotificationSettings } from '../types/NotificationSettings';
import { formataData } from './dateUtils';

const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';
const REMINDERS_SENT_KEY = 'remindersSent';

export const getNotificationSettings = (): NotificationSettings => {
  const settings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (settings) {
    try {
      const parsedSettings = JSON.parse(settings);
      // Converte a string de data de volta para Date object, se existir
      if (parsedSettings.entryReminderTime) {
        parsedSettings.entryReminderTime = new Date(parsedSettings.entryReminderTime);
      } else {
        parsedSettings.entryReminderTime = null; // Garante que seja null se não houver
      }
      if (parsedSettings.lunchExitReminderTime) {
        parsedSettings.lunchExitReminderTime = new Date(parsedSettings.lunchExitReminderTime);
      } else {
        parsedSettings.lunchExitReminderTime = null;
      }
      if (parsedSettings.afternoonEntryReminderTime) {
        parsedSettings.afternoonEntryReminderTime = new Date(parsedSettings.afternoonEntryReminderTime);
      } else {
        parsedSettings.afternoonEntryReminderTime = null;
      }
      return parsedSettings;
    } catch (e) {
      console.error("Erro ao ler configurações de notificação do localStorage", e);
    }
  }
  // Retorna configurações padrão se não houver nada no localStorage ou se houver erro
  const defaultEntryTime = new Date();
  defaultEntryTime.setHours(9, 0, 0, 0);
  const defaultLunchExitTime = new Date();
  defaultLunchExitTime.setHours(12, 0, 0, 0); // Padrão: 12h para saída almoço
  const defaultAfternoonEntryTime = new Date();
  defaultAfternoonEntryTime.setHours(13, 0, 0, 0); // Padrão: 13h para entrada pós-almoço
  return {
    enabled: true,
    entryReminderTime: defaultEntryTime, // Padrão: 9h da manhã como objeto Date
    lunchExitReminderTime: defaultLunchExitTime,
    afternoonEntryReminderTime: defaultAfternoonEntryTime,
    exitReminderDuration: 8, // Padrão: 8 horas
    checkIntervalMinutes: 5, // Padrão: 5 minutos
  };
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  const settingsToSave = {
    ...settings,
    // Converte Date para string ISO para armazenamento
    entryReminderTime: settings.entryReminderTime ? settings.entryReminderTime.toISOString() : null,
    lunchExitReminderTime: settings.lunchExitReminderTime ? settings.lunchExitReminderTime.toISOString() : null,
    afternoonEntryReminderTime: settings.afternoonEntryReminderTime ? settings.afternoonEntryReminderTime.toISOString() : null,
  };
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settingsToSave));
};

interface RemindersSentState {
  [date: string]: { // 'YYYY-MM-DD'
    entry?: boolean;
    exit?: boolean;
    lunchExit?: boolean;
    afternoonEntry?: boolean;
  };
}

const getRemindersSentState = (): RemindersSentState => {
  const state = localStorage.getItem(REMINDERS_SENT_KEY);
  return state ? JSON.parse(state) : {};
};

const saveRemindersSentState = (state: RemindersSentState): void => {
  localStorage.setItem(REMINDERS_SENT_KEY, JSON.stringify(state));
};

export const setReminderSent = (type: 'entry' | 'exit' | 'lunchExit' | 'afternoonEntry', date: Date): void => {
  const dataFormatada = formataData(date);
  const state = getRemindersSentState();
  if (!state[dataFormatada]) {
    state[dataFormatada] = {};
  }
  state[dataFormatada][type] = true;
  saveRemindersSentState(state);
};

export const isReminderSent = (type: 'entry' | 'exit' | 'lunchExit' | 'afternoonEntry', date: Date): boolean => {
  const dataFormatada = formataData(date);
  const state = getRemindersSentState();
  return !!state[dataFormatada]?.[type];
};