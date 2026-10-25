'use client';

import * as React from 'react';
import { Bell, Heart, Repeat2, UserPlus, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';
import Link from 'next/link';

interface MockNotification {
  id: string;
  type: 'like' | 'repost' | 'follow';
  actor: typeof INITIAL_MOCK_PROFILES[0];
  targetText?: string;
  createdAt: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const [filter, setFilter] = React.useState<'all' | 'mentions'>('all');
  const [notifications, setNotifications] = React.useState<MockNotification[]>([
    {
      id: 'notif-1',
      type: 'like',
      actor: INITIAL_MOCK_PROFILES[2],
      targetText: 'O suporte a Row Level Security (RLS) completo no PostgreSQL...',
      createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
      isRead: false,
    },
    {
      id: 'notif-2',
      type: 'follow',
      actor: INITIAL_MOCK_PROFILES[1],
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      isRead: false,
    },
    {
      id: 'notif-3',
      type: 'repost',
      actor: INITIAL_MOCK_PROFILES[2],
      targetText: 'Bem-vindo ao VÉRSE! Uma rede social concebida com princípios inegociáveis...',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      isRead: true,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
            Marcar lidas
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
          Todas
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
          Menções
          {filter === 'mentions' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Notifications List */}
      {filter === 'mentions' ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma menção recente"
          description="Quando alguém mencionar seu @username em uma publicação, você verá aqui."
        />
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-4 transition-colors ${
                notif.isRead ? 'bg-surface hover:bg-surface-muted/40' : 'bg-accent/5 hover:bg-accent/10'
              }`}
            >
              {/* Type Icon */}
              <div className="pt-1 shrink-0">
                {notif.type === 'like' && <Heart className="h-5 w-5 text-rose-500 fill-current" />}
                {notif.type === 'repost' && <Repeat2 className="h-5 w-5 text-emerald-500" />}
                {notif.type === 'follow' && <UserPlus className="h-5 w-5 text-accent" />}
              </div>

              {/* Actor & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar src={notif.actor.avatar_url} fallbackName={notif.actor.display_name} size="sm" />
                  <Link href={`/profile/${notif.actor.username}`} className="font-bold text-xs text-foreground hover:underline truncate">
                    {notif.actor.display_name}
                  </Link>
                  <span className="text-xs text-slate-500 truncate">@{notif.actor.username}</span>
                </div>

                <p className="text-xs text-foreground">
                  {notif.type === 'like' && 'curtiu sua publicação'}
                  {notif.type === 'repost' && 'repostou sua publicação'}
                  {notif.type === 'follow' && 'começou a seguir você'}
                </p>

                {notif.targetText && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic border-l-2 border-border pl-2">
                    &quot;{notif.targetText}&quot;
                  </p>
                )}
              </div>

              {!notif.isRead && (
                <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
