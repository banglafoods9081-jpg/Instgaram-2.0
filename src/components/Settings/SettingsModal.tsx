import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  Moon,
  Sun,
  Lock,
  Upload,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { compressImageToDataUrl } from '../../utils/mediaUtils';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currentUser,
    firebaseUser,
    updateProfile,
    logout,
    theme,
    setTheme
  } = useInstagram();

  const [tab, setTab] = useState<'profile' | 'account' | 'preferences'>('profile');

  // Edit profile state
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [website, setWebsite] = useState(currentUser?.website || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isPrivate, setIsPrivate] = useState(Boolean(currentUser?.isPrivate));
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && isSettingsOpen) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setWebsite(currentUser.website || '');
      setAvatar(currentUser.avatar || '');
      setIsPrivate(Boolean(currentUser.isPrivate));
      setSaveMessage('');
    }
  }, [currentUser, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 400, 0.78);
      setAvatar(compressed);
    } catch (err) {
      console.error('Avatar upload error:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateProfile({ name, bio, website, avatar, isPrivate });
      setSaveMessage('Profile saved to cloud database!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={() => setIsSettingsOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          theme === 'dark'
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/40 flex items-center justify-between">
          <h2 className="font-bold text-lg">Settings & Account</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-full hover:bg-neutral-800/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left Tabs */}
          <div className="w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-neutral-800/40 p-2 flex sm:flex-col gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => setTab('profile')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                tab === 'profile'
                  ? 'bg-pink-500 text-white'
                  : 'hover:bg-neutral-800/40 text-neutral-400'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setTab('account')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                tab === 'account'
                  ? 'bg-pink-500 text-white'
                  : 'hover:bg-neutral-800/40 text-neutral-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Account & Session</span>
            </button>
            <button
              onClick={() => setTab('preferences')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                tab === 'preferences'
                  ? 'bg-pink-500 text-white'
                  : 'hover:bg-neutral-800/40 text-neutral-400'
              }`}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>Preferences</span>
            </button>
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {tab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar preview + upload */}
                <div className="flex items-center gap-4">
                  <img
                    src={avatar || currentUser?.avatar}
                    alt={currentUser?.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-pink-500"
                  />
                  <div>
                    <p className="font-bold text-sm">@{currentUser?.username}</p>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-pink-500 hover:text-pink-400"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change profile photo</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border border-neutral-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-transparent border border-neutral-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-transparent border border-neutral-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-xs font-bold">Private Account</p>
                      <p className="text-[11px] text-neutral-400">Show private badge on profile</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-11 h-6 rounded-full transition p-0.5 ${
                      isPrivate ? 'bg-pink-500' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition transform ${
                        isPrivate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {saveMessage && (
                  <p className="text-xs text-emerald-400 font-semibold">{saveMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {tab === 'account' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-neutral-800 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Signed-In Account
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={currentUser?.avatar}
                      alt={currentUser?.username}
                      className="w-11 h-11 rounded-full object-cover border border-pink-500"
                    />
                    <div>
                      <p className="text-sm font-bold">@{currentUser?.username}</p>
                      <p className="text-xs text-neutral-400">{firebaseUser?.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 pt-2 leading-relaxed">
                    Your account is permanently linked and synced in real time. Logging out keeps all your posts, followers, stories, and messages safely stored.
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out / Switch Google Account</span>
                </button>
              </div>
            )}

            {tab === 'preferences' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-pink-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <p className="text-sm font-bold">Theme Appearance</p>
                      <p className="text-xs text-neutral-400">
                        Currently using {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="px-4 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition"
                  >
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Cloud Firestore Real-Time Sync Active</p>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      All posts, reels, stories, follows, notifications, and inbox direct messages are stored permanently in Firebase Firestore and update instantaneously across every device.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
