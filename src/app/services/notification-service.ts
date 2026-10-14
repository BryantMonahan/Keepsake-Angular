import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AlertService } from './alert-service';
import axios from 'axios';
import { AuthService } from './auth-service';
import { Notification } from '../Types/notification';
import { NotificationType } from '../Types/notification-type';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private alertService = inject(AlertService)
  private authService = inject(AuthService)
  notifications = signal<Notification[]>([])
  mostRecent = signal<string | null>(null)
  intervalId = signal<number | null>(null)

  startPolling() {
    this.intervalId.set(setInterval(() => this.getNotification(), 2500))
  }

  async getNotification() {
    if (!this.authService.isLoggedIn()) return
    const notifRes = await axios.get<Notification[]>(`${import.meta.env.NG_APP_API_URL}/api/notification/notifications`, {
      params: { sinceUtc: this.mostRecent() }
    })
    if (notifRes.data.length > 0) {
      const newNotifs = [...notifRes.data].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

      this.notifications.update(curr => [...curr, ...newNotifs])
      const newestEntry = newNotifs[newNotifs.length - 1]
      // set most recent to the time of the most recent notification
      if (this.mostRecent() !== null) {
        const color = newestEntry.type === NotificationType.Alert ? 'green' : newestEntry.type === NotificationType.Error ? 'red' : 'yellow'
        this.alertService.openSnackbar(newestEntry.notificationText, color, 2000)
      }
      this.mostRecent.set(newestEntry.created)
    }
  }

  ngOnDestroy() {
    if (this.intervalId() !== null) {
      clearInterval(this.intervalId() ?? undefined)
    }
  }
}
