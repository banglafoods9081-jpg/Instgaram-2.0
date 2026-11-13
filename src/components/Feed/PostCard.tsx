import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Play,
  Trash2,
  Share2,
  Smile,
  BadgeCheck
} from 'lucide-react';
import { Post } from '../../types/instagram';
import { useInstagram } from '../../context/InstagramContext';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const {
    currentUser,
    likePost,
    commentPost,
    deletePost,
    savePost,
    openProfile,
    setSelectedPostDetail,
    openChatWithUser,
    theme
  } = useInstagram();

  const [commentText, setCommentText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<number>(0);

  // Handle double tap/click on media to like
  const handleMediaClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!post.isLiked) {
        likePost(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentPost(post.id, commentText);
    setCommentText('');
  };

  // Format relative time
  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const isAuthor = currentUser?.id === post.userId;

  return (
    <article
      className={`w-full max-w-[470px] mx-auto rounded-xl border mb-6 transition ${
        theme === 'dark'
          ? 'bg-black border-neutral-800 text-white'
          : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
      }`}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div
          onClick={() => openProfile(post.user.id)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full ig-gradient-border p-[1.5px] transition group-hover:scale-105">
            <div className={`w-full h-full rounded-full p-[1px] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              <img
                src={post.user.avatar}
                alt={post.user.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold hover:underline">{post.user.username}</span>
              {post.user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />}
              <span className="text-neutral-500 text-xs">• {timeAgo(post.createdAt)}</span>
            </div>
            {post.location && (
              <p className="text-[11px] text-neutral-400 leading-tight">{post.location}</p>
            )}
          </div>
        </div>

        {/* 3-dots menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full hover:bg-neutral-800/20 text-neutral-400 hover:text-white transition"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div
              className={`absolute right-0 top-8 w-44 rounded-xl shadow-xl border py-1.5 z-20 ${
                theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            >
              {isAuthor && (
                <button
                  onClick={() => {
                    deletePost(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Post</span>
                </button>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-neutral-800/20 text-left"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => {
                  openProfile(post.user.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-neutral-800/20 text-left"
              >
                <span>Go to profile</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Content */}
      <div
        onClick={handleMediaClick}
        className="relative aspect-square w-full bg-neutral-950 flex items-center justify-center overflow-hidden cursor-pointer select-none"
      >
        {post.mediaType === 'video' ? (
          <div className="relative w-full h-full" onClick={handleTogglePlay}>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Audio Toggle Button */}
            <button
              onClick={handleToggleMute}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {/* Pause overlay icon if paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="w-12 h-12 text-white fill-white/80" />
              </div>
            )}
          </div>
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className="w-full h-full object-cover transition duration-300"
            loading="lazy"
          />
        )}

        {/* Double-tap Heart Burst Overlay Animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart className="w-28 h-28 text-white fill-white drop-shadow-2xl animate-heart-burst" />
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={() => likePost(post.id)}
              className="hover:opacity-60 transition active:scale-125"
              aria-label={post.isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-6 h-6 transition-colors duration-200 ${
                  post.isLiked ? 'text-rose-500 fill-rose-500' : 'text-current'
                }`}
              />
            </button>

            {/* Comment Button */}
            <button
              onClick={() => commentInputRef.current?.focus()}
              className="hover:opacity-60 transition active:scale-110"
              aria-label="Comment"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            {/* Share / Direct Message Button */}
            <button
              onClick={() => {
                if (post.user.id !== currentUser?.id) {
                  openChatWithUser(post.user.id);
                } else {
                  setShowShareModal(!showShareModal);
                }
              }}
              className="hover:opacity-60 transition active:scale-110"
              aria-label="Direct message"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>

          {/* Bookmark / Save Button */}
          <button
            onClick={() => savePost(post.id)}
            className="hover:opacity-60 transition active:scale-110"
            aria-label="Save"
          >
            <Bookmark
              className={`w-6 h-6 ${
                post.isSaved ? 'text-amber-400 fill-amber-400' : 'text-current'
              }`}
            />
          </button>
        </div>

        {/* Likes Count */}
        <div className="mt-2.5">
          <p className="text-sm font-semibold">
            {post.likesCount === 0
              ? 'Be the first to like this'
              : `${post.likesCount.toLocaleString()} ${post.likesCount === 1 ? 'like' : 'likes'}`}
          </p>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mt-1 text-sm leading-snug">
            <span
              onClick={() => openProfile(post.user.id)}
              className="font-bold cursor-pointer hover:underline mr-1.5"
            >
              {post.user.username}
            </span>
            <span className="text-neutral-300 whitespace-pre-wrap">
              {post.caption}
            </span>
          </div>
        )}

        {/* Comments Count / View comments modal trigger */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => setSelectedPostDetail(post)}
            className="mt-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition block text-left"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        {/* Preview latest comment */}
        {post.comments.length > 0 && (
          <div className="mt-1 text-xs text-neutral-300">
            <span className="font-semibold text-white mr-1.5">
              {post.comments[post.comments.length - 1].user?.username || 'user'}
            </span>
            <span>{post.comments[post.comments.length - 1].text}</span>
          </div>
        )}

        {/* Quick Comment Input */}
        <form
          onSubmit={handleCommentSubmit}
          className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
            theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 mr-2">
            <button
              type="button"
              onClick={() => setCommentText((prev) => prev + ' ❤️ ')}
              className="text-neutral-400 hover:text-white transition"
              title="Add heart emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              ref={commentInputRef}
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs placeholder:text-neutral-500"
            />
          </div>
          {commentText.trim() && (
            <button
              type="submit"
              className="text-pink-500 font-bold hover:text-pink-400 transition"
            >
              Post
            </button>
          )}
        </form>
      </div>
    </article>
  );
};
