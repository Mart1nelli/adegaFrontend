import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  QueryList,
  ViewChildren,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroCheckCircle,
  heroExclamationTriangle,
  heroInformationCircle,
  heroXCircle,
  heroXMark,
} from '@ng-icons/heroicons/outline';
import { NotificationService } from '../../../core/services/notification.service';

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

  constructor() {
    effect(() => {
      // Re-executa sempre que a lista de notificações mudar
      this.notifications(); // Registra a dependência do Signal
      setTimeout(() => {
        this.animateNotifications();
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
    const element = this.findNotificationElement(id);
    if (element) {
      element.classList.add('notification--exiting');
      setTimeout(() => {
        this.notificationService.removeNotification(id);
      }, 300);
    } else {
      this.notificationService.removeNotification(id);
    }
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
