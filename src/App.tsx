import React, { useState, useEffect } from 'react';
import { InstagramProvider, useInstagram } from './context/InstagramContext';
import { AuthScreen } from './components/Auth/AuthScreen';
import { Sidebar } from './components/Navigation/Sidebar';
import { MobileHeader } from './components/Navigation/MobileHeader';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { StoriesBar } from './components/Feed/StoriesBar';
import { PostCard } from './components/Feed/PostCard';
import { SuggestionsSidebar } from './components/Feed/SuggestionsSidebar';
import { PostDetailModal } from './components/Feed/PostDetailModal';
import { StoryViewerModal } from './components/Stories/StoryViewerModal';
import { ReelsFeed } from './components/Reels/ReelsFeed';
import { ExploreGrid } from './components/Explore/ExploreGrid';
import { MessagesView } from './components/Messages/MessagesView';
import { ProfileView } from './components/Profile/ProfileView';
import { CreateModal } from './components/Create/CreateModal';
import { SearchDrawer } from './components/Search/SearchDrawer';
import { NotificationsDrawer } from './components/Notifications/NotificationsDrawer';
import { SettingsModal } from './components/Settings/SettingsModal';

const InstagramShell: React.FC = () => {
  const {
    authReady,
    firebaseUser,
    needsOnboarding,
    activeTab,
    posts,
    theme,
    currentUser,
    openCreateModal
  } = useInstagram();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Close drawers when main tab changes
  useEffect(() => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
  }, [activeTab]);

  const handleOpenSearch = () => {
    setIsNotificationsOpen(false);
    setIsSearchOpen((prev) => !prev);
  };

  const handleOpenNotifications = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen((prev) => !prev);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl ig-gradient-border p-1 animate-pulse">
          <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
            <span className="font-instagram text-3xl text-white">IG</span>
          </div>
        </div>
        <p className="text-xs text-neutral-400 tracking-wider uppercase">Connecting to real-time database...</p>
      </div>
    );
  }

  if (!firebaseUser || needsOnboarding) {
    return <AuthScreen />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl ig-gradient-border p-1 animate-pulse">
          <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
            <span className="font-instagram text-3xl text-white">IG</span>
          </div>
        </div>
        <p className="text-xs text-neutral-400 tracking-wider uppercase">Loading your profile...</p>
      </div>
    );
  }

  const isSidebarCollapsed = isSearchOpen || isNotificationsOpen;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Desktop Left Sidebar */}
      <Sidebar
        onOpenSearch={handleOpenSearch}
        onOpenNotifications={handleOpenNotifications}
        isSearchOpen={isSearchOpen}
        isNotificationsOpen={isNotificationsOpen}
      />

      {/* Mobile Top Header */}
      {activeTab !== 'messages' && activeTab !== 'reels' && (
        <MobileHeader onOpenNotifications={handleOpenNotifications} />
      )}

      {/* Main Content Area */}
      <main
        className={`pb-16 md:pb-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-60 xl:pl-64'
        }`}
      >
        {activeTab === 'feed' && (
          <div className="max-w-[960px] mx-auto flex justify-center gap-8 pt-2 sm:pt-4 px-0 sm:px-4">
            {/* Feed Center Column */}
            <div className="w-full max-w-[600px]">
              <StoriesBar />

              <div className="mt-5 px-2 sm:px-0">
                {posts.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 border border-dashed border-neutral-800 rounded-2xl p-6">
                    <p className="text-sm font-semibold text-white mb-1">Welcome to your live feed!</p>
                    <p className="text-xs text-neutral-400 mb-4">
                      Share your first photo or video, or search for friends to follow and chat in real time.
                    </p>
                    <button
                      onClick={() => openCreateModal('post')}
                      className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition"
                    >
                      Share First Post
                    </button>
                  </div>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            </div>

            {/* Right Suggestions Column */}
            <SuggestionsSidebar />
          </div>
        )}

        {activeTab === 'explore' && <ExploreGrid />}
        {activeTab === 'reels' && <ReelsFeed />}
        {activeTab === 'messages' && <MessagesView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenSearch={handleOpenSearch} isSearchOpen={isSearchOpen} />

      {/* Slide-out Search & Notifications Drawers */}
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      {/* Modals */}
      <CreateModal />
      <PostDetailModal />
      <StoryViewerModal />
      <SettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <InstagramProvider>
      <InstagramShell />
    </InstagramProvider>
  );
}
