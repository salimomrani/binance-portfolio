// T041: Toast notification service

import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly DEFAULT_DURATION = 5000; // 5 seconds
  private notificationIdCounter = 0;

  // Signal for reactive notifications
  readonly notifications = signal<Notification[]>([]);

  /**
   * Shows a success notification
   */
  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  /**
   * Shows an error notification
   */
  error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  /**
   * Shows an info notification
   */
  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  /**
   * Shows a warning notification
   */
  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  /**
   * Shows a notification
   */
  private show(type: NotificationType, message: string, duration?: number): void {
    const notification: Notification = {
      id: `notification-${++this.notificationIdCounter}`,
      type,
      message,
      duration: duration ?? this.DEFAULT_DURATION
    };

    this.notifications.update(notifications => [...notifications, notification]);

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Removes a notification by ID
   */
  remove(id: string): void {
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  /**
   * Clears all notifications
   */
  clearAll(): void {
    this.notifications.set([]);
  }
}
