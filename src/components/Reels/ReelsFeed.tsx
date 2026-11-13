import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Music,
  ChevronUp,
  ChevronDown,
  X,
  BadgeCheck
} from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { Reel } from '../../types/instagram';

export const ReelsFeed: React.FC = () => {
  const {
    reels,
    likeReel,
    commentReel,
    currentUser,
    toggleFollow,
    openProfile,
    openChatWithUser,
    theme
  } = useInstagram();

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentReel: Reel | undefined = reels[activeReelIndex];

  const handleNextReel = () => {
    if (activeReelIndex < reels.length - 1) {
      setActiveReelIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevReel = () => {
    if (activeReelIndex > 0) {
      setActiveReelIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
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

  const handleDoubleTap = () => {
    if (currentReel) {
      if (!currentReel.isLiked) {
        likeReel(currentReel.id);
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 900);
    }
  };

  if (!currentReel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <p className="text-neutral-400">No reels found. Create your first reel!</p>
      </div>
    );
  }

  const isFollowing = currentUser?.following?.includes(currentReel.userId);

  return (
    <div className="w-full flex justify-center py-2 sm:py-6 relative min-h-screen">
      {/* Up / Down navigation buttons on desktop */}
      <div className="hidden lg:flex flex-col gap-3 fixed right-8 bottom-1/2 translate-y-1/2 z-20">
        <button
          onClick={handlePrevReel}
          disabled={activeReelIndex === 0}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${
            activeReelIndex === 0
              ? 'opacity-30 cursor-not-allowed border-neutral-700'
              : 'hover:bg-neutral-800 border-neutral-600 text-white'
          }`}
          aria-label="Previous Reel"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextReel}
          disabled={activeReelIndex === reels.length - 1}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${
            activeReelIndex === reels.length - 1
              ? 'opacity-30 cursor-not-allowed border-neutral-700'
              : 'hover:bg-neutral-800 border-neutral-600 text-white'
          }`}
          aria-label="Next Reel"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Reel Phone Container */}
      <div className="relative w-full max-w-[420px] h-[84vh] max-h-[760px] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center select-none">
        <video
          ref={videoRef}
          src={currentReel.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleTogglePlay}
          onDoubleClick={handleDoubleTap}
        />

        {/* Big Double Tap Heart Animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <Heart className="w-28 h-28 text-white fill-white drop-shadow-2xl animate-heart-burst" />
          </div>
        )}

        {/* Play / Pause indicator */}
        {!isPlaying && (
          <div
            onClick={handleTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Volume Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Floating Right Action Bar */}
        <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-5 text-white">
          {/* Like */}
          <button
            onClick={() => likeReel(currentReel.id)}
            className="flex flex-col items-center gap-1 group active:scale-125 transition"
          >
            <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition">
              <Heart
                className={`w-7 h-7 transition ${
                  currentReel.isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'
                }`}
              />
            </div>
            <span className="text-xs font-semibold drop-shadow">
              {currentReel.likesCount.toLocaleString()}
            </span>
          </button>

          {/* Comments */}
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="flex flex-col items-center gap-1 group active:scale-110 transition"
          >
            <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold drop-shadow">
              {currentReel.commentsCount.toLocaleString()}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={() => openChatWithUser(currentReel.userId)}
            className="flex flex-col items-center gap-1 group active:scale-110 transition"
          >
            <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition">
              <Send className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold drop-shadow">Share</span>
          </button>

          {/* Bookmark */}
          <button className="flex flex-col items-center gap-1 group active:scale-110 transition">
            <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition">
              <Bookmark className="w-7 h-7 text-white" />
            </div>
          </button>

          {/* Spinning Vinyl Record with Music Notes */}
          <div className="w-10 h-10 rounded-full border-2 border-white/60 overflow-hidden animate-story-spin relative shadow-lg">
            <img
              src={currentReel.user.avatar}
              alt="Audio disk"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
          </div>
        </div>

        {/* Bottom Left Info & Caption */}
        <div className="absolute left-4 bottom-5 right-20 z-20 text-white text-left">
          {/* Author info */}
          <div className="flex items-center gap-2 mb-2.5">
            <div
              onClick={() => openProfile(currentReel.user.id)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <img
                src={currentReel.user.avatar}
                alt={currentReel.user.username}
                className="w-8 h-8 rounded-full object-cover border border-white"
              />
              <span className="font-bold text-sm hover:underline flex items-center gap-1">
                {currentReel.user.username}
                {currentReel.user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />}
              </span>
            </div>

            {currentReel.userId !== currentUser?.id && (
              <button
                onClick={() => toggleFollow(currentReel.userId)}
                className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                  isFollowing
                    ? 'bg-transparent text-white border-white/40'
                    : 'bg-white text-black border-transparent hover:bg-neutral-200'
                }`}
              >
                {isFollowing
                  ? 'Following'
                  : currentUser?.followers?.includes(currentReel.userId)
                  ? 'Follow Back'
                  : 'Follow'}
              </button>
            )}
          </div>

          {/* Caption */}
          <p className="text-xs line-clamp-2 drop-shadow mb-2 leading-relaxed">
            {currentReel.caption}
          </p>

          {/* Audio Track */}
          <div className="flex items-center gap-2 text-[11px] text-white/90">
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[200px]">{currentReel.audioTrack}</span>
          </div>
        </div>
      </div>

      {/* Reel Comments Drawer */}
      {isCommentsOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex justify-end">
          <div
            className={`w-full max-w-[420px] h-full flex flex-col justify-between border-l p-4 animate-in slide-in-from-right duration-300 ${
              theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm">Comments</h3>
              <button onClick={() => setIsCommentsOpen(false)} className="p-1 hover:opacity-70">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {currentReel.comments.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                currentReel.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5 text-xs">
                    <img
                      src={c.user?.avatar}
                      alt={c.user?.username}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <p>
                        <span className="font-bold mr-1.5">{c.user?.username}</span>
                        <span>{c.text}</span>
                      </p>
                      <span className="text-[10px] text-neutral-400 mt-0.5 block">1h ago</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (commentText.trim() && currentReel) {
                  await commentReel(currentReel.id, commentText);
                  setCommentText('');
                }
              }}
              className="border-t pt-3 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-transparent border border-neutral-700 rounded-full px-3.5 py-2 text-xs outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="text-xs font-bold text-pink-500 disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
