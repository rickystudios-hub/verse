export type UserRole = 'user' | 'moderator' | 'admin';

export type NotificationType = 
  | 'like' 
  | 'reply' 
  | 'repost' 
  | 'follow' 
  | 'follow_request' 
  | 'mention' 
  | 'message_received';

export type ReportCategory = 
  | 'spam' 
  | 'harassment' 
  | 'hate_speech' 
  | 'violence' 
  | 'misinformation' 
  | 'impersonation' 
  | 'other';

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  is_private: boolean;
  is_suspended: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  parent_id: string | null;
  repost_of_id: string | null;
  likes_count: number;
  replies_count: number;
  reposts_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joins opcionais
  author?: Profile;
  parent?: Post;
  repost_of?: Post;
  has_liked?: boolean;
  has_reposted?: boolean;
}

export interface Like {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Repost {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id: string;
  actor?: Profile;
  type: NotificationType;
  resource_id: string | null;
  read_at: string | null;
  created_at: string;
}
