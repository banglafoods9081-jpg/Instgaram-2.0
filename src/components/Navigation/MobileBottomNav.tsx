import React from 'react';
import { Home, Search, Compass, Film, User as UserIcon } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';

interface MobileBottomNavProps {
  onOpenSearch: () => void;
  isSearchOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenSearch, isSearchOpen }) => {
  const { theme, activeTab, setActiveTab, currentUser, openProfile } = useInstagram();

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around py-2.5 border-t backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-black/90 border-neutral-800 text-white'
          : 'bg-white/90 border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Home */}
      <button
        onClick={() => setActiveTab('feed')}
        className="p-1 hover:opacity-70 transition"
        aria-label="Home"
      >
        <Home className="w-6 h-6" strokeWidth={activeTab === 'feed' && !isSearchOpen ? 2.6 : 1.8} />
      </button>

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="p-1 hover:opacity-70 transition"
        aria-label="Search"
      >
        <Search className="w-6 h-6" strokeWidth={isSearchOpen ? 2.6 : 1.8} />
      </button>

      {/* Explore */}
      <button
        onClick={() => setActiveTab('explore')}
        className="p-1 hover:opacity-70 transition"
        aria-label="Explore"
      >
        <Compass className="w-6 h-6" strokeWidth={activeTab === 'explore' && !isSearchOpen ? 2.6 : 1.8} />
      </button>

      {/* Reels */}
      <button
        onClick={() => setActiveTab('reels')}
        className="p-1 hover:opacity-70 transition"
        aria-label="Reels"
      >
        <Film className="w-6 h-6" strokeWidth={activeTab === 'reels' && !isSearchOpen ? 2.6 : 1.8} />
      </button>

      {/* Profile */}
      <button
        onClick={() => openProfile(currentUser?.id)}
        className="p-1 hover:opacity-70 transition"
        aria-label="Profile"
      >
        {currentUser?.avatar ? (
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className={`w-6 h-6 rounded-full object-cover border ${
              activeTab === 'profile' ? 'ring-2 ring-pink-500' : 'border-neutral-700'
            }`}
          />
        ) : (
          <UserIcon className="w-6 h-6" />
        )}
      </button>
    </nav>
  );
};
