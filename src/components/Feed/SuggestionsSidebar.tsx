import React from 'react';
import { useInstagram } from '../../context/InstagramContext';
import { BadgeCheck } from 'lucide-react';

export const SuggestionsSidebar: React.FC = () => {
  const { currentUser, users, toggleFollow, openProfile, setIsSettingsOpen } = useInstagram();

  // Suggestions: users other than current user
  const suggestions = users.filter((u) => u.id !== currentUser?.id).slice(0, 5);

  return (
    <aside className="hidden lg:block w-[320px] xl:w-[350px] shrink-0 pt-6 px-4">
      {/* Current User Row */}
      <div className="flex items-center justify-between py-2">
        <div
          onClick={() => openProfile(currentUser?.id)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src={currentUser?.avatar}
            alt={currentUser?.username}
            className="w-12 h-12 rounded-full object-cover border border-neutral-700 transition group-hover:scale-105"
          />
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold hover:underline">{currentUser?.username}</span>
              {currentUser?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />}
            </div>
            <p className="text-xs text-neutral-400">{currentUser?.name}</p>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-xs font-bold text-pink-500 hover:text-pink-400 transition"
        >
          Settings
        </button>
      </div>

      {/* Suggested For You Header */}
      <div className="flex items-center justify-between mt-6 mb-3">
        <span className="text-xs font-semibold text-neutral-400">Suggested for you</span>
        <button
          onClick={() => {}}
          className="text-xs font-semibold hover:text-neutral-300 transition text-neutral-400"
        >
          See All
        </button>
      </div>

      {/* Suggested Users List */}
      <div className="space-y-3">
        {suggestions.map((user) => {
          const isFollowing = currentUser?.following?.includes(user.id);
          const isFollower = currentUser?.followers?.includes(user.id);

          return (
            <div key={user.id} className="flex items-center justify-between">
              <div
                onClick={() => openProfile(user.id)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-9 h-9 rounded-full object-cover transition group-hover:scale-105"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold hover:underline">{user.username}</span>
                    {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate max-w-[140px]">
                    {isFollower ? 'Follows you' : 'Popular creator'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleFollow(user.id)}
                className={`text-xs font-bold px-2.5 py-1 rounded-md transition ${
                  isFollowing
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'text-pink-500 hover:text-pink-400'
                }`}
              >
                {isFollowing ? 'Following' : isFollower ? 'Follow Back' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-[11px] text-neutral-500 leading-relaxed">
        <p className="space-x-1">
          <span>About</span> • <span>Help</span> • <span>Press</span> • <span>API</span> •{' '}
          <span>Jobs</span> • <span>Privacy</span> • <span>Terms</span> • <span>Locations</span>
        </p>
        <p className="mt-3 uppercase font-medium tracking-wider">
          © 2026 INSTAGRAM FROM META
        </p>
      </div>
    </aside>
  );
};
