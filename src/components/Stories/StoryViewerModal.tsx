import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, Send, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { StoryGroup } from '../../types/instagram';

export const StoryViewerModal: React.FC = () => {
  const {
    activeStoryGroup,
    setActiveStoryGroup,
    storyGroups,
    markStoryViewed,
    sendMessage,
    openChatWithUser
  } = useInstagram();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactionEffect, setShowReactionEffect] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const STORY_DURATION = 5000; // 5 seconds per story

  const currentStory = activeStoryGroup?.stories[currentIndex];

  const handleNextStory = useCallback(() => {
    if (!activeStoryGroup) return;

    if (currentIndex < activeStoryGroup.stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Find next story group if available
      const currentGroupIdx = storyGroups.findIndex((g) => g.userId === activeStoryGroup.userId);
      if (currentGroupIdx !== -1 && currentGroupIdx < storyGroups.length - 1) {
        setActiveStoryGroup(storyGroups[currentGroupIdx + 1]);
        setCurrentIndex(0);
        setProgress(0);
      } else {
        setActiveStoryGroup(null);
      }
    }
  }, [activeStoryGroup, currentIndex, storyGroups, setActiveStoryGroup]);

  const handlePrevStory = useCallback(() => {
    if (!activeStoryGroup) return;

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      const currentGroupIdx = storyGroups.findIndex((g) => g.userId === activeStoryGroup.userId);
      if (currentGroupIdx > 0) {
        const prevGroup = storyGroups[currentGroupIdx - 1];
        setActiveStoryGroup(prevGroup);
        setCurrentIndex(prevGroup.stories.length - 1);
        setProgress(0);
      }
    }
  }, [activeStoryGroup, currentIndex, storyGroups, setActiveStoryGroup]);

  // Mark current story viewed
  useEffect(() => {
    if (currentStory) {
      markStoryViewed(currentStory.id);
    }
  }, [currentStory, markStoryViewed]);

  // Timer loop for story progress
  useEffect(() => {
    if (!activeStoryGroup || isPaused) return;

    const interval = 50; // update every 50ms
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (interval / STORY_DURATION) * 100;
        if (next >= 100) {
          clearInterval(timerRef.current);
          handleNextStory();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeStoryGroup, currentIndex, isPaused, handleNextStory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveStoryGroup(null);
      if (e.key === 'ArrowRight') handleNextStory();
      if (e.key === 'ArrowLeft') handlePrevStory();
      if (e.key === ' ') setIsPaused((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStory, handlePrevStory, setActiveStoryGroup]);

  if (!activeStoryGroup || !currentStory) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    openChatWithUser(activeStoryGroup.userId);
    sendMessage(`Replied to story: "${replyText.trim()}"`);
    setReplyText('');
    setShowReactionEffect('Sent! 🚀');
    setTimeout(() => setShowReactionEffect(null), 2000);
  };

  const handleQuickReaction = (emoji: string) => {
    setShowReactionEffect(emoji);
    setTimeout(() => setShowReactionEffect(null), 1500);
    openChatWithUser(activeStoryGroup.userId);
    sendMessage(`Reacted ${emoji} to your story!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center select-none">
      {/* Close button */}
      <button
        onClick={() => setActiveStoryGroup(null)}
        className="absolute top-4 right-4 text-white hover:opacity-75 transition p-2 z-50"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Prev Group Button */}
      <button
        onClick={handlePrevStory}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white backdrop-blur-md transition"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Next Group Button */}
      <button
        onClick={handleNextStory}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white backdrop-blur-md transition"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Card Container */}
      <div
        className="relative w-full max-w-[420px] h-[92vh] max-h-[780px] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {activeStoryGroup.stories.map((story, idx) => {
            let width = '0%';
            if (idx < currentIndex) width = '100%';
            else if (idx === currentIndex) width = `${progress}%`;

            return (
              <div
                key={story.id}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{ width }}
                />
              </div>
            );
          })}
        </div>

        {/* User Info Header */}
        <div className="absolute top-7 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <img
              src={activeStoryGroup.user.avatar}
              alt={activeStoryGroup.user.username}
              className="w-8 h-8 rounded-full object-cover border border-white/50"
            />
            <div>
              <p className="text-sm font-bold leading-tight">{activeStoryGroup.user.username}</p>
              <p className="text-[10px] text-white/80">Active now</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              className="p-1 hover:opacity-75 transition"
            >
              {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
            </button>
          </div>
        </div>

        {/* Media Background */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}

          {/* Left / Right Click Nav Zones */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
            onClick={handlePrevStory}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2/3 z-20 cursor-pointer"
            onClick={handleNextStory}
          />

          {/* Caption Overlay */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-25 text-center">
              <span className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white font-medium text-sm">
                {currentStory.caption}
              </span>
            </div>
          )}

          {/* Floating Reaction Animation */}
          {showReactionEffect && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <span className="text-6xl animate-bounce drop-shadow-lg">
                {showReactionEffect}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Reply Bar & Reactions */}
        <div
          className="absolute bottom-3 left-3 right-3 z-30 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Reaction Emoji Bar */}
          <div className="flex items-center justify-center gap-3 py-1">
            {['❤️', '🔥', '😂', '😮', '👏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleQuickReaction(emoji)}
                className="text-2xl hover:scale-130 transition transform active:scale-95 p-1"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Reply to ${activeStoryGroup.user.username}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-black/50 border border-white/40 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/70 outline-none backdrop-blur-md focus:border-white transition"
            />
            {replyText.trim() ? (
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center transition"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleQuickReaction('❤️')}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition border border-white/40"
              >
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
