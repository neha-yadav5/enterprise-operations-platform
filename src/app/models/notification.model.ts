import { IconName } from '../shared/icon/icon.component';

export type NotificationKind =
  | 'approval'
  | 'project'
  | 'asset'
  | 'document'
  | 'mention'
  | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  /** Router link to the thing this notification is about, when there is one. */
  link: string[] | null;
}

export const NOTIFICATION_ICONS: Record<NotificationKind, IconName> = {
  approval: 'inbox',
  project: 'folder',
  asset: 'laptop',
  document: 'document',
  mention: 'users',
  system: 'shield',
};
