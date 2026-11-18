import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, QueryList, ViewChildren } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroCheckCircle,
  heroExclamationTriangle,
  heroInformationCircle,
  heroXCircle,
  heroXMark,
} from '@ng-icons/heroicons/outline';
import {
  Notification,
  NotificationService,
} from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, NgIconComponent],
  templateUrl: './notifications.html',
  providers: [
    provideIcons({
      heroCheckCircle,
      heroXCircle,
      heroExclamationTriangle,
      heroInformationCircle,
      heroXMark,
    }),
  ],
})
export class Notifications {
  private notificationService = inject(NotificationService);

  @ViewChildren('notificationElement') notificationElements!: QueryList<ElementRef>;

  notifications = toSignal(this.notificationService.notifications$, { initialValue: [] });
  confirmation = toSignal(this.notificationService.confirmation$, { initialValue: null });
  private removalTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private removingNotifications = new Set<string>();

  constructor() {
    effect(() => {
      // Re-executa sempre que a lista de notificações mudar
      const currentNotifications = this.notifications();
      setTimeout(() => {
        this.animateNotifications();
        currentNotifications.forEach((notification) => this.scheduleAutomaticRemoval(notification));
      }, 0);
    });
  }

  private animateNotifications() {
    this.notificationElements?.forEach((elementRef: ElementRef, index: number) => {
      const element = elementRef.nativeElement;
      setTimeout(() => {
        element.classList.add('notification--visible');
      }, index * 100);
    });
  }

  removeNotification(id: string) {
    if (this.removingNotifications.has(id)) return;
    this.removingNotifications.add(id);

    const timer = this.removalTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.removalTimers.delete(id);
    }

    const element = this.findNotificationElement(id);
    if (element) {
      element.classList.add('notification--exiting');
      setTimeout(() => {
        this.notificationService.removeNotification(id);
        this.removingNotifications.delete(id);
      }, 300);
    } else {
      this.notificationService.removeNotification(id);
      this.removingNotifications.delete(id);
    }
  }

  private scheduleAutomaticRemoval(notification: Notification) {
    if (!notification.duration || notification.duration <= 0) return;
    if (this.removalTimers.has(notification.id)) return;

    const timer = setTimeout(() => {
      this.removalTimers.delete(notification.id);
      this.removeNotification(notification.id);
    }, notification.duration);
    this.removalTimers.set(notification.id, timer);
  }

  resolveConfirmation(confirmed: boolean) {
    this.notificationService.resolveConfirmation(confirmed);
  }

  private findNotificationElement(notificationId: string): HTMLElement | null {
    if (!this.notificationElements) return null;

    const elements = this.notificationElements.toArray();
    for (const elementRef of elements) {
      const element = elementRef.nativeElement;
      const notificationIndex = Array.from(element.parentElement?.children || []).indexOf(element);

      const currentNotifications = this.notifications();
      if (currentNotifications[notificationIndex]?.id === notificationId) {
        return element;
      }
    }
    return null;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'heroCheckCircle';
      case 'error':
        return 'heroXCircle';
      case 'warning':
        return 'heroExclamationTriangle';
      case 'info':
        return 'heroInformationCircle';
      default:
        return 'heroInformationCircle';
    }
  }
}
