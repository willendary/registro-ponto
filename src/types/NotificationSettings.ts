export interface NotificationSettings {
  enabled: boolean;
  entryReminderTime: Date | null; // Hora específica para lembrar a entrada
  exitReminderDuration: number; // Duração em horas para lembrar a saída (ex: 8 horas)
  checkIntervalMinutes: number; // Intervalo de verificação em minutos
}
