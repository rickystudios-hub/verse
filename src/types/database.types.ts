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
  expires_at?: string | null;
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

export type ModerationDecision = 
  | 'warn' 
  | 'hide_post' 
  | 'delete_post' 
  | 'suspend_user' 
  | 'ban_user' 
  | 'dismiss';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'profile';
  target_id: string;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter?: Profile;
  target_post?: Post;
  target_profile?: Profile;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_type: 'post' | 'profile';
  target_id: string;
  action_taken: ModerationDecision;
  reason: string;
  created_at: string;
  moderator?: Profile;
}

export type AIFeature = 'grammar' | 'tone' | 'clarify' | 'summarize' | 'hashtags';
export type AITone = 'formal' | 'casual' | 'poetic' | 'concise';

export interface AIUsageRecord {
  id: string;
  user_id: string;
  feature: AIFeature;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
}

export interface AIQuotaInfo {
  used: number;
  max: number;
  remaining: number;
  resetAt: string;
}

export interface UserDataExport {
  exportVersion: string;
  exportedAt: string;
  profile: Profile;
  posts: Post[];
  followersCount: number;
  followingCount: number;
  followers: Profile[];
  following: Profile[];
  aiUsageHistory: AIUsageRecord[];
  reportsSubmitted: Report[];
  privacyDisclaimer: string;
}
