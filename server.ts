import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for photo/video uploads (data URIs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// Database Persistence (JSON file backed)
// -------------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'instagram_db.json');

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  website?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  followers: string[]; // user IDs
  following: string[]; // user IDs
  savedPosts: string[]; // post IDs
  createdAt: string;
}

interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  likes: string[]; // user IDs
}

interface Post {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  location?: string;
  audioTrack?: string;
  likes: string[]; // user IDs
  comments: Comment[];
  createdAt: string;
  tags?: string[];
}

interface Reel {
  id: string;
  userId: string;
  videoUrl: string;
  caption: string;
  audioTrack: string;
  likes: string[]; // user IDs
  comments: Comment[];
  viewsCount: number;
  createdAt: string;
}

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewedBy: string[]; // user IDs
}

interface Message {
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

interface Notification {
  id: string;
  userId: string; // recipient
  actorId: string; // who triggered
  type: 'like' | 'comment' | 'follow' | 'mention';
  postId?: string;
  postMediaUrl?: string;
  text?: string;
  createdAt: string;
  isRead: boolean;
}

interface Database {
  users: User[];
  posts: Post[];
  reels: Reel[];
  stories: Story[];
  messages: Message[];
  notifications: Notification[];
}

function getInitialDatabase(): Database {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
  const hoursAhead = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

  return {
    users: [
      {
        id: 'user_rohan',
        username: 'rohan_creator',
        name: 'Rohan Ahmed',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'Creative Visuals & Code 🚀 | Dhaka & Worldwide 🌍 | Exploring life one frame at a time 📸',
        website: 'https://instagram.com/rohan_creator',
        isVerified: true,
        isPrivate: false,
        followers: ['user_samantha', 'user_alex', 'user_priya', 'user_david'],
        following: ['user_samantha', 'user_priya', 'user_zarina'],
        savedPosts: ['post_1', 'post_3'],
        createdAt: hoursAgo(2400)
      },
      {
        id: 'user_samantha',
        username: 'sam_vibes',
        name: 'Samantha Ray',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        bio: 'Traveler ✈️ | Aesthetic coffee shops ☕ | Content Creator ✨',
        website: 'https://samantharaye.blog',
        isVerified: true,
        isPrivate: false,
        followers: ['user_rohan', 'user_alex', 'user_zarina', 'user_priya'],
        following: ['user_rohan', 'user_alex'],
        savedPosts: ['post_2'],
        createdAt: hoursAgo(2000)
      },
      {
        id: 'user_alex',
        username: 'alex_films',
        name: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        bio: 'Cinematographer & Drone Pilot 🎬 | Sony Alpha & RED | Los Angeles 🌴',
        website: 'https://alexriverafilms.com',
        isVerified: true,
        isPrivate: false,
        followers: ['user_rohan', 'user_samantha'],
        following: ['user_rohan', 'user_samantha', 'user_david'],
        savedPosts: [],
        createdAt: hoursAgo(1800)
      },
      {
        id: 'user_priya',
        username: 'priya_art',
        name: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        bio: 'Visual Artist & Painter 🎨 | Colors of Mumbai & Tokyo 🌸 | Gallery Exhibitions',
        website: 'https://priyasharma.art',
        isVerified: false,
        isPrivate: false,
        followers: ['user_rohan'],
        following: ['user_rohan', 'user_samantha'],
        savedPosts: [],
        createdAt: hoursAgo(1500)
      },
      {
        id: 'user_zarina',
        username: 'zarina_style',
        name: 'Zarina Khan',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
        bio: 'Fashion Stylist & Editorial 👗 | Modern minimalism & vintage silk ✨',
        website: 'https://zarinastyle.com',
        isVerified: true,
        isPrivate: false,
        followers: ['user_rohan', 'user_samantha', 'user_alex'],
        following: ['user_rohan'],
        savedPosts: [],
        createdAt: hoursAgo(1200)
      },
      {
        id: 'user_david',
        username: 'david_beats',
        name: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        bio: 'Music Producer & Sound Designer 🎹 | Tokyo Nights EP out now! 🎵',
        website: 'https://spotify.com/artist/davidkim',
        isVerified: false,
        isPrivate: false,
        followers: ['user_rohan', 'user_alex'],
        following: ['user_rohan', 'user_samantha'],
        savedPosts: [],
        createdAt: hoursAgo(1100)
      }
    ],
    posts: [
      {
        id: 'post_1',
        userId: 'user_samantha',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Golden hour in Bali hits completely different 🌅🌊 Nothing clears the mind like the rhythm of ocean waves. What is your dream escape this year? #travel #bali #goldenhour #wanderlust #sunset',
        location: 'Uluwatu, Bali',
        audioTrack: 'Surf Mesa • ily (i love you baby)',
        likes: ['user_rohan', 'user_alex', 'user_priya', 'user_david', 'user_zarina'],
        comments: [
          {
            id: 'c_1',
            userId: 'user_rohan',
            text: 'Incredible lighting! The gradient on the horizon is insane 🔥',
            createdAt: hoursAgo(3),
            likes: ['user_samantha']
          },
          {
            id: 'c_2',
            userId: 'user_alex',
            text: 'Need to fly my drone there next month! 🚁',
            createdAt: hoursAgo(2),
            likes: []
          }
        ],
        createdAt: hoursAgo(4),
        tags: ['travel', 'bali', 'sunset', 'ocean']
      },
      {
        id: 'post_2',
        userId: 'user_rohan',
        mediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Neon alleyways and late night rain in the metropolis 🌃🌧️ Street photography is about capturing moments that exist only for a split second. Captured on 35mm f/1.4. #cyberpunk #streetphotography #tokyo #rain #nightvibes',
        location: 'Shinjuku, Tokyo',
        audioTrack: 'DVRST • Close Eyes (Slowed)',
        likes: ['user_samantha', 'user_priya', 'user_alex', 'user_zarina'],
        comments: [
          {
            id: 'c_3',
            userId: 'user_samantha',
            text: 'This looks straight out of Blade Runner! Gorgeous tone grading 🖤',
            createdAt: hoursAgo(6),
            likes: ['user_rohan']
          },
          {
            id: 'c_4',
            userId: 'user_priya',
            text: 'The neon reflections on the asphalt are pure art ✨',
            createdAt: hoursAgo(5),
            likes: ['user_rohan']
          }
        ],
        createdAt: hoursAgo(8),
        tags: ['tokyo', 'streetphotography', 'cyberpunk', 'nightcity']
      },
      {
        id: 'post_3',
        userId: 'user_priya',
        mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Work in progress: "Echoes of Crimson" 🎨 Acrylic and gold leaf on stretched linen canvas. Over 40 hours into this piece. What emotions does it evoke for you? #canvasart #contemporaryart #acrylicpainting #goldleaf',
        location: 'Kala Ghoda Arts District',
        audioTrack: 'Ludovico Einaudi • Nuvole Bianche',
        likes: ['user_rohan', 'user_samantha', 'user_zarina'],
        comments: [
          {
            id: 'c_5',
            userId: 'user_zarina',
            text: 'I need this in my living room immediately 😍',
            createdAt: hoursAgo(10),
            likes: ['user_priya']
          }
        ],
        createdAt: hoursAgo(12),
        tags: ['art', 'painting', 'contemporary', 'goldleaf']
      },
      {
        id: 'post_4',
        userId: 'user_alex',
        mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Highway to nowhere 🏜️ Nothing beats the open road through the red rock canyons of Utah. Road tripping with the squad. #roadtrip #adventure #explore #cinematography #nature',
        location: 'Moab, Utah',
        audioTrack: 'The Lumineers • Sleep On The Floor',
        likes: ['user_rohan', 'user_samantha'],
        comments: [
          {
            id: 'c_6',
            userId: 'user_rohan',
            text: 'The sense of scale here is unreal brother! 🏔️',
            createdAt: hoursAgo(14),
            likes: ['user_alex']
          }
        ],
        createdAt: hoursAgo(18),
        tags: ['roadtrip', 'utah', 'canyon', 'mountains']
      },
      {
        id: 'post_5',
        userId: 'user_zarina',
        mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Autumn silhouettes and neutral earth tones 🍂 Coat season has officially arrived. Swipe to check the texture details. #autumnfashion #minimalism #ootd #streetstyle',
        location: 'Paris, France',
        audioTrack: 'Taylor Swift • Cardigan',
        likes: ['user_samantha', 'user_priya', 'user_rohan'],
        comments: [],
        createdAt: hoursAgo(24),
        tags: ['fashion', 'ootd', 'paris', 'style']
      }
    ],
    reels: [
      {
        id: 'reel_1',
        userId: 'user_alex',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
        caption: 'Satisfying crystal clear shorebreak waves in 4K 120fps 🌊 Drop a like if you find this relaxing! #reels #waves #ocean #slowmo #cinematography',
        audioTrack: 'Original Audio - alex_films (Ocean Ambient)',
        likes: ['user_rohan', 'user_samantha', 'user_priya', 'user_zarina'],
        comments: [
          {
            id: 'rc_1',
            userId: 'user_rohan',
            text: 'Could watch this on loop for hours 😌',
            createdAt: hoursAgo(2),
            likes: ['user_alex']
          }
        ],
        viewsCount: 18450,
        createdAt: hoursAgo(5)
      },
      {
        id: 'reel_2',
        userId: 'user_samantha',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
        caption: 'Morning meditation in Kyoto bamboo forests 🎋 Sound on for serene nature frequencies 🍃 #japan #kyoto #travelreels #zen #nature',
        audioTrack: 'ChilledCow • Lofi Hip Hop Forest Chill',
        likes: ['user_rohan', 'user_david', 'user_alex'],
        comments: [],
        viewsCount: 12200,
        createdAt: hoursAgo(9)
      },
      {
        id: 'reel_3',
        userId: 'user_david',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-green-screen-41484-large.mp4',
        caption: 'New synth track drop coming this Friday! 🎛️⚡ Which drop hits hardest? Let me know in comments! #synthwave #musicproduction #ableton #studiolife',
        audioTrack: 'David Kim • Neon Heartbeat (Preview)',
        likes: ['user_rohan', 'user_alex'],
        comments: [
          {
            id: 'rc_2',
            userId: 'user_rohan',
            text: 'Banger coming up bro! 🔥🔥',
            createdAt: hoursAgo(1),
            likes: ['user_david']
          }
        ],
        viewsCount: 8940,
        createdAt: hoursAgo(14)
      }
    ],
    stories: [
      {
        id: 'story_1',
        userId: 'user_samantha',
        mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Best matcha latte in town! 🍵✨',
        createdAt: hoursAgo(2),
        expiresAt: hoursAhead(22),
        viewedBy: ['user_rohan']
      },
      {
        id: 'story_2',
        userId: 'user_samantha',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Hike views today 🌲⛰️',
        createdAt: hoursAgo(1),
        expiresAt: hoursAhead(23),
        viewedBy: []
      },
      {
        id: 'story_3',
        userId: 'user_alex',
        mediaUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'On set shooting commercial Day 2 🎬',
        createdAt: hoursAgo(4),
        expiresAt: hoursAhead(20),
        viewedBy: ['user_rohan']
      },
      {
        id: 'story_4',
        userId: 'user_priya',
        mediaUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'New color palette mixing session 🎨',
        createdAt: hoursAgo(3),
        expiresAt: hoursAhead(21),
        viewedBy: []
      },
      {
        id: 'story_5',
        userId: 'user_zarina',
        mediaUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Fitting room diaries 🛍️✨',
        createdAt: hoursAgo(5),
        expiresAt: hoursAhead(19),
        viewedBy: []
      }
    ],
    messages: [
      {
        id: 'msg_1',
        conversationId: 'user_rohan_user_samantha',
        senderId: 'user_samantha',
        receiverId: 'user_rohan',
        text: 'Hey Rohan! Did you see the new camera drone Alex got?',
        createdAt: hoursAgo(3),
        isRead: true
      },
      {
        id: 'msg_2',
        conversationId: 'user_rohan_user_samantha',
        senderId: 'user_rohan',
        receiverId: 'user_samantha',
        text: 'Yeah! That footage looks unbelievable, we should shoot our next project together 🚀',
        createdAt: hoursAgo(2),
        isRead: true
      },
      {
        id: 'msg_3',
        conversationId: 'user_rohan_user_samantha',
        senderId: 'user_samantha',
        receiverId: 'user_rohan',
        text: 'Totally down! Let me know when you are free this weekend 😊',
        createdAt: minutesAgo(45),
        isRead: false
      },
      {
        id: 'msg_4',
        conversationId: 'user_rohan_user_alex',
        senderId: 'user_alex',
        receiverId: 'user_rohan',
        text: 'Yo Rohan! Check out my new reel when you get a chance!',
        createdAt: hoursAgo(5),
        isRead: true
      },
      {
        id: 'msg_5',
        conversationId: 'user_rohan_user_alex',
        senderId: 'user_rohan',
        receiverId: 'user_alex',
        text: 'Already liked and commented bro, super clean wave shot! 🌊',
        createdAt: hoursAgo(4),
        isRead: true
      },
      {
        id: 'msg_6',
        conversationId: 'user_rohan_user_priya',
        senderId: 'user_priya',
        receiverId: 'user_rohan',
        text: 'Hey! Loved your Tokyo night shot! Would you mind if I used the color palette for my next oil painting?',
        createdAt: hoursAgo(8),
        isRead: true
      },
      {
        id: 'msg_7',
        conversationId: 'user_rohan_user_priya',
        senderId: 'user_rohan',
        receiverId: 'user_priya',
        text: 'I would be honored Priya! Send me a photo when you finish it ❤️',
        createdAt: hoursAgo(7),
        isRead: true
      }
    ],
    notifications: [
      {
        id: 'notif_1',
        userId: 'user_rohan',
        actorId: 'user_samantha',
        type: 'like',
        postId: 'post_2',
        postMediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&auto=format&fit=crop&q=80',
        text: 'liked your photo.',
        createdAt: hoursAgo(2),
        isRead: false
      },
      {
        id: 'notif_2',
        userId: 'user_rohan',
        actorId: 'user_priya',
        type: 'comment',
        postId: 'post_2',
        postMediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&auto=format&fit=crop&q=80',
        text: 'commented: "The neon reflections on the asphalt are pure art ✨"',
        createdAt: hoursAgo(5),
        isRead: false
      },
      {
        id: 'notif_3',
        userId: 'user_rohan',
        actorId: 'user_david',
        type: 'follow',
        text: 'started following you.',
        createdAt: hoursAgo(10),
        isRead: true
      },
      {
        id: 'notif_4',
        userId: 'user_rohan',
        actorId: 'user_alex',
        type: 'like',
        postId: 'post_2',
        postMediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&auto=format&fit=crop&q=80',
        text: 'liked your photo.',
        createdAt: hoursAgo(12),
        isRead: true
      }
    ]
  };
}

function loadDatabase(): Database {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading database, resetting to initial seed:', err);
    const initial = getInitialDatabase();
    return initial;
  }
}

let db = loadDatabase();

function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

// -------------------------------------------------------------
// Real-time Server-Sent Events (SSE) Bus
// -------------------------------------------------------------
interface SseClient {
  id: string;
  userId: string;
  res: Response;
}

let sseClients: SseClient[] = [];

function broadcastRealtime(event: string, payload: any, filterFn?: (client: SseClient) => boolean) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client) => {
    try {
      if (!filterFn || filterFn(client)) {
        client.res.write(message);
      }
    } catch (e) {
      // client may have disconnected
    }
  });
}

// Keep-alive heartbeat every 20 seconds
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(': keepalive\n\n');
    } catch (e) {
      // ignore
    }
  });
}, 20000);

// SSE connection endpoint
app.get('/api/realtime/stream', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const clientId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const client: SseClient = { id: clientId, userId, res };
  sseClients.push(client);

  // Send initial connected confirmation
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ clientId, userId, timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Broadcast typing indicator
app.post('/api/realtime/typing', (req: Request, res: Response) => {
  const { senderId, receiverId, isTyping } = req.body;
  broadcastRealtime(
    'TYPING',
    { senderId, receiverId, isTyping, timestamp: new Date().toISOString() },
    (client) => client.userId === receiverId
  );
  res.json({ success: true });
});

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// Helper to populate user details on posts/comments
function populateUser(userId: string) {
  const u = db.users.find((x) => x.id === userId);
  if (!u) {
    return {
      id: userId,
      username: 'user_' + userId.slice(-4),
      name: 'Instagrammer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      isVerified: false
    };
  }
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    avatar: u.avatar,
    bio: u.bio,
    isVerified: u.isVerified,
    isPrivate: u.isPrivate,
    followersCount: u.followers.length,
    followingCount: u.following.length
  };
}

// 1. USERS & PROFILES
app.get('/api/users', (req: Request, res: Response) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  let users = db.users.map((u) => ({
    ...u,
    followersCount: u.followers.length,
    followingCount: u.following.length
  }));

  if (search) {
    users = users.filter(
      (u) =>
        u.username.toLowerCase().includes(search) ||
        u.name.toLowerCase().includes(search) ||
        u.bio.toLowerCase().includes(search)
    );
  }

  res.json(users);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find((u) => u.id === id || u.username === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get user's posts, reels
  const userPosts = db.posts.filter((p) => p.userId === user.id);
  const userReels = db.reels.filter((r) => r.userId === user.id);

  res.json({
    ...user,
    followersCount: user.followers.length,
    followingCount: user.following.length,
    postsCount: userPosts.length,
    reelsCount: userReels.length
  });
});

// Create new user or sign up
app.post('/api/users', (req: Request, res: Response) => {
  const { username, name, avatar, bio } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_.]/g, '');
  const existing = db.users.find((u) => u.username === cleanUsername);
  if (existing) {
    return res.json(existing);
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    username: cleanUsername,
    name: name || cleanUsername,
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    bio: bio || 'Welcome to my Instagram profile! ✨',
    followers: [],
    following: ['user_rohan', 'user_samantha'],
    savedPosts: [],
    createdAt: new Date().toISOString()
  };

  // Rohan follows the new user as a friendly welcome + sends notification so they can Follow Back!
  const rohan = db.users.find((u) => u.id === 'user_rohan');
  if (rohan) {
    if (!rohan.followers.includes(newUser.id)) {
      rohan.followers.push(newUser.id);
    }
    if (!rohan.following.includes(newUser.id)) {
      rohan.following.push(newUser.id);
      newUser.followers.push(rohan.id);
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: newUser.id,
        actorId: rohan.id,
        type: 'follow',
        text: 'started following you.',
        createdAt: new Date().toISOString(),
        isRead: false
      });
    }
  }
  const samantha = db.users.find((u) => u.id === 'user_samantha');
  if (samantha && !samantha.followers.includes(newUser.id)) {
    samantha.followers.push(newUser.id);
  }

  db.users.push(newUser);
  saveDatabase();

  const enrichedNewUser = {
    ...newUser,
    followersCount: newUser.followers.length,
    followingCount: newUser.following.length
  };

  broadcastRealtime('NEW_USER', enrichedNewUser);
  res.status(201).json(enrichedNewUser);
});

// Update profile
app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, bio, avatar, website, isPrivate } = req.body;
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (website !== undefined) user.website = website;
  if (isPrivate !== undefined) user.isPrivate = isPrivate;

  saveDatabase();
  const enrichedUser = {
    ...user,
    followersCount: user.followers.length,
    followingCount: user.following.length
  };
  broadcastRealtime('USER_UPDATED', enrichedUser);
  res.json(enrichedUser);
});

// Follow / Unfollow toggle
app.post('/api/users/:id/follow', (req: Request, res: Response) => {
  const targetId = req.params.id;
  const { currentUserId } = req.body;

  if (!currentUserId || currentUserId === targetId) {
    return res.status(400).json({ error: 'Invalid user or cannot follow self' });
  }

  const target = db.users.find((u) => u.id === targetId);
  const current = db.users.find((u) => u.id === currentUserId);

  if (!target || !current) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isFollowing = current.following.includes(targetId);

  if (isFollowing) {
    // Unfollow
    current.following = current.following.filter((id) => id !== targetId);
    target.followers = target.followers.filter((id) => id !== currentUserId);
  } else {
    // Follow
    current.following.push(targetId);
    target.followers.push(currentUserId);

    // Create Notification
    const notif: Notification = {
      id: `notif_${Date.now()}`,
      userId: targetId,
      actorId: currentUserId,
      type: 'follow',
      text: 'started following you.',
      createdAt: new Date().toISOString(),
      isRead: false
    };
    db.notifications.unshift(notif);
    broadcastRealtime('NEW_NOTIFICATION', { ...notif, actor: populateUser(currentUserId) }, (c) => c.userId === targetId);
  }

  saveDatabase();

  const responseData = {
    isFollowing: !isFollowing,
    targetFollowersCount: target.followers.length,
    currentFollowingCount: current.following.length,
    targetId,
    currentUserId
  };

  broadcastRealtime('FOLLOW_UPDATED', responseData);
  res.json(responseData);
});

// 2. FEED POSTS
app.get('/api/posts', (req: Request, res: Response) => {
  const currentUserId = req.query.currentUserId as string;
  const tag = req.query.tag as string;
  const userId = req.query.userId as string;

  let posts = [...db.posts];

  if (tag) {
    posts = posts.filter((p) => p.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()));
  }

  if (userId) {
    posts = posts.filter((p) => p.userId === userId);
  }

  // Sort descending by date
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const populated = posts.map((p) => {
    const user = populateUser(p.userId);
    const currentUser = db.users.find((u) => u.id === currentUserId);
    return {
      ...p,
      user,
      likesCount: p.likes.length,
      isLiked: currentUserId ? p.likes.includes(currentUserId) : false,
      isSaved: currentUser ? currentUser.savedPosts.includes(p.id) : false,
      commentsCount: p.comments.length,
      comments: p.comments.map((c) => ({
        ...c,
        user: populateUser(c.userId),
        likesCount: c.likes.length,
        isLiked: currentUserId ? c.likes.includes(currentUserId) : false
      }))
    };
  });

  res.json(populated);
});

// Create Post
app.post('/api/posts', (req: Request, res: Response) => {
  const { userId, mediaUrl, mediaType, caption, location, audioTrack, tags } = req.body;
  if (!userId || !mediaUrl) {
    return res.status(400).json({ error: 'User ID and Media are required' });
  }

  // Extract hashtags from caption if not explicitly provided
  const extractedTags = tags || (caption?.match(/#[a-z0-9_]+/gi)?.map((t: string) => t.slice(1).toLowerCase()) || []);

  const newPost: Post = {
    id: `post_${Date.now()}`,
    userId,
    mediaUrl,
    mediaType: mediaType || 'image',
    caption: caption || '',
    location: location || '',
    audioTrack: audioTrack || '',
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
    tags: extractedTags
  };

  db.posts.unshift(newPost);
  saveDatabase();

  const populated = {
    ...newPost,
    user: populateUser(userId),
    likesCount: 0,
    isLiked: false,
    isSaved: false,
    commentsCount: 0,
    comments: []
  };

  broadcastRealtime('NEW_POST', populated);
  res.status(201).json(populated);
});

// Delete Post
app.delete('/api/posts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  const postIndex = db.posts.findIndex((p) => p.id === id);
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = db.posts[postIndex];
  if (post.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized to delete this post' });
  }

  db.posts.splice(postIndex, 1);
  saveDatabase();

  broadcastRealtime('DELETE_POST', { postId: id });
  res.json({ success: true, postId: id });
});

// Like / Unlike Post
app.post('/api/posts/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const post = db.posts.find((p) => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isLiked = post.likes.includes(userId);
  if (isLiked) {
    post.likes = post.likes.filter((uid) => uid !== userId);
  } else {
    post.likes.push(userId);

    // Notify author if not self
    if (post.userId !== userId) {
      const notif: Notification = {
        id: `notif_${Date.now()}`,
        userId: post.userId,
        actorId: userId,
        type: 'like',
        postId: post.id,
        postMediaUrl: post.mediaUrl,
        text: 'liked your photo.',
        createdAt: new Date().toISOString(),
        isRead: false
      };
      db.notifications.unshift(notif);
      broadcastRealtime('NEW_NOTIFICATION', { ...notif, actor: populateUser(userId) }, (c) => c.userId === post.userId);
    }
  }

  saveDatabase();

  const update = {
    postId: id,
    userId,
    isLiked: !isLiked,
    likesCount: post.likes.length,
    likes: post.likes
  };

  broadcastRealtime('POST_LIKE_UPDATED', update);
  res.json(update);
});

// Save / Bookmark Post
app.post('/api/posts/:id/save', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const isSaved = user.savedPosts.includes(id);
  if (isSaved) {
    user.savedPosts = user.savedPosts.filter((pid) => pid !== id);
  } else {
    user.savedPosts.push(id);
  }

  saveDatabase();
  res.json({ postId: id, isSaved: !isSaved, savedPosts: user.savedPosts });
});

// Add Comment
app.post('/api/posts/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, text } = req.body;
  if (!userId || !text?.trim()) {
    return res.status(400).json({ error: 'userId and text are required' });
  }

  const post = db.posts.find((p) => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const newComment: Comment = {
    id: `comment_${Date.now()}`,
    userId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    likes: []
  };

  post.comments.push(newComment);

  // Notify post author if not self
  if (post.userId !== userId) {
    const notif: Notification = {
      id: `notif_${Date.now()}`,
      userId: post.userId,
      actorId: userId,
      type: 'comment',
      postId: post.id,
      postMediaUrl: post.mediaUrl,
      text: `commented: "${text.trim().substring(0, 40)}"`,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    db.notifications.unshift(notif);
    broadcastRealtime('NEW_NOTIFICATION', { ...notif, actor: populateUser(userId) }, (c) => c.userId === post.userId);
  }

  saveDatabase();

  const populatedComment = {
    ...newComment,
    user: populateUser(userId),
    likesCount: 0,
    isLiked: false
  };

  broadcastRealtime('NEW_COMMENT', { postId: id, comment: populatedComment });
  res.status(201).json(populatedComment);
});

// 3. STORIES
app.get('/api/stories', (req: Request, res: Response) => {
  const currentUserId = req.query.currentUserId as string;
  const now = new Date();

  // Filter out expired stories (>24h)
  const activeStories = db.stories.filter((s) => new Date(s.expiresAt) > now);

  // Group stories by userId
  const groupedMap = new Map<string, Story[]>();
  activeStories.forEach((s) => {
    if (!groupedMap.has(s.userId)) {
      groupedMap.set(s.userId, []);
    }
    groupedMap.get(s.userId)!.push(s);
  });

  const storyGroups: any[] = [];
  groupedMap.forEach((stories, userId) => {
    const user = populateUser(userId);
    const hasUnviewed = currentUserId ? stories.some((s) => !s.viewedBy.includes(currentUserId)) : true;
    storyGroups.push({
      userId,
      user,
      stories,
      hasUnviewed,
      latestTimestamp: Math.max(...stories.map((s) => new Date(s.createdAt).getTime()))
    });
  });

  // Sort so groups with unviewed stories come first
  storyGroups.sort((a, b) => {
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    return b.latestTimestamp - a.latestTimestamp;
  });

  res.json(storyGroups);
});

// Create Story
app.post('/api/stories', (req: Request, res: Response) => {
  const { userId, mediaUrl, mediaType, caption } = req.body;
  if (!userId || !mediaUrl) {
    return res.status(400).json({ error: 'User ID and Media are required' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

  const newStory: Story = {
    id: `story_${Date.now()}`,
    userId,
    mediaUrl,
    mediaType: mediaType || 'image',
    caption: caption || '',
    createdAt: now.toISOString(),
    expiresAt,
    viewedBy: [userId]
  };

  db.stories.push(newStory);
  saveDatabase();

  broadcastRealtime('NEW_STORY', { story: newStory, user: populateUser(userId) });
  res.status(201).json(newStory);
});

// Mark Story Viewed
app.post('/api/stories/:id/view', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  const story = db.stories.find((s) => s.id === id);
  if (!story) return res.status(404).json({ error: 'Story not found' });

  if (userId && !story.viewedBy.includes(userId)) {
    story.viewedBy.push(userId);
    saveDatabase();
  }

  res.json({ success: true, storyId: id, viewedByCount: story.viewedBy.length });
});

// 4. REELS
app.get('/api/reels', (req: Request, res: Response) => {
  const currentUserId = req.query.currentUserId as string;

  const populated = db.reels.map((r) => ({
    ...r,
    user: populateUser(r.userId),
    likesCount: r.likes.length,
    isLiked: currentUserId ? r.likes.includes(currentUserId) : false,
    commentsCount: r.comments.length,
    comments: r.comments.map((c) => ({
      ...c,
      user: populateUser(c.userId),
      likesCount: c.likes.length,
      isLiked: currentUserId ? c.likes.includes(currentUserId) : false
    }))
  }));

  // Newest first
  populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(populated);
});

// Create Reel
app.post('/api/reels', (req: Request, res: Response) => {
  const { userId, videoUrl, caption, audioTrack } = req.body;
  if (!userId || !videoUrl) {
    return res.status(400).json({ error: 'userId and videoUrl are required' });
  }

  const newReel: Reel = {
    id: `reel_${Date.now()}`,
    userId,
    videoUrl,
    caption: caption || '',
    audioTrack: audioTrack || 'Original Audio',
    likes: [],
    comments: [],
    viewsCount: 1,
    createdAt: new Date().toISOString()
  };

  db.reels.unshift(newReel);
  saveDatabase();

  const populated = {
    ...newReel,
    user: populateUser(userId),
    likesCount: 0,
    isLiked: false,
    commentsCount: 0
  };

  broadcastRealtime('NEW_REEL', populated);
  res.status(201).json(populated);
});

// Like Reel
app.post('/api/reels/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  const reel = db.reels.find((r) => r.id === id);
  if (!reel) return res.status(404).json({ error: 'Reel not found' });

  const isLiked = reel.likes.includes(userId);
  if (isLiked) {
    reel.likes = reel.likes.filter((uid) => uid !== userId);
  } else {
    reel.likes.push(userId);
  }

  saveDatabase();

  const update = {
    reelId: id,
    userId,
    isLiked: !isLiked,
    likesCount: reel.likes.length
  };

  broadcastRealtime('REEL_LIKE_UPDATED', update);
  res.json(update);
});

// Comment on Reel
app.post('/api/reels/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, text } = req.body;
  if (!userId || !text?.trim()) {
    return res.status(400).json({ error: 'userId and text are required' });
  }

  const reel = db.reels.find((r) => r.id === id);
  if (!reel) return res.status(404).json({ error: 'Reel not found' });

  const newComment: Comment = {
    id: `rcomment_${Date.now()}`,
    userId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    likes: []
  };

  reel.comments.push(newComment);

  if (reel.userId !== userId) {
    const notif: Notification = {
      id: `notif_${Date.now()}`,
      userId: reel.userId,
      actorId: userId,
      type: 'comment',
      text: `commented on your reel: "${text.trim().substring(0, 40)}"`,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    db.notifications.unshift(notif);
    broadcastRealtime('NEW_NOTIFICATION', { ...notif, actor: populateUser(userId) }, (c) => c.userId === reel.userId);
  }

  saveDatabase();

  const populatedComment = {
    ...newComment,
    user: populateUser(userId),
    likesCount: 0,
    isLiked: false
  };

  broadcastRealtime('NEW_REEL_COMMENT', { reelId: id, comment: populatedComment });
  res.status(201).json(populatedComment);
});

// 5. DIRECT MESSAGES & INBOX
function getConversationId(u1: string, u2: string) {
  return [u1, u2].sort().join('_');
}

app.get('/api/messages/conversations', (req: Request, res: Response) => {
  const currentUserId = req.query.currentUserId as string;
  if (!currentUserId) return res.status(400).json({ error: 'currentUserId is required' });

  // Find all messages involving this user
  const userMessages = db.messages.filter(
    (m) => m.senderId === currentUserId || m.receiverId === currentUserId
  );

  // Group by conversation
  const convMap = new Map<string, { otherUserId: string; lastMessage: Message; unreadCount: number }>();

  userMessages.forEach((m) => {
    const otherUserId = m.senderId === currentUserId ? m.receiverId : m.senderId;
    const existing = convMap.get(otherUserId);

    const isUnread = m.receiverId === currentUserId && !m.isRead;

    if (!existing) {
      convMap.set(otherUserId, {
        otherUserId,
        lastMessage: m,
        unreadCount: isUnread ? 1 : 0
      });
    } else {
      if (new Date(m.createdAt) > new Date(existing.lastMessage.createdAt)) {
        existing.lastMessage = m;
      }
      if (isUnread) {
        existing.unreadCount++;
      }
    }
  });

  // Ensure default demo friends appear in conversation list even if no prior message
  db.users.forEach((other) => {
    if (other.id !== currentUserId && !convMap.has(other.id)) {
      convMap.set(other.id, {
        otherUserId: other.id,
        lastMessage: {
          id: `msg_empty_${other.id}`,
          conversationId: getConversationId(currentUserId, other.id),
          senderId: other.id,
          receiverId: currentUserId,
          text: 'Say hi! 👋',
          createdAt: other.createdAt,
          isRead: true
        },
        unreadCount: 0
      });
    }
  });

  const conversations = Array.from(convMap.values()).map((c) => {
    const isOnline = sseClients.some((client) => client.userId === c.otherUserId);
    return {
      conversationId: getConversationId(currentUserId, c.otherUserId),
      participant: populateUser(c.otherUserId),
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
      isOnline
    };
  });

  // Sort by last message date
  conversations.sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  res.json(conversations);
});

app.get('/api/messages/:otherUserId', (req: Request, res: Response) => {
  const { otherUserId } = req.params;
  const currentUserId = req.query.currentUserId as string;
  if (!currentUserId) return res.status(400).json({ error: 'currentUserId is required' });

  const conversationId = getConversationId(currentUserId, otherUserId);
  const messages = db.messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Mark unread messages as read
  let hasUpdated = false;
  messages.forEach((m) => {
    if (m.receiverId === currentUserId && !m.isRead) {
      m.isRead = true;
      hasUpdated = true;
    }
  });

  if (hasUpdated) {
    saveDatabase();
    broadcastRealtime('MESSAGES_READ', { conversationId, readBy: currentUserId });
  }

  res.json({
    conversationId,
    participant: populateUser(otherUserId),
    messages
  });
});

// Send Message
app.post('/api/messages', (req: Request, res: Response) => {
  const { senderId, receiverId, text, mediaUrl, mediaType } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'senderId and receiverId are required' });
  }
  if (!text?.trim() && !mediaUrl) {
    return res.status(400).json({ error: 'Message must have text or media' });
  }

  const conversationId = getConversationId(senderId, receiverId);
  const newMessage: Message = {
    id: `msg_${Date.now()}`,
    conversationId,
    senderId,
    receiverId,
    text: text ? text.trim() : undefined,
    mediaUrl: mediaUrl || undefined,
    mediaType: mediaType || undefined,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  db.messages.push(newMessage);
  saveDatabase();

  // Real-time broadcast to both participants
  broadcastRealtime('NEW_MESSAGE', newMessage, (c) => c.userId === senderId || c.userId === receiverId);

  res.status(201).json(newMessage);
});

// 6. NOTIFICATIONS
app.get('/api/notifications', (req: Request, res: Response) => {
  const currentUserId = req.query.currentUserId as string;
  if (!currentUserId) return res.status(400).json({ error: 'currentUserId is required' });

  const notifications = db.notifications
    .filter((n) => n.userId === currentUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((n) => ({
      ...n,
      actor: populateUser(n.actorId)
    }));

  res.json(notifications);
});

app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  db.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });

  saveDatabase();
  res.json({ success: true });
});

// 7. EXPLORE & TRENDING
app.get('/api/explore', (req: Request, res: Response) => {
  const allPosts = db.posts.map((p) => ({
    ...p,
    user: populateUser(p.userId),
    likesCount: p.likes.length,
    commentsCount: p.comments.length
  }));

  const allReels = db.reels.map((r) => ({
    ...r,
    user: populateUser(r.userId),
    likesCount: r.likes.length,
    commentsCount: r.comments.length
  }));

  // Extract popular hashtags
  const tagCounts: { [tag: string]: number } = {};
  db.posts.forEach((p) => {
    p.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const popularTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  res.json({
    posts: allPosts,
    reels: allReels,
    popularTags
  });
});

// -------------------------------------------------------------
// Vite Dev Server / Static Production Mounting
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Instagram Realtime Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
