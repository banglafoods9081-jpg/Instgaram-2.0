export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  website?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  followers?: string[];
  following?: string[];
  followersCount: number;
  followingCount: number;
  postsCount?: number;
  reelsCount?: number;
  isFollowing?: boolean;
  savedPosts?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  location?: string;
  audioTrack?: string;
  likesCount: number;
  isLiked: boolean;
  isSaved?: boolean;
  commentsCount: number;
  comments: Comment[];
  createdAt: string;
  tags?: string[];
}

export interface Reel {
  id: string;
  userId: string;
  user: User;
  videoUrl: string;
  caption: string;
  audioTrack: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  comments: Comment[];
  viewsCount: number;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewedBy: string[];
}

export interface StoryGroup {
  userId: string;
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
  latestTimestamp: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'voice' | 'heart';
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  conversationId: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
  isOnline: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string;
  actor: User;
  type: 'like' | 'comment' | 'follow' | 'mention';
  postId?: string;
  postMediaUrl?: string;
  text?: string;
  createdAt: string;
  isRead: boolean;
}
