import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  User,
  Post,
  Reel,
  Story,
  StoryGroup,
  Message,
  Conversation,
  NotificationItem,
  Comment
} from '../types/instagram';

interface InstagramContextType {
  authReady: boolean;
  firebaseUser: FirebaseUser | null;
  needsOnboarding: boolean;
  authError: string | null;
  currentUser: User | null;
  users: User[];
  posts: Post[];
  reels: Reel[];
  storyGroups: StoryGroup[];
  conversations: Conversation[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  currentChatUserId: string | null;
  chatMessages: Message[];
  isChatUserTyping: boolean;
  theme: 'dark' | 'light';
  activeTab: 'feed' | 'explore' | 'reels' | 'messages' | 'notifications' | 'profile';
  viewProfileUserId: string | null;
  isCreateModalOpen: boolean;
  createModalType: 'post' | 'reel' | 'story';
  selectedPostDetail: Post | null;
  activeStoryGroup: StoryGroup | null;
  isSettingsOpen: boolean;

  // Auth Actions
  signInWithGoogle: () => Promise<void>;
  completeRegistration: (data: { username: string; name: string; bio: string; avatar: string }) => Promise<void>;
  logout: () => Promise<void>;

  // UI Actions
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveTab: (tab: 'feed' | 'explore' | 'reels' | 'messages' | 'notifications' | 'profile') => void;
  openProfile: (userId?: string) => void;
  openCreateModal: (type?: 'post' | 'reel' | 'story') => void;
  closeCreateModal: () => void;
  setSelectedPostDetail: (post: Post | null) => void;
  setActiveStoryGroup: (group: StoryGroup | null) => void;
  setIsSettingsOpen: (open: boolean) => void;

  // User Actions
  updateProfile: (data: Partial<User>) => Promise<void>;
  toggleFollow: (targetUserId: string) => Promise<void>;

  // Content Actions
  createPost: (data: { mediaUrl: string; mediaType: 'image' | 'video'; caption: string; location?: string; audioTrack?: string; tags?: string[] }) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  commentPost: (postId: string, text: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  savePost: (postId: string) => Promise<void>;

  // Reels Actions
  createReel: (data: { videoUrl: string; caption: string; audioTrack?: string }) => Promise<void>;
  likeReel: (reelId: string) => Promise<void>;
  commentReel: (reelId: string, text: string) => Promise<void>;

  // Stories Actions
  createStory: (data: { mediaUrl: string; mediaType: 'image' | 'video'; caption?: string }) => Promise<void>;
  markStoryViewed: (storyId: string) => Promise<void>;

  // Messages Actions
  openChatWithUser: (userId: string) => void;
  closeChat: () => void;
  sendMessage: (text?: string, mediaUrl?: string, mediaType?: 'image' | 'voice' | 'heart') => Promise<void>;
  sendTyping: (isTyping: boolean) => void;

  // Notifications
  markNotificationsAsRead: () => Promise<void>;
}

const InstagramContext = createContext<InstagramContextType | undefined>(undefined);

function tsToIso(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return new Date().toISOString();
}

function makeConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

function makeDocId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const FALLBACK_USER: User = {
  id: 'unknown',
  username: 'instagrammer',
  name: 'Instagram User',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  bio: '',
  isVerified: false,
  followersCount: 0,
  followingCount: 0,
  followers: [],
  following: []
};

export const InstagramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [rawUsers, setRawUsers] = useState<User[]>([]);
  const [follows, setFollows] = useState<{ followerId: string; targetId: string }[]>([]);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  const [rawPosts, setRawPosts] = useState<any[]>([]);
  const [postLikesMap, setPostLikesMap] = useState<Record<string, string[]>>({});
  const [postCommentsMap, setPostCommentsMap] = useState<Record<string, any[]>>({});

  const [rawReels, setRawReels] = useState<any[]>([]);
  const [reelLikesMap, setReelLikesMap] = useState<Record<string, string[]>>({});
  const [reelCommentsMap, setReelCommentsMap] = useState<Record<string, any[]>>({});

  const [rawStories, setRawStories] = useState<any[]>([]);
  const [storyViewsMap, setStoryViewsMap] = useState<Record<string, string[]>>({});

  const [rawConversations, setRawConversations] = useState<any[]>([]);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatUserTyping, setIsChatUserTyping] = useState<boolean>(false);

  const [rawNotifications, setRawNotifications] = useState<any[]>([]);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'reels' | 'messages' | 'notifications' | 'profile'>('feed');
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'post' | 'reel' | 'story'>('post');
  const [selectedPostDetailId, setSelectedPostDetailId] = useState<string | null>(null);
  const [activeStoryGroupUserId, setActiveStoryGroupUserId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const typingTimerRef = useRef<any>(null);

  // ------------------------------------------------------------------
  // 1. Firebase Auth Listener
  // ------------------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setAuthError(null);
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setNeedsOnboarding(false);
        setRawUsers([]);
        setRawPosts([]);
        setRawReels([]);
        setRawStories([]);
        setRawConversations([]);
        setRawNotifications([]);
        setChatMessages([]);
        setSavedPosts([]);
        setAuthReady(true);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
          // Mark user online
          updateDoc(userDocRef, {
            isOnline: true,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // ------------------------------------------------------------------
  // 2. Real-Time Firestore Listeners (Active only when logged in & onboarded)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!authReady || !firebaseUser || needsOnboarding) return;
    const uid = firebaseUser.uid;

    // Users directory
    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('visibility', '==', 'public')),
      (snapshot) => {
        const list: User[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            username: data.username,
            name: data.name,
            avatar: data.avatar,
            bio: data.bio || '',
            website: data.website || '',
            isVerified: Boolean(data.isVerified),
            isPrivate: Boolean(data.isPrivate),
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            postsCount: data.postsCount || 0,
            followers: [],
            following: []
          };
        });
        setRawUsers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    // Private info (savedPosts)
    const unsubPrivate = onSnapshot(
      doc(db, 'users', uid, 'private', 'info'),
      (snap) => {
        if (snap.exists()) {
          setSavedPosts(snap.data().savedPosts || []);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/private/info`)
    );

    // Follows
    const unsubFollows = onSnapshot(
      query(collection(db, 'follows'), where('visibility', '==', 'public')),
      (snapshot) => {
        setFollows(
          snapshot.docs.map((d) => ({
            followerId: d.data().followerId,
            targetId: d.data().targetId
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'follows')
    );

    // Posts
    const unsubPosts = onSnapshot(
      query(collection(db, 'posts'), where('visibility', '==', 'public')),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: tsToIso(d.data().createdAt)
        }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRawPosts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'posts')
    );

    // Reels
    const unsubReels = onSnapshot(
      query(collection(db, 'reels'), where('visibility', '==', 'public')),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: tsToIso(d.data().createdAt)
        }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRawReels(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reels')
    );

    // Stories
    const unsubStories = onSnapshot(
      query(collection(db, 'stories'), where('visibility', '==', 'public')),
      (snapshot) => {
        const now = Date.now();
        const list = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: tsToIso(d.data().createdAt),
            expiresAt: tsToIso(d.data().expiresAt)
          }))
          .filter((s) => new Date(s.expiresAt).getTime() > now);
        setRawStories(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stories')
    );

    // Conversations
    const unsubConversations = onSnapshot(
      query(collection(db, 'conversations'), where('participants', 'array-contains', uid)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          lastMessageAt: tsToIso(d.data().lastMessageAt),
          updatedAt: tsToIso(d.data().updatedAt)
        }));
        setRawConversations(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'conversations')
    );

    // Notifications
    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', uid)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: tsToIso(d.data().createdAt)
        }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRawNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    return () => {
      unsubUsers();
      unsubPrivate();
      unsubFollows();
      unsubPosts();
      unsubReels();
      unsubStories();
      unsubConversations();
      unsubNotifications();
    };
  }, [authReady, firebaseUser, needsOnboarding]);

  // ------------------------------------------------------------------
  // 3. Subcollection Listeners for Posts, Reels, Stories
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!authReady || !firebaseUser || needsOnboarding) return;
    const unsubs: (() => void)[] = [];

    rawPosts.forEach((p) => {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'posts', p.id, 'likes'), where('visibility', '==', 'public')),
          (snap) => {
            setPostLikesMap((prev) => ({ ...prev, [p.id]: snap.docs.map((d) => d.data().userId) }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, `posts/${p.id}/likes`)
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'posts', p.id, 'comments'), where('visibility', '==', 'public')),
          (snap) => {
            const comments = snap.docs
              .map((d) => ({ id: d.id, ...d.data(), createdAt: tsToIso(d.data().createdAt) }))
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setPostCommentsMap((prev) => ({ ...prev, [p.id]: comments }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, `posts/${p.id}/comments`)
        )
      );
    });

    return () => unsubs.forEach((u) => u());
  }, [rawPosts.map((p) => p.id).join(','), authReady, firebaseUser, needsOnboarding]);

  useEffect(() => {
    if (!authReady || !firebaseUser || needsOnboarding) return;
    const unsubs: (() => void)[] = [];

    rawReels.forEach((r) => {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'reels', r.id, 'likes'), where('visibility', '==', 'public')),
          (snap) => {
            setReelLikesMap((prev) => ({ ...prev, [r.id]: snap.docs.map((d) => d.data().userId) }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, `reels/${r.id}/likes`)
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'reels', r.id, 'comments'), where('visibility', '==', 'public')),
          (snap) => {
            const comments = snap.docs
              .map((d) => ({ id: d.id, ...d.data(), createdAt: tsToIso(d.data().createdAt) }))
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setReelCommentsMap((prev) => ({ ...prev, [r.id]: comments }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, `reels/${r.id}/comments`)
        )
      );
    });

    return () => unsubs.forEach((u) => u());
  }, [rawReels.map((r) => r.id).join(','), authReady, firebaseUser, needsOnboarding]);

  useEffect(() => {
    if (!authReady || !firebaseUser || needsOnboarding) return;
    const unsubs: (() => void)[] = [];

    rawStories.forEach((s) => {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'stories', s.id, 'views'), where('visibility', '==', 'public')),
          (snap) => {
            setStoryViewsMap((prev) => ({ ...prev, [s.id]: snap.docs.map((d) => d.data().userId) }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, `stories/${s.id}/views`)
        )
      );
    });

    return () => unsubs.forEach((u) => u());
  }, [rawStories.map((s) => s.id).join(','), authReady, firebaseUser, needsOnboarding]);

  // ------------------------------------------------------------------
  // 4. Active Chat Messages Listener & Read Receipts
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!authReady || !firebaseUser || needsOnboarding || !currentChatUserId) {
      setChatMessages([]);
      setIsChatUserTyping(false);
      return;
    }

    const uid = firebaseUser.uid;
    const convId = makeConversationId(uid, currentChatUserId);

    const unsubMessages = onSnapshot(
      query(collection(db, 'conversations', convId, 'messages'), where('participants', 'array-contains', uid)),
      (snapshot) => {
        const msgs: Message[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              receiverId: data.receiverId,
              text: data.text,
              mediaUrl: data.mediaUrl,
              mediaType: data.mediaType === 'none' ? undefined : data.mediaType,
              createdAt: tsToIso(data.createdAt),
              isRead: Boolean(data.isRead)
            };
          })
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        setChatMessages(msgs);

        // Mark incoming unread messages as read
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (data.receiverId === uid && !data.isRead) {
            updateDoc(doc(db, 'conversations', convId, 'messages', d.id), {
              isRead: true
            }).catch(() => {});
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `conversations/${convId}/messages`)
    );

    // Watch typing indicator on parent conversation
    const conv = rawConversations.find((c) => c.id === convId);
    setIsChatUserTyping(Boolean(conv?.typingUserId && conv.typingUserId === currentChatUserId));

    return () => unsubMessages();
  }, [authReady, firebaseUser, needsOnboarding, currentChatUserId, rawConversations]);

  // ------------------------------------------------------------------
  // 5. Enriched Computed State
  // ------------------------------------------------------------------
  const users: User[] = rawUsers.map((u) => {
    const uFollowers = follows.filter((f) => f.targetId === u.id).map((f) => f.followerId);
    const uFollowing = follows.filter((f) => f.followerId === u.id).map((f) => f.targetId);
    return {
      ...u,
      followers: uFollowers,
      following: uFollowing,
      followersCount: uFollowers.length,
      followingCount: uFollowing.length
    };
  });

  const currentUser: User | null = firebaseUser
    ? (() => {
        const found = users.find((u) => u.id === firebaseUser.uid);
        return found ? { ...found, savedPosts } : null;
      })()
    : null;

  const findUser = useCallback(
    (uid: string): User => users.find((u) => u.id === uid) || { ...FALLBACK_USER, id: uid },
    [users]
  );

  const posts: Post[] = rawPosts.map((p) => {
    const likes = postLikesMap[p.id] || [];
    const comments: Comment[] = (postCommentsMap[p.id] || []).map((c) => ({
      id: c.id,
      userId: c.userId,
      user: findUser(c.userId),
      text: c.text,
      createdAt: c.createdAt,
      likesCount: 0
    }));
    return {
      id: p.id,
      userId: p.userId,
      user: findUser(p.userId),
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      caption: p.caption || '',
      location: p.location || '',
      audioTrack: p.audioTrack || '',
      likesCount: likes.length || p.likesCount || 0,
      isLiked: firebaseUser ? likes.includes(firebaseUser.uid) : false,
      isSaved: savedPosts.includes(p.id),
      commentsCount: comments.length || p.commentsCount || 0,
      comments,
      createdAt: p.createdAt,
      tags: p.tags || []
    };
  });

  const reels: Reel[] = rawReels.map((r) => {
    const likes = reelLikesMap[r.id] || [];
    const comments: Comment[] = (reelCommentsMap[r.id] || []).map((c) => ({
      id: c.id,
      userId: c.userId,
      user: findUser(c.userId),
      text: c.text,
      createdAt: c.createdAt,
      likesCount: 0
    }));
    return {
      id: r.id,
      userId: r.userId,
      user: findUser(r.userId),
      videoUrl: r.videoUrl,
      caption: r.caption || '',
      audioTrack: r.audioTrack || 'Original Audio',
      likesCount: likes.length || r.likesCount || 0,
      isLiked: firebaseUser ? likes.includes(firebaseUser.uid) : false,
      commentsCount: comments.length || r.commentsCount || 0,
      comments,
      viewsCount: r.viewsCount || 1,
      createdAt: r.createdAt
    };
  });

  const storyGroups: StoryGroup[] = (() => {
    const grouped = new Map<string, Story[]>();
    rawStories.forEach((s) => {
      const viewedBy = storyViewsMap[s.id] || [];
      const item: Story = {
        id: s.id,
        userId: s.userId,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        viewedBy
      };
      if (!grouped.has(s.userId)) grouped.set(s.userId, []);
      grouped.get(s.userId)!.push(item);
    });

    const list: StoryGroup[] = [];
    grouped.forEach((storiesList, uid) => {
      const sorted = [...storiesList].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const hasUnviewed = firebaseUser
        ? sorted.some((s) => !s.viewedBy.includes(firebaseUser.uid))
        : true;
      list.push({
        userId: uid,
        user: findUser(uid),
        stories: sorted,
        hasUnviewed,
        latestTimestamp: Math.max(...sorted.map((s) => new Date(s.createdAt).getTime()))
      });
    });

    list.sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return b.latestTimestamp - a.latestTimestamp;
    });

    return list;
  })();

  const conversations: Conversation[] = (() => {
    if (!firebaseUser) return [];
    const uid = firebaseUser.uid;
    const convMap = new Map<string, Conversation>();

    rawConversations.forEach((c) => {
      const otherId = (c.participants as string[]).find((p) => p !== uid);
      if (!otherId) return;
      const participant = findUser(otherId);
      convMap.set(otherId, {
        conversationId: c.id,
        participant,
        lastMessage: {
          id: `last_${c.id}`,
          conversationId: c.id,
          senderId: c.lastMessageSenderId || otherId,
          receiverId: c.lastMessageSenderId === uid ? otherId : uid,
          text: c.lastMessageText || 'Say hi! 👋',
          createdAt: c.lastMessageAt,
          isRead: true
        },
        unreadCount: 0,
        isOnline: true
      });
    });

    // Include other registered users in the inbox friend list so users can easily chat with anyone
    users.forEach((other) => {
      if (other.id !== uid && !convMap.has(other.id)) {
        const convId = makeConversationId(uid, other.id);
        convMap.set(other.id, {
          conversationId: convId,
          participant: other,
          lastMessage: {
            id: `empty_${other.id}`,
            conversationId: convId,
            senderId: other.id,
            receiverId: uid,
            text: 'Tap to start chatting 👋',
            createdAt: new Date(0).toISOString(),
            isRead: true
          },
          unreadCount: 0,
          isOnline: true
        });
      }
    });

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  })();

  const notifications: NotificationItem[] = rawNotifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    actorId: n.actorId,
    actor: findUser(n.actorId),
    type: n.type,
    postId: n.postId,
    postMediaUrl: n.postMediaUrl,
    text: n.text,
    createdAt: n.createdAt,
    isRead: Boolean(n.isRead)
  }));

  const selectedPostDetail = selectedPostDetailId
    ? posts.find((p) => p.id === selectedPostDetailId) || null
    : null;

  const activeStoryGroup = activeStoryGroupUserId
    ? storyGroups.find((g) => g.userId === activeStoryGroupUserId) || null
    : null;

  // ------------------------------------------------------------------
  // 6. Auth & Account Actions
  // ------------------------------------------------------------------
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setAuthError(err?.message || 'Sign in failed');
      throw err;
    }
  };

  const completeRegistration = async (data: {
    username: string;
    name: string;
    bio: string;
    avatar: string;
  }) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const cleanUsername = data.username.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30);

    // Check username availability
    try {
      const existingSnap = await getDocs(
        query(collection(db, 'users'), where('visibility', '==', 'public'))
      );
      const taken = existingSnap.docs.some(
        (d) => d.id !== uid && d.data().username === cleanUsername
      );
      if (taken) {
        throw new Error(`@${cleanUsername} is already taken. Please pick another username.`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('already taken')) throw err;
      handleFirestoreError(err, OperationType.LIST, 'users');
    }

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    const privateRef = doc(db, 'users', uid, 'private', 'info');

    batch.set(userRef, {
      uid,
      username: cleanUsername,
      name: data.name.slice(0, 60),
      avatar: data.avatar.slice(0, 390000),
      bio: data.bio.slice(0, 220),
      isVerified: false,
      isPrivate: false,
      visibility: 'public',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isOnline: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.set(privateRef, {
      uid,
      email: firebaseUser.email || `${uid}@users.local`,
      savedPosts: [],
      updatedAt: serverTimestamp()
    });

    try {
      await batch.commit();
      setNeedsOnboarding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const logout = async () => {
    if (firebaseUser && !needsOnboarding) {
      updateDoc(doc(db, 'users', firebaseUser.uid), {
        isOnline: false,
        updatedAt: serverTimestamp()
      }).catch(() => {});
    }
    setIsSettingsOpen(false);
    setCurrentChatUserId(null);
    setViewProfileUserId(null);
    await signOut(auth);
  };

  // ------------------------------------------------------------------
  // 7. Profile & Follow Actions
  // ------------------------------------------------------------------
  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    const payload: Record<string, any> = { updatedAt: serverTimestamp() };
    if (data.name !== undefined) payload.name = data.name.slice(0, 60);
    if (data.bio !== undefined) payload.bio = data.bio.slice(0, 220);
    if (data.avatar !== undefined) payload.avatar = data.avatar.slice(0, 390000);
    if (data.website !== undefined) payload.website = data.website.slice(0, 150);
    if (data.isPrivate !== undefined) payload.isPrivate = Boolean(data.isPrivate);

    try {
      await updateDoc(doc(db, 'users', currentUser.id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;
    const uid = currentUser.id;
    const followId = `${uid}_${targetUserId}`;
    const followRef = doc(db, 'follows', followId);
    const currentRef = doc(db, 'users', uid);
    const targetRef = doc(db, 'users', targetUserId);
    const alreadyFollowing = currentUser.following?.includes(targetUserId);

    const batch = writeBatch(db);
    if (alreadyFollowing) {
      batch.delete(followRef);
      batch.update(currentRef, { followingCount: increment(-1), updatedAt: serverTimestamp() });
      batch.update(targetRef, { followersCount: increment(-1), updatedAt: serverTimestamp() });
    } else {
      batch.set(followRef, {
        followerId: uid,
        targetId: targetUserId,
        visibility: 'public',
        createdAt: serverTimestamp()
      });
      batch.update(currentRef, { followingCount: increment(1), updatedAt: serverTimestamp() });
      batch.update(targetRef, { followersCount: increment(1), updatedAt: serverTimestamp() });

      const notifId = makeDocId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        userId: targetUserId,
        actorId: uid,
        type: 'follow',
        text: 'started following you.',
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `follows/${followId}`);
    }
  };

  // ------------------------------------------------------------------
  // 8. Posts, Reels, Stories Actions
  // ------------------------------------------------------------------
  const createPost = async (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
    location?: string;
    audioTrack?: string;
    tags?: string[];
  }) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const postId = makeDocId('post');
    const extractedTags = (
      data.tags ||
      data.caption?.match(/#[a-z0-9_]+/gi)?.map((t) => t.slice(1).toLowerCase()) ||
      []
    ).slice(0, 10);

    const batch = writeBatch(db);
    const postPayload: Record<string, any> = {
      userId: uid,
      mediaUrl: data.mediaUrl.slice(0, 790000),
      mediaType: data.mediaType,
      caption: (data.caption || '').slice(0, 2200),
      tags: extractedTags,
      likesCount: 0,
      commentsCount: 0,
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (data.location) postPayload.location = data.location.slice(0, 120);
    if (data.audioTrack) postPayload.audioTrack = data.audioTrack.slice(0, 120);

    batch.set(doc(db, 'posts', postId), postPayload);
    batch.update(doc(db, 'users', uid), {
      postsCount: increment(1),
      updatedAt: serverTimestamp()
    });

    try {
      await batch.commit();
      setIsCreateModalOpen(false);
      setActiveTab('feed');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `posts/${postId}`);
    }
  };

  const likePost = async (postId: string) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const targetPost = posts.find((p) => p.id === postId);
    const isCurrentlyLiked = targetPost?.isLiked;

    const batch = writeBatch(db);
    const likeRef = doc(db, 'posts', postId, 'likes', uid);
    const postRef = doc(db, 'posts', postId);

    if (isCurrentlyLiked) {
      batch.delete(likeRef);
      batch.update(postRef, { likesCount: increment(-1), updatedAt: serverTimestamp() });
    } else {
      batch.set(likeRef, {
        userId: uid,
        visibility: 'public',
        createdAt: serverTimestamp()
      });
      batch.update(postRef, { likesCount: increment(1), updatedAt: serverTimestamp() });

      if (targetPost && targetPost.userId !== uid) {
        const notifId = makeDocId('notif');
        batch.set(doc(db, 'notifications', notifId), {
          userId: targetPost.userId,
          actorId: uid,
          type: 'like',
          postId,
          postMediaUrl: targetPost.mediaType === 'image' ? targetPost.mediaUrl.slice(0, 790000) : '',
          text: 'liked your post.',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `posts/${postId}/likes/${uid}`);
    }
  };

  const commentPost = async (postId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const uid = currentUser.id;
    const cleanText = text.trim().slice(0, 500);
    const targetPost = posts.find((p) => p.id === postId);
    const commentId = makeDocId('c');

    const batch = writeBatch(db);
    batch.set(doc(db, 'posts', postId, 'comments', commentId), {
      userId: uid,
      text: cleanText,
      visibility: 'public',
      createdAt: serverTimestamp()
    });
    batch.update(doc(db, 'posts', postId), {
      commentsCount: increment(1),
      updatedAt: serverTimestamp()
    });

    if (targetPost && targetPost.userId !== uid) {
      const notifId = makeDocId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        userId: targetPost.userId,
        actorId: uid,
        type: 'comment',
        postId,
        postMediaUrl: targetPost.mediaType === 'image' ? targetPost.mediaUrl.slice(0, 790000) : '',
        text: `commented: "${cleanText.slice(0, 40)}"`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `posts/${postId}/comments/${commentId}`);
    }
  };

  const deletePost = async (postId: string) => {
    if (!currentUser) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'posts', postId));
    batch.update(doc(db, 'users', currentUser.id), {
      postsCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    try {
      await batch.commit();
      if (selectedPostDetailId === postId) setSelectedPostDetailId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const savePost = async (postId: string) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const nextSaved = savedPosts.includes(postId)
      ? savedPosts.filter((id) => id !== postId)
      : [...savedPosts, postId].slice(0, 200);

    try {
      await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
        savedPosts: nextSaved,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/private/info`);
    }
  };

  const createReel = async (data: { videoUrl: string; caption: string; audioTrack?: string }) => {
    if (!currentUser) return;
    const reelId = makeDocId('reel');
    try {
      await setDoc(doc(db, 'reels', reelId), {
        userId: currentUser.id,
        videoUrl: data.videoUrl.slice(0, 790000),
        caption: (data.caption || '').slice(0, 2200),
        audioTrack: (data.audioTrack || 'Original Audio').slice(0, 120),
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 1,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreateModalOpen(false);
      setActiveTab('reels');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reels/${reelId}`);
    }
  };

  const likeReel = async (reelId: string) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const targetReel = reels.find((r) => r.id === reelId);
    const isCurrentlyLiked = targetReel?.isLiked;

    const batch = writeBatch(db);
    const likeRef = doc(db, 'reels', reelId, 'likes', uid);
    const reelRef = doc(db, 'reels', reelId);

    if (isCurrentlyLiked) {
      batch.delete(likeRef);
      batch.update(reelRef, { likesCount: increment(-1), updatedAt: serverTimestamp() });
    } else {
      batch.set(likeRef, {
        userId: uid,
        visibility: 'public',
        createdAt: serverTimestamp()
      });
      batch.update(reelRef, { likesCount: increment(1), updatedAt: serverTimestamp() });

      if (targetReel && targetReel.userId !== uid) {
        const notifId = makeDocId('notif');
        batch.set(doc(db, 'notifications', notifId), {
          userId: targetReel.userId,
          actorId: uid,
          type: 'like',
          text: 'liked your reel.',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reels/${reelId}/likes/${uid}`);
    }
  };

  const commentReel = async (reelId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const uid = currentUser.id;
    const cleanText = text.trim().slice(0, 500);
    const targetReel = reels.find((r) => r.id === reelId);
    const commentId = makeDocId('rc');

    const batch = writeBatch(db);
    batch.set(doc(db, 'reels', reelId, 'comments', commentId), {
      userId: uid,
      text: cleanText,
      visibility: 'public',
      createdAt: serverTimestamp()
    });
    batch.update(doc(db, 'reels', reelId), {
      commentsCount: increment(1),
      updatedAt: serverTimestamp()
    });

    if (targetReel && targetReel.userId !== uid) {
      const notifId = makeDocId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        userId: targetReel.userId,
        actorId: uid,
        type: 'comment',
        text: `commented on your reel: "${cleanText.slice(0, 40)}"`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reels/${reelId}/comments/${commentId}`);
    }
  };

  const createStory = async (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
  }) => {
    if (!currentUser) return;
    const storyId = makeDocId('story');
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 3600 * 1000));

    const payload: Record<string, any> = {
      userId: currentUser.id,
      mediaUrl: data.mediaUrl.slice(0, 790000),
      mediaType: data.mediaType,
      visibility: 'public',
      expiresAt,
      createdAt: serverTimestamp()
    };
    if (data.caption) payload.caption = data.caption.slice(0, 300);

    try {
      await setDoc(doc(db, 'stories', storyId), payload);
      setIsCreateModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `stories/${storyId}`);
    }
  };

  const markStoryViewed = async (storyId: string) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const views = storyViewsMap[storyId] || [];
    if (views.includes(uid)) return;

    try {
      await setDoc(doc(db, 'stories', storyId, 'views', uid), {
        userId: uid,
        visibility: 'public',
        viewedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `stories/${storyId}/views/${uid}`);
    }
  };

  // ------------------------------------------------------------------
  // 9. Direct Messaging & Notifications
  // ------------------------------------------------------------------
  const openChatWithUser = (userId: string) => {
    setCurrentChatUserId(userId);
    setActiveTab('messages');
  };

  const closeChat = () => {
    setCurrentChatUserId(null);
  };

  const sendMessage = async (
    text?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'voice' | 'heart'
  ) => {
    if (!currentUser || !currentChatUserId) return;
    const uid = currentUser.id;
    const convId = makeConversationId(uid, currentChatUserId);
    const participants = [uid, currentChatUserId].sort();
    const convRef = doc(db, 'conversations', convId);
    const msgId = makeDocId('msg');
    const msgRef = doc(db, 'conversations', convId, 'messages', msgId);

    const summaryText =
      mediaType === 'heart'
        ? '❤️'
        : mediaType === 'image'
        ? '📷 Photo'
        : mediaType === 'voice'
        ? '🎤 Voice message'
        : (text || '').trim().slice(0, 500);

    const existingConv = rawConversations.some((c) => c.id === convId);
    const batch = writeBatch(db);

    if (!existingConv) {
      batch.set(convRef, {
        participants,
        lastMessageText: summaryText,
        lastMessageSenderId: uid,
        lastMessageAt: serverTimestamp(),
        typingUserId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      batch.update(convRef, {
        lastMessageText: summaryText,
        lastMessageSenderId: uid,
        lastMessageAt: serverTimestamp(),
        typingUserId: '',
        updatedAt: serverTimestamp()
      });
    }

    const msgPayload: Record<string, any> = {
      conversationId: convId,
      senderId: uid,
      receiverId: currentChatUserId,
      participants,
      mediaType: mediaType || 'none',
      isRead: false,
      createdAt: serverTimestamp()
    };
    if (text?.trim()) msgPayload.text = text.trim().slice(0, 1000);
    if (mediaUrl) msgPayload.mediaUrl = mediaUrl.slice(0, 590000);

    batch.set(msgRef, msgPayload);

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `conversations/${convId}/messages/${msgId}`);
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (!currentUser || !currentChatUserId) return;
    const uid = currentUser.id;
    const convId = makeConversationId(uid, currentChatUserId);
    const existsConv = rawConversations.some((c) => c.id === convId);
    if (!existsConv) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    updateDoc(doc(db, 'conversations', convId), {
      typingUserId: isTyping ? uid : '',
      updatedAt: serverTimestamp()
    }).catch(() => {});

    if (isTyping) {
      typingTimerRef.current = setTimeout(() => {
        updateDoc(doc(db, 'conversations', convId), {
          typingUserId: '',
          updatedAt: serverTimestamp()
        }).catch(() => {});
      }, 2500);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!currentUser) return;
    const unread = rawNotifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  };

  const openProfile = (userId?: string) => {
    setViewProfileUserId(userId || currentUser?.id || null);
    setActiveTab('profile');
  };

  const openCreateModal = (type: 'post' | 'reel' | 'story' = 'post') => {
    setCreateModalType(type);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const setSelectedPostDetail = (post: Post | null) => {
    setSelectedPostDetailId(post ? post.id : null);
  };

  const setActiveStoryGroup = (group: StoryGroup | null) => {
    setActiveStoryGroupUserId(group ? group.userId : null);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <InstagramContext.Provider
      value={{
        authReady,
        firebaseUser,
        needsOnboarding,
        authError,
        currentUser,
        users,
        posts,
        reels,
        storyGroups,
        conversations,
        notifications,
        unreadNotificationsCount,
        unreadMessagesCount,
        currentChatUserId,
        chatMessages,
        isChatUserTyping,
        theme,
        activeTab,
        viewProfileUserId,
        isCreateModalOpen,
        createModalType,
        selectedPostDetail,
        activeStoryGroup,
        isSettingsOpen,
        signInWithGoogle,
        completeRegistration,
        logout,
        setTheme,
        setActiveTab,
        openProfile,
        openCreateModal,
        closeCreateModal,
        setSelectedPostDetail,
        setActiveStoryGroup,
        setIsSettingsOpen,
        updateProfile,
        toggleFollow,
        createPost,
        likePost,
        commentPost,
        deletePost,
        savePost,
        createReel,
        likeReel,
        commentReel,
        createStory,
        markStoryViewed,
        openChatWithUser,
        closeChat,
        sendMessage,
        sendTyping,
        markNotificationsAsRead
      }}
    >
      {children}
    </InstagramContext.Provider>
  );
};

export const useInstagram = () => {
  const context = useContext(InstagramContext);
  if (!context) {
    throw new Error('useInstagram must be used within an InstagramProvider');
  }
  return context;
};
