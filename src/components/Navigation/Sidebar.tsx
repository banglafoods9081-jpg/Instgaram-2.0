import React, { useState } from 'react';
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
  Moon,
  Sun,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { PWAInstallButton } from '../PWA/PWAInstallButton';

interface SidebarProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  isSearchOpen: boolean;
  isNotificationsOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSearch,
  onOpenNotifications,
  isSearchOpen,
  isNotificationsOpen
}) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    openProfile,
    openCreateModal,
    unreadNotificationsCount,
    unreadMessagesCount,
    theme,
    setTheme,
    setIsSettingsOpen,
    logout
  } = useInstagram();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isCollapsed = isSearchOpen || isNotificationsOpen;

  return (
    <aside
      className={`hidden md:flex flex-col justify-between h-screen fixed left-0 top-0 border-r transition-all duration-300 z-30 select-none ${
        theme === 'dark' ? 'bg-black border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
      } ${isCollapsed ? 'w-20 px-3' : 'w-60 xl:w-64 px-4'}`}
    >
      {/* Top Header / Logo */}
      <div className="pt-7 pb-4">
        {isCollapsed ? (
          <button
            onClick={() => {
              setActiveTab('feed');
            }}
            className="w-full flex justify-center py-2 hover:opacity-80 transition"
            title="Instagram"
          >
            <div className="w-9 h-9 rounded-xl ig-gradient-border p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <span className="font-bold text-lg text-white">IG</span>
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => {
              setActiveTab('feed');
            }}
            className="px-3 flex items-center gap-2 hover:opacity-90 transition group"
          >
            <span className="font-instagram text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500">
              Instagram
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
              Live
            </span>
          </button>
        )}

        {/* Navigation Items */}
        <nav className="mt-7 flex flex-col space-y-1.5">
          {/* Home */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left ${
              activeTab === 'feed'
                ? theme === 'dark' ? 'bg-neutral-900 font-bold' : 'bg-neutral-100 font-bold'
                : 'hover:bg-neutral-800/40 font-medium'
            }`}
          >
            <Home className="w-6 h-6 shrink-0" strokeWidth={activeTab === 'feed' ? 2.6 : 2} />
            {!isCollapsed && <span className="text-[15px]">Home</span>}
          </button>

          {/* Search */}
          <button
            onClick={onOpenSearch}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left ${
              isSearchOpen
                ? theme === 'dark' ? 'bg-neutral-900 font-bold' : 'bg-neutral-100 font-bold'
                : 'hover:bg-neutral-800/40 font-medium'
            }`}
          >
            <Search className="w-6 h-6 shrink-0" strokeWidth={isSearchOpen ? 2.6 : 2} />
            {!isCollapsed && <span className="text-[15px]">Search</span>}
          </button>

          {/* Explore */}
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left ${
              activeTab === 'explore'
                ? theme === 'dark' ? 'bg-neutral-900 font-bold' : 'bg-neutral-100 font-bold'
                : 'hover:bg-neutral-800/40 font-medium'
            }`}
          >
            <Compass className="w-6 h-6 shrink-0" strokeWidth={activeTab === 'explore' ? 2.6 : 2} />
            {!isCollapsed && <span className="text-[15px]">Explore</span>}
          </button>

          {/* Reels */}
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left ${
              activeTab === 'reels'
                ? theme === 'dark' ? 'bg-neutral-900 font-bold' : 'bg-neutral-100 font-bold'
                : 'hover:bg-neutral-800/40 font-medium'
            }`}
          >
            <Film className="w-6 h-6 shrink-0" strokeWidth={activeTab === 'reels' ? 2.6 : 2} />
            {!isCollapsed && <span className="text-[15px]">Reels</span>}
          </button>

          {/* Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left relative ${
              activeTab === 'messages'
                ? theme === 'dark' ? 'bg-neutral-900 font-bold' : 'bg-neutral-100 font-bold'
                : 'hover:bg-neutral-800/40 font-medium'
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6 shrink-0" strokeWidth={activeTab === 'messages' ? 2.6 : 2} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[11px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </div>
            {!isCollapsed && <span className="text-[15px]">Messages</span>}
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left relative ${
              isNotificationsOpen
                ? theme === 'dark' ? 'bg-neutral-900 font-bold' : 'bg-neutral-100 font-bold'
                : 'hover:bg-neutral-800/40 font-medium'
            }`}
          >
            <div className="relative">
              <Heart className="w-6 h-6 shrink-0" strokeWidth={isNotificationsOpen ? 2.6 : 2} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 w-2.5 h-2.5 rounded-full ring-2 ring-black animate-pulse" />
              )}
            </div>
            {!isCollapsed && <span className="text-[15px]">Notifications</span>}
          </button>

          {/* Create */}
          <button
            onClick={() => openCreateModal('post')}
            className="flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left hover:bg-neutral-800/40 font-medium"
          >
            <PlusSquare className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span className="text-[15px]">Create</span>}
          </button>

          {/* Profile */}
          <button
            onClick={() => openProfile(currentUser?.id)}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-200 w-full text-left ${
              activeTab === 'profile'
                ? theme === 'dark' ? 'bg-neutral-900 font-bold' : 'bg-neutral-100 font-bold'
                : 'hover:bg-neutral-800/40 font-medium'
            }`}
          >
            <div className={`w-6 h-6 rounded-full overflow-hidden shrink-0 border ${activeTab === 'profile' ? 'ring-2 ring-pink-500' : 'border-neutral-700'}`}>
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                alt={currentUser?.username}
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsed && <span className="text-[15px]">Profile</span>}
          </button>
        </nav>
      </div>

      {/* Bottom Controls / More Menu */}
      <div className="pb-6 relative">
        {/* More Menu Dropdown */}
        {isMoreMenuOpen && (
          <div
            className={`absolute bottom-16 left-2 w-64 rounded-2xl shadow-2xl border p-2 z-50 animate-in fade-in slide-in-from-bottom-2 ${
              theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setIsMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800/40 transition text-left"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                setIsMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800/40 transition text-left"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Switch appearance ({theme === 'dark' ? 'Light' : 'Dark'})</span>
            </button>
            <div className={`my-1 border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`} />
            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800/40 transition text-left text-rose-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}

        {/* Current User Quick Info */}
        {!isCollapsed ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => openProfile(currentUser?.id)}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                theme === 'dark' ? 'hover:bg-neutral-900 bg-neutral-950/60 border border-neutral-800/80' : 'hover:bg-neutral-100 bg-neutral-50 border border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.username}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-bold truncate">@{currentUser?.username}</p>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            <PWAInstallButton variant="sidebar" theme={theme} />

            {/* More Menu Button */}
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="flex items-center gap-4 px-3 py-2.5 rounded-xl transition duration-200 w-full text-left hover:bg-neutral-800/40 font-medium"
            >
              <Menu className="w-6 h-6 shrink-0" />
              <span className="text-[15px]">More</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 items-center">
            <PWAInstallButton variant="sidebar" collapsed theme={theme} />
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="w-full flex justify-center py-2 hover:bg-neutral-800/40 rounded-xl transition"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
