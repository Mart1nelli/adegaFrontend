import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroCheckCircle, heroExclamationTriangle, heroInformationCircle, heroXCircle, heroXMark } from '@ng-icons/heroicons/outline';
import { Subscription } from 'rxjs';
import { Notification, NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, NgIconComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  providers: [provideIcons({ heroCheckCircle, heroXCircle, heroExclamationTriangle, heroInformationCircle, heroXMark })]
})
export class Notifications implements OnInit, OnDestroy {

  private notificationService = inject(NotificationService);
  private subscription!: Subscription;

  @ViewChildren('notificationElement') notificationElements!: QueryList<ElementRef>;

  notifications: Notification[] = [];

  ngOnInit() {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
        // Aguardar o próximo ciclo de detecção de mudanças
        setTimeout(() => {
          this.animateNotifications();
        }, 0);
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private animateNotifications() {
    this.notificationElements.forEach((elementRef, index) => {
      const element = elementRef.nativeElement;
      // Pequeno delay escalonado para cada notificação
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
    const elements = this.notificationElements.toArray();
    for (const elementRef of elements) {
      const element = elementRef.nativeElement;
      // Verificar se este elemento corresponde à notificação
      const notificationIndex = Array.from(element.parentElement?.children || []).indexOf(element);
      if (this.notifications[notificationIndex]?.id === notificationId) {
        return element;
      }
    }
    return null;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'heroCheckCircle';
      case 'error': return 'heroXCircle';
      case 'warning': return 'heroExclamationTriangle';
      case 'info': return 'heroInformationCircle';
      default: return 'heroInformationCircle';
    }
  }
}
