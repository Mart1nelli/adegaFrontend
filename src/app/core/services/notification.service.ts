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

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();

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

  private showNotification(type: Notification['type'], title: string, message: string, duration: number) {
    const notification: Notification = {
      id: `notification-${++this.counter}`,
      type,
      title,
      message,
      duration,
      timestamp: new Date()
    };

    const currentNotifications = this.notifications.value;
    this.notifications.next([...currentNotifications, notification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
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