import React, { useState } from 'react';
import {
  Grid,
  Film,
  Bookmark,
  UserCheck,
  Settings,
  Share2,
  BadgeCheck,
  Heart,
  MessageCircle,
  Plus,
  X
} from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { Post, Reel, User } from '../../types/instagram';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    users,
    posts,
    reels,
    viewProfileUserId,
    toggleFollow,
    openChatWithUser,
    setSelectedPostDetail,
    setIsSettingsOpen,
    openProfile,
    theme
  } = useInstagram();

  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
  const [showUsersModal, setShowUsersModal] = useState<'followers' | 'following' | null>(null);

  // Target user being displayed (either selected profile or current user)
  const targetUserId = viewProfileUserId || currentUser?.id;
  const targetUser: User | undefined = users.find((u) => u.id === targetUserId) || currentUser || undefined;

  if (!targetUser) return null;

  const isMyProfile = currentUser?.id === targetUser.id;
  const isFollowing = currentUser?.following?.includes(targetUser.id);
  const isFollower = currentUser?.followers?.includes(targetUser.id);

  // Filter posts and reels belonging to this user
  const userPosts = posts.filter((p) => p.userId === targetUser.id);
  const userReels = reels.filter((r) => r.userId === targetUser.id);
  const savedPosts = posts.filter((p) => currentUser?.savedPosts?.includes(p.id));

  // Highlights mock data
  const highlights = [
    { title: 'Travel ✈️', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80' },
    { title: 'Vibes ✨', image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&auto=format&fit=crop&q=80' },
    { title: 'Shoots 🎬', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&auto=format&fit=crop&q=80' },
    { title: 'Art 🎨', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80' }
  ];

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(`Copied @${targetUser.username}'s profile link!`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 md:px-8 select-none">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12 pb-8 border-b border-neutral-800/40">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full ig-gradient-border p-1">
            <div className={`w-full h-full rounded-full p-0.5 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              <img
                src={targetUser.avatar}
                alt={targetUser.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* User Stats & Bio */}
        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
          {/* Username row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-1.5">
              {targetUser.username}
              {targetUser.isVerified && (
                <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500" />
              )}
            </h2>

            {isMyProfile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition"
                >
                  Edit profile
                </button>
                <button
                  onClick={handleShareProfile}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFollow(targetUser.id)}
                  className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isFollowing
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      : 'bg-pink-500 hover:bg-pink-600 text-white shadow-md'
                  }`}
                >
                  {isFollowing ? 'Following' : isFollower ? 'Follow Back' : 'Follow'}
                </button>

                <button
                  onClick={() => openChatWithUser(targetUser.id)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition"
                >
                  Message
                </button>

                <button
                  onClick={handleShareProfile}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Followers / Following Stats */}
          <div className="flex items-center justify-center sm:justify-start gap-8 mb-4 text-sm">
            <div>
              <span className="font-bold mr-1">{userPosts.length}</span>
              <span className="text-neutral-400">posts</span>
            </div>
            <button
              onClick={() => setShowUsersModal('followers')}
              className="hover:opacity-75 transition"
            >
              <span className="font-bold mr-1">{targetUser.followersCount}</span>
              <span className="text-neutral-400">followers</span>
            </button>
            <button
              onClick={() => setShowUsersModal('following')}
              className="hover:opacity-75 transition"
            >
              <span className="font-bold mr-1">{targetUser.followingCount}</span>
              <span className="text-neutral-400">following</span>
            </button>
          </div>

          {/* Name & Bio */}
          <div className="text-xs sm:text-sm space-y-1">
            <h3 className="font-bold">{targetUser.name}</h3>
            <p className="text-neutral-300 whitespace-pre-wrap max-w-md">{targetUser.bio}</p>
            {targetUser.website && (
              <a
                href={targetUser.website}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline font-semibold block pt-0.5"
              >
                {targetUser.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Story Highlights */}
      <div className="py-6 flex items-center gap-5 overflow-x-auto no-scrollbar">
        {highlights.map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0">
            <div className="w-16 h-16 rounded-full border border-neutral-700 p-0.5 group-hover:border-neutral-500 transition">
              <img src={h.image} alt={h.title} className="w-full h-full rounded-full object-cover" />
            </div>
            <span className="text-[11px] text-neutral-300">{h.title}</span>
          </div>
        ))}

        {isMyProfile && (
          <div className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0">
            <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center group-hover:border-neutral-500 transition">
              <Plus className="w-6 h-6 text-neutral-400" />
            </div>
            <span className="text-[11px] text-neutral-400">New</span>
          </div>
        )}
      </div>

      {/* Profile Tabs */}
      <div className="border-t border-neutral-800/40 flex items-center justify-center gap-12 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent hover:text-neutral-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
            activeTab === 'reels'
              ? 'border-white text-white'
              : 'border-transparent hover:text-neutral-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Reels</span>
        </button>

        {isMyProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
              activeTab === 'saved'
                ? 'border-white text-white'
                : 'border-transparent hover:text-neutral-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('tagged')}
          className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
            activeTab === 'tagged'
              ? 'border-white text-white'
              : 'border-transparent hover:text-neutral-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Tagged</span>
        </button>
      </div>

      {/* Grid Content */}
      <div className="mt-4">
        {activeTab === 'posts' && (
          userPosts.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <p className="text-sm">No posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {userPosts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPostDetail(p)}
                  className="relative aspect-square cursor-pointer group overflow-hidden rounded-md sm:rounded-xl bg-neutral-900"
                >
                  <img
                    src={p.mediaUrl}
                    alt={p.caption}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-5 text-white font-bold text-sm">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-5 h-5 fill-white" />
                      <span>{p.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span>{p.commentsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'reels' && (
          userReels.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <p className="text-sm">No reels posted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {userReels.map((r: Reel) => (
                <div
                  key={r.id}
                  className="relative aspect-[9/16] cursor-pointer group overflow-hidden rounded-md sm:rounded-xl bg-neutral-900"
                >
                  <video src={r.videoUrl} className="w-full h-full object-cover" muted />
                  <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 text-white text-xs font-semibold">
                    <Film className="w-3.5 h-3.5" />
                    <span>{r.viewsCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'saved' && (
          savedPosts.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <p className="text-sm">No saved posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {savedPosts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPostDetail(p)}
                  className="relative aspect-square cursor-pointer group overflow-hidden rounded-md sm:rounded-xl bg-neutral-900"
                >
                  <img
                    src={p.mediaUrl}
                    alt={p.caption}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'tagged' && (
          <div className="py-16 text-center text-neutral-400">
            <p className="text-sm">Photos and videos of you will appear here.</p>
          </div>
        )}
      </div>

      {/* Followers / Following List Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider">
                {showUsersModal === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button onClick={() => setShowUsersModal(null)} className="p-1 hover:opacity-75">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {users
                .filter((u) => u.id !== targetUser.id)
                .map((u) => {
                  const followingUser = currentUser?.following?.includes(u.id);

                  return (
                    <div key={u.id} className="flex items-center justify-between py-1">
                      <div
                        onClick={() => {
                          openProfile(u.id);
                          setShowUsersModal(null);
                        }}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <img src={u.avatar} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold group-hover:underline">{u.username}</p>
                          <p className="text-[11px] text-neutral-400">{u.name}</p>
                        </div>
                      </div>

                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleFollow(u.id)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                            followingUser
                              ? 'bg-neutral-800 text-neutral-300'
                              : 'bg-pink-500 text-white'
                          }`}
                        >
                          {followingUser ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
