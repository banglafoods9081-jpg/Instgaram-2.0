import React from 'react';
import { Heart, MessageCircle, PlusSquare } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';

interface MobileHeaderProps {
  onOpenNotifications: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenNotifications }) => {
  const { theme, setActiveTab, openCreateModal, unreadNotificationsCount, unreadMessagesCount } = useInstagram();

  return (
    <header
      className={`md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 border-b backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-black/90 border-neutral-800 text-white'
          : 'bg-white/90 border-neutral-200 text-neutral-900'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('feed')}
          className="font-instagram text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500"
        >
          Instagram
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => openCreateModal('post')}
          className="p-1 hover:opacity-70 transition"
          aria-label="Create Post"
        >
          <PlusSquare className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenNotifications}
          className="p-1 hover:opacity-70 transition relative"
          aria-label="Notifications"
        >
          <Heart className="w-6 h-6" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-black animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className="p-1 hover:opacity-70 transition relative"
          aria-label="Messages"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
