import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

export interface Confirmation {
  id: string;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();

  private confirmation = new BehaviorSubject<Confirmation | null>(null);
  public confirmation$ = this.confirmation.asObservable();

  private confirmationResolver: ((confirmed: boolean) => void) | null = null;
  private counter = 0;

  showSuccess(message: string, title = 'Sucesso', duration = 5000) {
    this.showNotification('success', title, message, duration);
  }

  showError(message: string, title = 'Erro', duration = 7000) {
    this.showNotification('error', title, message, duration);
  }

  showWarning(message: string, title = 'Aviso', duration = 6000) {
    this.showNotification('warning', title, message, duration);
  }

  showInfo(message: string, title = 'Informação', duration = 5000) {
    this.showNotification('info', title, message, duration);
  }

  confirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    this.resolveConfirmation(false);

    return new Promise<boolean>((resolve) => {
      this.confirmationResolver = resolve;
      this.confirmation.next({
        id: `confirmation-${++this.counter}`,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Confirmar',
        cancelText: options.cancelText ?? 'Cancelar',
        danger: options.danger ?? false,
      });
    });
  }

  resolveConfirmation(confirmed: boolean) {
    this.confirmation.next(null);
    this.confirmationResolver?.(confirmed);
    this.confirmationResolver = null;
  }

  private showNotification(
    type: Notification['type'],
    title: string,
    message: string,
    duration: number,
  ) {
    const notification: Notification = {
      id: `notification-${++this.counter}`,
      type,
      title,
      message,
      duration,
      timestamp: new Date(),
    };

    const currentNotifications = this.notifications.value;
    this.notifications.next([...currentNotifications, notification]);
  }

  removeNotification(id: string) {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.filter((n: Notification) => n.id !== id);
    this.notifications.next(updatedNotifications);
  }

  clearAll() {
    this.notifications.next([]);
  }
}
