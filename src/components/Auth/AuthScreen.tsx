import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, Sparkles, ShieldCheck, ArrowRight, LogOut } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { compressImageToDataUrl } from '../../utils/mediaUtils';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
];

export const AuthScreen: React.FC = () => {
  const {
    firebaseUser,
    needsOnboarding,
    signInWithGoogle,
    completeRegistration,
    logout,
    authError
  } = useInstagram();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Onboarding state (shown once after first sign-in if no Firestore profile exists)
  const suggestedUsername = (firebaseUser?.email?.split('@')[0] || 'creator')
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 20);

  const [username, setUsername] = useState(suggestedUsername.length >= 3 ? suggestedUsername : `${suggestedUsername}_ig`);
  const [name, setName] = useState(firebaseUser?.displayName || '');
  const [bio, setBio] = useState('Sharing moments in real time ✨');
  const [avatar, setAvatar] = useState(firebaseUser?.photoURL || AVATAR_OPTIONS[0]);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleGoogleAuth = async () => {
    setLocalError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(err?.message || 'Could not sign in. Please allow popups and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 400, 0.78);
      setAvatar(compressed);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to process photo');
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const clean = username.toLowerCase().trim().replace(/[^a-z0-9_.]/g, '');
    if (clean.length < 3) {
      setLocalError('Username must be at least 3 characters (letters, numbers, _ or .).');
      return;
    }
    if (!name.trim()) {
      setLocalError('Please enter your display name.');
      return;
    }

    setIsLoading(true);
    try {
      await completeRegistration({
        username: clean,
        name: name.trim(),
        bio: bio.trim(),
        avatar
      });
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Authenticated with Google, creating Instagram profile ONCE
  if (firebaseUser && needsOnboarding) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="font-instagram text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500">
              Instagram
            </span>
            <button
              onClick={logout}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch account</span>
            </button>
          </div>

          <h1 className="text-xl font-bold mb-1">Create Your Profile</h1>
          <p className="text-xs text-neutral-400 mb-6">
            One-time setup for <span className="text-neutral-200 font-medium">{firebaseUser.email}</span>. Your profile & data will stay saved forever.
          </p>

          <form onSubmit={handleCompleteOnboarding} className="space-y-4">
            {/* Avatar picker */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full ig-gradient-border p-0.5 shrink-0">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover bg-neutral-900"
                />
              </div>
              <div className="flex-1">
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-500 hover:text-pink-400"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload profile photo</span>
                </button>
                <div className="flex gap-1.5 mt-2">
                  {AVATAR_OPTIONS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Preset"
                      onClick={() => setAvatar(url)}
                      className={`w-7 h-7 rounded-full object-cover cursor-pointer border-2 transition ${
                        avatar === url ? 'border-pink-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">Username</label>
              <div className="flex items-center border border-neutral-800 bg-neutral-900 rounded-xl px-3 py-2.5 focus-within:border-pink-500 transition">
                <span className="text-neutral-500 text-sm mr-1">@</span>
                <input
                  type="text"
                  required
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  className="bg-transparent border-none outline-none w-full text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-pink-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">Bio</label>
              <textarea
                rows={2}
                placeholder="Tell friends about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-pink-500 transition resize-none"
              />
            </div>

            {(localError || authError) && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                {localError || authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Sign Up'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 1: Login / Create Account landing screen
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Showcase Card */}
        <div className="hidden md:flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border border-neutral-800/80 min-h-[480px]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Cloud Social Network</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight mb-4">
              Share stories, reels & chat live with friends.
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Create your account once — all your photos, stories, followers, notifications, and inbox chats stay permanently saved in real-time Firestore.
            </p>
          </div>

          <div className="space-y-3 mt-8">
            {[
              'Post photos, videos, 24h stories & vertical reels',
              'Search friends, follow & follow back instantly',
              'Real-time inbox chat with typing & seen status'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Login / Sign Up Card */}
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-7 shadow-2xl text-center">
            <h1 className="font-instagram text-5xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500">
              Instagram
            </h1>
            <p className="text-xs text-neutral-400 mb-6">
              {mode === 'login'
                ? 'Log in to access your saved profile, feed & messages.'
                : 'Create a permanent account in seconds.'}
            </p>

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 bg-neutral-900 p-1 rounded-xl mb-6 border border-neutral-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  mode === 'login' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  mode === 'signup' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {(localError || authError) && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 mb-4 text-left">
                {localError || authError}
              </p>
            )}

            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm shadow-lg transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>
                {isLoading
                  ? 'Connecting...'
                  : mode === 'login'
                  ? 'Log in with Google'
                  : 'Create account with Google'}
              </span>
            </button>

            <div className="mt-5 pt-4 border-t border-neutral-800/70 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Your account stays saved across all devices</span>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center text-xs text-neutral-400">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-pink-500 font-bold hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-pink-500 font-bold hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
