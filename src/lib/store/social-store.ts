import { Post, Profile, NotificationItem } from '@/types/database.types';
import { INITIAL_MOCK_POSTS, INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';
import { extractEntities } from '@/lib/security/sanitize';

const POSTS_STORAGE_KEY = 'verse_posts_v1';
const PROFILES_STORAGE_KEY = 'verse_profiles_v1';
const FOLLOWS_STORAGE_KEY = 'verse_follows_v1';
const LIKES_STORAGE_KEY = 'verse_likes_v1';
const REPOSTS_STORAGE_KEY = 'verse_reposts_v1';
const NOTIFICATIONS_STORAGE_KEY = 'verse_notifications_v1';

export interface FollowRecord {
  follower_id: string;
  following_id: string;
}

export interface LikeRecord {
  user_id: string;
  post_id: string;
}

export interface RepostRecord {
  user_id: string;
  post_id: string;
}

// Initial follows
const INITIAL_FOLLOWS: FollowRecord[] = [
  { follower_id: INITIAL_MOCK_PROFILES[0].id, following_id: INITIAL_MOCK_PROFILES[1].id },
];

class SocialStore {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private load<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private save<T>(key: string, data: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // localStorage may be full or blocked
    }
  }

  // --- POSTS ---
  public getPosts(tab: 'for_you' | 'following' = 'for_you', currentUserId = INITIAL_MOCK_PROFILES[0].id): Post[] {
    const posts = this.load<Post[]>(POSTS_STORAGE_KEY, INITIAL_MOCK_POSTS);
    const follows = this.load<FollowRecord[]>(FOLLOWS_STORAGE_KEY, INITIAL_FOLLOWS);
    const likes = this.load<LikeRecord[]>(LIKES_STORAGE_KEY, []);
    const reposts = this.load<RepostRecord[]>(REPOSTS_STORAGE_KEY, []);
    const profiles = this.getProfiles();

    // Attach current author and user interaction flags
    const enriched = posts
      .filter((p) => !p.is_deleted && !p.parent_id) // only root posts in main feeds
      .map((p) => {
        const author = profiles.find((prof) => prof.id === p.author_id) || p.author;
        const has_liked = likes.some((l) => l.user_id === currentUserId && l.post_id === p.id);
        const has_reposted = reposts.some((r) => r.user_id === currentUserId && r.post_id === p.id);
        return {
          ...p,
          author,
          has_liked,
          has_reposted,
        };
      });

    if (tab === 'following') {
      const followingIds = follows
        .filter((f) => f.follower_id === currentUserId)
        .map((f) => f.following_id);
      return enriched.filter((p) => followingIds.includes(p.author_id));
    }

    return enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getPostById(postId: string, currentUserId = INITIAL_MOCK_PROFILES[0].id): { post: Post | null; replies: Post[] } {
    const posts = this.load<Post[]>(POSTS_STORAGE_KEY, INITIAL_MOCK_POSTS);
    const likes = this.load<LikeRecord[]>(LIKES_STORAGE_KEY, []);
    const reposts = this.load<RepostRecord[]>(REPOSTS_STORAGE_KEY, []);
    const profiles = this.getProfiles();

    const target = posts.find((p) => p.id === postId && !p.is_deleted);
    if (!target) {
      return { post: null, replies: [] };
    }

    const enrich = (p: Post): Post => {
      const author = profiles.find((prof) => prof.id === p.author_id) || p.author;
      const has_liked = likes.some((l) => l.user_id === currentUserId && l.post_id === p.id);
      const has_reposted = reposts.some((r) => r.user_id === currentUserId && r.post_id === p.id);
      return { ...p, author, has_liked, has_reposted };
    };

    const enrichedPost = enrich(target);
    const replies = posts
      .filter((p) => p.parent_id === postId && !p.is_deleted)
      .map(enrich)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return { post: enrichedPost, replies };
  }

  public createPost(
    authorId: string,
    content: string,
    mediaUrls: string[] = [],
    parentId: string | null = null
  ): Post {
    const posts = this.load<Post[]>(POSTS_STORAGE_KEY, INITIAL_MOCK_POSTS);
    const author = this.getProfileById(authorId) || INITIAL_MOCK_PROFILES[0];

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author_id: authorId,
      content: content.trim(),
      media_urls: mediaUrls,
      parent_id: parentId,
      repost_of_id: null,
      likes_count: 0,
      replies_count: 0,
      reposts_count: 0,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author,
      has_liked: false,
      has_reposted: false,
    };

    // If this is a reply, increment replies_count of parent post atomically
    if (parentId) {
      const parentIndex = posts.findIndex((p) => p.id === parentId);
      if (parentIndex !== -1) {
        posts[parentIndex].replies_count += 1;
        // Generate notification for parent post author
        if (posts[parentIndex].author_id !== authorId) {
          this.createNotification(
            posts[parentIndex].author_id,
            authorId,
            'reply',
            newPost.id
          );
        }
      }
    }

    // Check for mentions and notify
    const { mentions } = extractEntities(content);
    for (const mentionUsername of mentions) {
      const targetUser = this.getProfileByUsername(mentionUsername);
      if (targetUser && targetUser.id !== authorId) {
        this.createNotification(targetUser.id, authorId, 'mention', newPost.id);
      }
    }

    posts.unshift(newPost);
    this.save(POSTS_STORAGE_KEY, posts);
    return newPost;
  }

  public deletePost(postId: string, requestingUserId: string): { success: boolean; error?: string } {
    const posts = this.load<Post[]>(POSTS_STORAGE_KEY, INITIAL_MOCK_POSTS);
    const postIndex = posts.findIndex((p) => p.id === postId);

    if (postIndex === -1) {
      return { success: false, error: 'Publicação não encontrada.' };
    }

    const post = posts[postIndex];
    // Authorization check: only author can delete
    if (post.author_id !== requestingUserId) {
      return { success: false, error: 'Acesso negado: você não tem permissão para excluir esta publicação.' };
    }

    // Decrement parent replies_count if this was a reply
    if (post.parent_id) {
      const parent = posts.find((p) => p.id === post.parent_id);
      if (parent) {
        parent.replies_count = Math.max(0, parent.replies_count - 1);
      }
    }

    posts[postIndex].is_deleted = true;
    this.save(POSTS_STORAGE_KEY, posts);
    return { success: true };
  }

  // --- LIKES ---
  public toggleLike(postId: string, userId: string): { hasLiked: boolean; newCount: number } {
    const posts = this.load<Post[]>(POSTS_STORAGE_KEY, INITIAL_MOCK_POSTS);
    let likes = this.load<LikeRecord[]>(LIKES_STORAGE_KEY, []);
    const post = posts.find((p) => p.id === postId);

    const existingIndex = likes.findIndex((l) => l.user_id === userId && l.post_id === postId);
    let hasLiked = false;

    if (existingIndex !== -1) {
      // Unlike
      likes = likes.filter((_, idx) => idx !== existingIndex);
      if (post) post.likes_count = Math.max(0, post.likes_count - 1);
      hasLiked = false;
    } else {
      // Like (Atomic uniqueness guaranteed by composite check)
      likes.push({ user_id: userId, post_id: postId });
      if (post) {
        post.likes_count += 1;
        // Create notification for post author if not liking own post
        if (post.author_id !== userId) {
          this.createNotification(post.author_id, userId, 'like', postId);
        }
      }
      hasLiked = true;
    }

    this.save(LIKES_STORAGE_KEY, likes);
    this.save(POSTS_STORAGE_KEY, posts);
    return { hasLiked, newCount: post?.likes_count || 0 };
  }

  // --- REPOSTS ---
  public toggleRepost(postId: string, userId: string): { hasReposted: boolean; newCount: number } {
    const posts = this.load<Post[]>(POSTS_STORAGE_KEY, INITIAL_MOCK_POSTS);
    let reposts = this.load<RepostRecord[]>(REPOSTS_STORAGE_KEY, []);
    const post = posts.find((p) => p.id === postId);

    const existingIndex = reposts.findIndex((r) => r.user_id === userId && r.post_id === postId);
    let hasReposted = false;

    if (existingIndex !== -1) {
      reposts = reposts.filter((_, idx) => idx !== existingIndex);
      if (post) post.reposts_count = Math.max(0, post.reposts_count - 1);
      hasReposted = false;
    } else {
      reposts.push({ user_id: userId, post_id: postId });
      if (post) {
        post.reposts_count += 1;
        if (post.author_id !== userId) {
          this.createNotification(post.author_id, userId, 'repost', postId);
        }
      }
      hasReposted = true;
    }

    this.save(REPOSTS_STORAGE_KEY, reposts);
    this.save(POSTS_STORAGE_KEY, posts);
    return { hasReposted, newCount: post?.reposts_count || 0 };
  }

  // --- PROFILES ---
  public getProfiles(): Profile[] {
    return this.load<Profile[]>(PROFILES_STORAGE_KEY, INITIAL_MOCK_PROFILES);
  }

  public getProfileByUsername(username: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.username.toLowerCase() === username.toLowerCase()) || null;
  }

  public getProfileById(userId: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.id === userId) || null;
  }

  public updateProfile(
    userId: string,
    data: { displayName: string; bio: string; isPrivate?: boolean }
  ): Profile {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === userId);

    if (index === -1) {
      throw new Error('Perfil não encontrado.');
    }

    profiles[index] = {
      ...profiles[index],
      display_name: data.displayName.trim(),
      bio: data.bio.trim(),
      is_private: data.isPrivate !== undefined ? data.isPrivate : profiles[index].is_private,
      updated_at: new Date().toISOString(),
    };

    this.save(PROFILES_STORAGE_KEY, profiles);
    return profiles[index];
  }

  // --- FOLLOWS ---
  public toggleFollow(followerId: string, followingId: string): { isFollowing: boolean; followersCount: number } {
    if (followerId === followingId) {
      throw new Error('Não é permitido seguir a si mesmo.');
    }

    let follows = this.load<FollowRecord[]>(FOLLOWS_STORAGE_KEY, INITIAL_FOLLOWS);
    const existingIndex = follows.findIndex(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );

    let isFollowing = false;
    if (existingIndex !== -1) {
      follows = follows.filter((_, idx) => idx !== existingIndex);
      isFollowing = false;
    } else {
      follows.push({ follower_id: followerId, following_id: followingId });
      isFollowing = true;
      this.createNotification(followingId, followerId, 'follow', null);
    }

    this.save(FOLLOWS_STORAGE_KEY, follows);
    const followersCount = follows.filter((f) => f.following_id === followingId).length;
    return { isFollowing, followersCount };
  }

  public isFollowing(followerId: string, followingId: string): boolean {
    const follows = this.load<FollowRecord[]>(FOLLOWS_STORAGE_KEY, INITIAL_FOLLOWS);
    return follows.some((f) => f.follower_id === followerId && f.following_id === followingId);
  }

  public getFollowers(userId: string): Profile[] {
    const follows = this.load<FollowRecord[]>(FOLLOWS_STORAGE_KEY, INITIAL_FOLLOWS);
    const profiles = this.getProfiles();
    const followerIds = follows.filter((f) => f.following_id === userId).map((f) => f.follower_id);
    return profiles.filter((p) => followerIds.includes(p.id));
  }

  public getFollowing(userId: string): Profile[] {
    const follows = this.load<FollowRecord[]>(FOLLOWS_STORAGE_KEY, INITIAL_FOLLOWS);
    const profiles = this.getProfiles();
    const followingIds = follows.filter((f) => f.follower_id === userId).map((f) => f.following_id);
    return profiles.filter((p) => followingIds.includes(p.id));
  }

  // --- NOTIFICATIONS ---
  private createNotification(
    recipientId: string,
    actorId: string,
    type: NotificationItem['type'],
    resourceId: string | null
  ): void {
    const notifications = this.load<NotificationItem[]>(NOTIFICATIONS_STORAGE_KEY, []);
    const actor = this.getProfileById(actorId);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient_id: recipientId,
      actor_id: actorId,
      actor: actor || undefined,
      type,
      resource_id: resourceId,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    notifications.unshift(newNotif);
    this.save(NOTIFICATIONS_STORAGE_KEY, notifications);
  }

  public getNotifications(userId: string): NotificationItem[] {
    const notifications = this.load<NotificationItem[]>(NOTIFICATIONS_STORAGE_KEY, []);
    const profiles = this.getProfiles();

    return notifications
      .filter((n) => n.recipient_id === userId)
      .map((n) => ({
        ...n,
        actor: profiles.find((p) => p.id === n.actor_id) || n.actor,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationRead(notificationId: string): void {
    const notifications = this.load<NotificationItem[]>(NOTIFICATIONS_STORAGE_KEY, []);
    const target = notifications.find((n) => n.id === notificationId);
    if (target) {
      target.read_at = new Date().toISOString();
      this.save(NOTIFICATIONS_STORAGE_KEY, notifications);
    }
  }

  public markAllNotificationsRead(userId: string): void {
    const notifications = this.load<NotificationItem[]>(NOTIFICATIONS_STORAGE_KEY, []);
    for (const notif of notifications) {
      if (notif.recipient_id === userId && !notif.read_at) {
        notif.read_at = new Date().toISOString();
      }
    }
    this.save(NOTIFICATIONS_STORAGE_KEY, notifications);
  }

  // --- SEARCH ---
  public search(query: string): { posts: Post[]; profiles: Profile[] } {
    const clean = query.trim().toLowerCase();
    if (!clean) return { posts: [], profiles: [] };

    const posts = this.getPosts('for_you');
    const profiles = this.getProfiles();

    const matchedPosts = posts.filter(
      (p) =>
        p.content.toLowerCase().includes(clean) ||
        p.author?.username.toLowerCase().includes(clean) ||
        p.author?.display_name.toLowerCase().includes(clean)
    );

    const matchedProfiles = profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(clean) ||
        p.display_name.toLowerCase().includes(clean) ||
        (p.bio && p.bio.toLowerCase().includes(clean))
    );

    return { posts: matchedPosts, profiles: matchedProfiles };
  }
}

export const socialStore = new SocialStore();
