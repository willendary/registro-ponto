export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn("NotificationService: Este navegador não suporta notificações.");
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  console.log("NotificationService: Permissão de notificação concedida:", permission);
  return permission;
};

export const sendNotification = (title: string, options?: NotificationOptions): void => {
  console.log("NotificationService: Tentando enviar notificação. Permissão atual:", Notification.permission);
  if (Notification.permission === 'granted') {
    new Notification(title, options);
    console.log("NotificationService: Notificação enviada com sucesso:", title);
  } else if (Notification.permission === 'denied') {
    console.warn("NotificationService: Permissão para notificações negada. Não foi possível enviar.");
  } else {
    console.warn("NotificationService: Permissão para notificações não concedida. Solicite primeiro.");
  }
};