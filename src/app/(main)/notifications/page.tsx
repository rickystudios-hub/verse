'use client';

import * as React from 'react';
import { Bell, Heart, Repeat2, UserPlus, CheckCheck, MessageSquare, AtSign } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { socialStore } from '@/lib/store/social-store';
import { NotificationItem } from '@/types/database.types';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const currentUserId = '11111111-1111-4111-8111-111111111111';
  const [filter, setFilter] = React.useState<'all' | 'mentions'>('all');
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const loadNotifications = React.useCallback(() => {
    const items = socialStore.getNotifications(currentUserId);
    setNotifications(items);
    setIsLoaded(true);
  }, [currentUserId]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllAsRead = () => {
    socialStore.markAllNotificationsRead(currentUserId);
    loadNotifications();
  };

  const markAsRead = (id: string) => {
    socialStore.markNotificationRead(id);
    loadNotifications();
  };

  const displayedNotifications =
    filter === 'mentions'
      ? notifications.filter((n) => n.type === 'mention')
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur-md p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-foreground">Notificações</h1>
          <p className="text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={markAllAsRead}
            className="text-xs gap-1.5 text-accent hover:bg-accent/10"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-surface text-sm font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            filter === 'all' ? 'text-foreground' : 'text-slate-500'
          }`}
        >
          Todas ({notifications.length})
          {filter === 'all' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>
        <button
          onClick={() => setFilter('mentions')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            filter === 'mentions' ? 'text-foreground' : 'text-slate-500'
          }`}
        >
          Menções ({notifications.filter((n) => n.type === 'mention').length})
          {filter === 'mentions' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Notifications List */}
      {!isLoaded ? (
        <div className="p-6 text-center text-xs text-slate-500">Carregando notificações...</div>
      ) : displayedNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'mentions' ? 'Nenhuma menção' : 'Nenhuma notificação por enquanto'}
          description={
            filter === 'mentions'
              ? 'Quando alguém mencionar seu @username em uma publicação, você verá aqui.'
              : 'Interações, curtidas, respostas e novos seguidores aparecerão aqui.'
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {displayedNotifications.map((notif) => {
            const actor = notif.actor || {
              username: 'usuario',
              display_name: 'Usuário VÉRSE',
              avatar_url: null,
            };
            const isUnread = !notif.read_at;

            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`flex items-start gap-3 p-4 transition-colors cursor-pointer ${
                  isUnread
                    ? 'bg-accent/5 hover:bg-accent/10'
                    : 'bg-surface hover:bg-surface-muted/40'
                }`}
              >
                {/* Type Icon */}
                <div className="pt-1 shrink-0">
                  {notif.type === 'like' && <Heart className="h-5 w-5 text-rose-500 fill-current" />}
                  {notif.type === 'repost' && <Repeat2 className="h-5 w-5 text-emerald-500" />}
                  {notif.type === 'reply' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                  {notif.type === 'mention' && <AtSign className="h-5 w-5 text-purple-500" />}
                  {notif.type === 'follow' && <UserPlus className="h-5 w-5 text-accent" />}
                </div>

                {/* Actor & Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={actor.avatar_url} fallbackName={actor.display_name} size="sm" />
                    <Link
                      href={`/profile/${actor.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-xs text-foreground hover:underline truncate"
                    >
                      {actor.display_name}
                    </Link>
                    <span className="text-xs text-slate-500 truncate">@{actor.username}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-foreground">
                    {notif.type === 'like' && 'curtiu sua publicação'}
                    {notif.type === 'repost' && 'repostou sua publicação'}
                    {notif.type === 'reply' && 'respondeu à sua publicação'}
                    {notif.type === 'mention' && 'mencionou você em uma publicação'}
                    {notif.type === 'follow' && 'começou a seguir você'}
                  </p>

                  {notif.resource_id && (
                    <Link
                      href={`/post/${notif.resource_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 inline-block text-xs font-semibold text-accent hover:underline"
                    >
                      Ver discussão →
                    </Link>
                  )}
                </div>

                {isUnread && (
                  <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
