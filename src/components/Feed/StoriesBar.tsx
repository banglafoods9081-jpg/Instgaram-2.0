import React, { useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { StoryGroup } from '../../types/instagram';

export const StoriesBar: React.FC = () => {
  const {
    currentUser,
    storyGroups,
    setActiveStoryGroup,
    openCreateModal,
    theme
  } = useInstagram();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Check if current user has an active story
  const myStoryGroup = storyGroups.find((g) => g.userId === currentUser?.id);
  const otherStoryGroups = storyGroups.filter((g) => g.userId !== currentUser?.id);

  return (
    <div
      className={`relative w-full py-4 border-b ${
        theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
      }`}
    >
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full items-center justify-center shadow-lg transition ${
          theme === 'dark'
            ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
            : 'bg-white hover:bg-neutral-100 text-neutral-800 border'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Stories list */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar px-2 sm:px-4 scroll-smooth"
      >
        {/* Current User Story / Add Story button */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div
            onClick={() => {
              if (myStoryGroup && myStoryGroup.stories.length > 0) {
                setActiveStoryGroup(myStoryGroup);
              } else {
                openCreateModal('story');
              }
            }}
            className="relative"
          >
            <div
              className={`w-16 h-16 rounded-full p-0.5 transition transform group-hover:scale-105 ${
                myStoryGroup && myStoryGroup.stories.length > 0
                  ? 'ig-gradient-border'
                  : 'p-0'
              }`}
            >
              <div
                className={`w-full h-full rounded-full p-0.5 ${
                  theme === 'dark' ? 'bg-black' : 'bg-white'
                }`}
              >
                <img
                  src={
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
                  }
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* Plus icon on avatar */}
            {(!myStoryGroup || myStoryGroup.stories.length === 0) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModal('story');
                }}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-white shadow-md hover:bg-blue-600 transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>
          <span className="text-xs truncate max-w-[70px] text-neutral-400 group-hover:text-white transition">
            Your story
          </span>
        </div>

        {/* Other Users' Stories */}
        {otherStoryGroups.map((group: StoryGroup) => {
          return (
            <div
              key={group.userId}
              onClick={() => setActiveStoryGroup(group)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-full p-0.5 transition transform group-hover:scale-105 ${
                  group.hasUnviewed
                    ? 'ig-gradient-border animate-none'
                    : theme === 'dark'
                    ? 'bg-neutral-700'
                    : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-full h-full rounded-full p-0.5 ${
                    theme === 'dark' ? 'bg-black' : 'bg-white'
                  }`}
                >
                  <img
                    src={group.user.avatar}
                    alt={group.user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs truncate max-w-[70px] text-neutral-300 group-hover:text-white transition">
                {group.user.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full items-center justify-center shadow-lg transition ${
          theme === 'dark'
            ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
            : 'bg-white hover:bg-neutral-100 text-neutral-800 border'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
