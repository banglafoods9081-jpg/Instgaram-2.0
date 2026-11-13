import React, { useState, useRef } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Trash2,
  Smile,
  BadgeCheck
} from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';

export const PostDetailModal: React.FC = () => {
  const {
    selectedPostDetail,
    setSelectedPostDetail,
    currentUser,
    likePost,
    commentPost,
    savePost,
    deletePost,
    toggleFollow,
    openProfile,
    openChatWithUser,
    theme
  } = useInstagram();

  const [commentText, setCommentText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef<number>(0);

  if (!selectedPostDetail) return null;

  const post = selectedPostDetail;
  const isAuthor = currentUser?.id === post.userId;
  const isFollowing = currentUser?.following?.includes(post.userId);
  const isFollower = currentUser?.followers?.includes(post.userId);

  const handleMediaClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!post.isLiked) {
        likePost(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await commentPost(post.id, commentText);
    setCommentText('');
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div
      onClick={() => setSelectedPostDetail(null)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6"
    >
      <button
        onClick={() => setSelectedPostDetail(null)}
        className="absolute top-4 right-4 text-white hover:opacity-75 p-2 z-50"
        aria-label="Close"
      >
        <X className="w-7 h-7" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-5xl h-[88vh] max-h-[680px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col md:flex-row ${
          theme === 'dark'
            ? 'bg-neutral-950 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Left: Media */}
        <div
          onClick={handleMediaClick}
          className="w-full md:w-3/5 h-1/2 md:h-full bg-black flex items-center justify-center relative cursor-pointer select-none"
        >
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              autoPlay
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption}
              className="w-full h-full object-contain"
            />
          )}

          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-28 h-28 text-white fill-white drop-shadow-2xl animate-heart-burst" />
            </div>
          )}
        </div>

        {/* Right: Info & Comments */}
        <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col border-t md:border-t-0 md:border-l border-neutral-800/50">
          {/* Author Header */}
          <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between">
            <div
              onClick={() => {
                openProfile(post.user.id);
                setSelectedPostDetail(null);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <img
                src={post.user.avatar}
                alt={post.user.username}
                className="w-9 h-9 rounded-full object-cover border border-pink-500"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold hover:underline">{post.user.username}</span>
                  {post.user.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                  )}
                </div>
                {post.location && <p className="text-[11px] text-neutral-400">{post.location}</p>}
              </div>
            </div>

            {isAuthor ? (
              <button
                onClick={() => deletePost(post.id)}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                title="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => toggleFollow(post.user.id)}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                  isFollowing
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'text-pink-500 hover:text-pink-400'
                }`}
              >
                {isFollowing ? 'Following' : isFollower ? 'Follow Back' : 'Follow'}
              </button>
            )}
          </div>

          {/* Caption & Comments Scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption as first entry */}
            {post.caption && (
              <div className="flex gap-3 text-xs leading-relaxed">
                <img
                  src={post.user.avatar}
                  alt={post.user.username}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div>
                  <p>
                    <span className="font-bold mr-1.5">{post.user.username}</span>
                    <span>{post.caption}</span>
                  </p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    {timeAgo(post.createdAt)}
                  </span>
                </div>
              </div>
            )}

            {/* Comments */}
            {post.comments.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-500">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              post.comments.map((c) => (
                <div key={c.id} className="flex gap-3 text-xs leading-relaxed">
                  <img
                    src={c.user?.avatar}
                    alt={c.user?.username}
                    className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer"
                    onClick={() => {
                      openProfile(c.userId);
                      setSelectedPostDetail(null);
                    }}
                  />
                  <div className="flex-1">
                    <p>
                      <span
                        onClick={() => {
                          openProfile(c.userId);
                          setSelectedPostDetail(null);
                        }}
                        className="font-bold mr-1.5 cursor-pointer hover:underline"
                      >
                        {c.user?.username}
                      </span>
                      <span>{c.text}</span>
                    </p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions & Comment Box */}
          <div className="border-t border-neutral-800/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => likePost(post.id)}
                  className="hover:opacity-70 transition active:scale-125"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      post.isLiked ? 'text-rose-500 fill-rose-500' : 'text-current'
                    }`}
                  />
                </button>
                <button className="hover:opacity-70 transition">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    openChatWithUser(post.userId);
                    setSelectedPostDetail(null);
                  }}
                  className="hover:opacity-70 transition"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button
                onClick={() => savePost(post.id)}
                className="hover:opacity-70 transition"
              >
                <Bookmark
                  className={`w-6 h-6 ${
                    post.isSaved ? 'text-amber-400 fill-amber-400' : 'text-current'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs font-bold">
              {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
            </p>

            <form
              onSubmit={handleCommentSubmit}
              className="flex items-center gap-2 pt-2 border-t border-neutral-800/40"
            >
              <button
                type="button"
                onClick={() => setCommentText((prev) => prev + ' 🔥 ')}
                className="text-neutral-400 hover:text-white"
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs placeholder:text-neutral-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="text-xs font-bold text-pink-500 hover:text-pink-400 disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
