import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NotificationService } from '../../core/notification.service';
import { NOTIFICATION_ICONS, AppNotification } from '../../models/notification.model';
import { IconComponent, IconName } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent],
  templateUrl: './notifications.component.html',
  styles: [':host { display: block; }'],
})
export class NotificationsComponent {
  private readonly service = inject(NotificationService);

  readonly unreadCount = this.service.unreadCount;
  readonly showUnreadOnly = signal(false);

  readonly visible = computed<AppNotification[]>(() =>
    this.showUnreadOnly() ? this.service.unread() : this.service.notifications(),
  );

  iconFor(notification: AppNotification): IconName {
    return NOTIFICATION_ICONS[notification.kind];
  }

  toggleFilter(): void {
    this.showUnreadOnly.update((value) => !value);
  }

  markAllRead(): void {
    this.service.markAllRead();
  }

  markRead(notification: AppNotification): void {
    this.service.markRead(notification.id);
  }
}
