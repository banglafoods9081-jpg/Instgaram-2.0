import React, { useState, useEffect } from 'react';
import { Search, X, BadgeCheck, MessageCircle } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { User } from '../../types/instagram';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDrawer: React.FC<SearchDrawerProps> = ({ isOpen, onClose }) => {
  const {
    users,
    currentUser,
    toggleFollow,
    openProfile,
    openChatWithUser,
    theme
  } = useInstagram();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>(users);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim().toLowerCase();
    const others = users.filter((u) => u.id !== currentUser?.id);
    if (!trimmed) {
      setResults(others);
      return;
    }

    setResults(
      others.filter(
        (u) =>
          u.username.toLowerCase().includes(trimmed) ||
          u.name.toLowerCase().includes(trimmed) ||
          u.bio.toLowerCase().includes(trimmed)
      )
    );
  }, [query, users, currentUser?.id, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px]"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 md:left-20 bottom-14 md:bottom-0 w-full sm:w-[390px] z-40 border-r shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 ${
          theme === 'dark'
            ? 'bg-black border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">Search</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-800/30 transition"
              aria-label="Close Search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm ${
              theme === 'dark'
                ? 'bg-neutral-900 border-neutral-800 text-white'
                : 'bg-neutral-100 border-neutral-200 text-neutral-900'
            }`}
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search users by name or @username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm placeholder:text-neutral-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-0.5 rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400">
            {query.trim() ? `Results for "${query}"` : 'Discover Creators & Friends'}
          </div>

          {results.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No users found matching "{query}".
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              {results.map((user) => {
                const isFollowing = currentUser?.following?.includes(user.id);
                const isFollower = currentUser?.followers?.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                      theme === 'dark' ? 'hover:bg-neutral-900' : 'hover:bg-neutral-100'
                    }`}
                  >
                    <div
                      onClick={() => {
                        openProfile(user.id);
                        onClose();
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                    >
                      <div className="w-11 h-11 rounded-full ig-gradient-border p-[1.5px] shrink-0">
                        <div className={`w-full h-full rounded-full p-[1px] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold truncate hover:underline">
                            {user.username}
                          </span>
                          {user.isVerified && (
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate">
                          {user.name} {isFollower ? '• Follows you' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          openChatWithUser(user.id);
                          onClose();
                        }}
                        className={`p-2 rounded-lg transition ${
                          theme === 'dark'
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                            : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                        }`}
                        title="Message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleFollow(user.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isFollowing
                            ? theme === 'dark'
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                              : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900'
                            : 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm'
                        }`}
                      >
                        {isFollowing ? 'Following' : isFollower ? 'Follow Back' : 'Follow'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
