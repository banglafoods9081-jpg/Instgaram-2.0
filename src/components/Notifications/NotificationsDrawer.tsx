import React, { useEffect } from 'react';
import { X, Heart, MessageCircle, UserPlus, BadgeCheck } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationsAsRead,
    currentUser,
    toggleFollow,
    openProfile,
    posts,
    setSelectedPostDetail,
    theme
  } = useInstagram();

  useEffect(() => {
    if (isOpen) {
      markNotificationsAsRead();
    }
  }, [isOpen, markNotificationsAsRead]);

  if (!isOpen) return null;

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px]"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 md:left-20 bottom-14 md:bottom-0 w-full sm:w-[400px] z-40 border-r shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 ${
          theme === 'dark'
            ? 'bg-black border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800/40 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
            <p className="text-[11px] text-emerald-400 font-medium">Real-time activity stream</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800/30 transition"
            aria-label="Close Notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-700 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-sm font-semibold">Activity On Your Posts</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-[240px] mx-auto">
                When someone likes, comments on your posts, or follows you, you'll see it here in real time.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isFollowingActor = currentUser?.following?.includes(notif.actorId);
              const linkedPost = notif.postId ? posts.find((p) => p.id === notif.postId) : undefined;

              return (
                <div
                  key={notif.id}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl transition ${
                    !notif.isRead
                      ? theme === 'dark'
                        ? 'bg-pink-500/10'
                        : 'bg-pink-50'
                      : theme === 'dark'
                      ? 'hover:bg-neutral-900'
                      : 'hover:bg-neutral-100'
                  }`}
                >
                  {/* Actor Avatar & Text */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      onClick={() => {
                        openProfile(notif.actorId);
                        onClose();
                      }}
                      className="relative cursor-pointer shrink-0"
                    >
                      <img
                        src={notif.actor?.avatar}
                        alt={notif.actor?.username}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-black text-white ${
                          notif.type === 'like'
                            ? 'bg-rose-500'
                            : notif.type === 'comment'
                            ? 'bg-blue-500'
                            : 'bg-pink-500'
                        }`}
                      >
                        {notif.type === 'like' && <Heart className="w-2.5 h-2.5 fill-white" />}
                        {notif.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 fill-white" />}
                        {(notif.type === 'follow' || notif.type === 'mention') && (
                          <UserPlus className="w-2.5 h-2.5" />
                        )}
                      </span>
                    </div>

                    <div className="text-xs leading-snug min-w-0">
                      <span
                        onClick={() => {
                          openProfile(notif.actorId);
                          onClose();
                        }}
                        className="font-bold cursor-pointer hover:underline inline-flex items-center gap-1 mr-1"
                      >
                        {notif.actor?.username}
                        {notif.actor?.isVerified && (
                          <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-500 inline" />
                        )}
                      </span>
                      <span className={theme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}>
                        {notif.text}
                      </span>
                      <span className="text-neutral-500 ml-1.5">{timeAgo(notif.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right Action: Follow Back button or Post Thumbnail */}
                  <div className="shrink-0">
                    {notif.type === 'follow' && notif.actorId !== currentUser?.id ? (
                      <button
                        onClick={() => toggleFollow(notif.actorId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isFollowingActor
                            ? theme === 'dark'
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                              : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                            : 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm'
                        }`}
                      >
                        {isFollowingActor ? 'Following' : 'Follow Back'}
                      </button>
                    ) : notif.postMediaUrl ? (
                      <img
                        onClick={() => {
                          if (linkedPost) {
                            setSelectedPostDetail(linkedPost);
                            onClose();
                          }
                        }}
                        src={notif.postMediaUrl}
                        alt="Post"
                        className="w-11 h-11 rounded-lg object-cover cursor-pointer hover:opacity-80 transition border border-neutral-800"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
