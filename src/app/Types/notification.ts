import { NotificationType } from "./notification-type"

export interface Notification {
    id: string
    userId: string
    created: string // ISO string 
    isRead: boolean
    notificationText: string
    type: NotificationType
}