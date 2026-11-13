import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  MapPin,
  Music,
  Link2
} from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { compressImageToDataUrl, readVideoToDataUrl } from '../../utils/mediaUtils';

const PRESET_MEDIA = [
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1000&auto=format&fit=crop&q=80',
    title: 'Cat Portrait 🐱',
    caption: 'Curious eyes and soft purrs 🐾 Living that cozy aesthetic.',
    location: 'Home Studio'
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80',
    title: 'Parisian Morning ☕',
    caption: 'Croissants and fresh espresso by the Seine 🥐🇫🇷 #paris #wanderlust',
    location: 'Paris, France'
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1000&auto=format&fit=crop&q=80',
    title: 'Tokyo Skyline 🗼',
    caption: 'Neon dreams above the metropolis! The city that never sleeps. #tokyo #cityscape',
    location: 'Shinjuku, Tokyo'
  },
  {
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    title: 'Ocean Surf Wave 🌊',
    caption: 'Listen to the frequency of the sea 🌊 #ocean #reels #cinematic',
    location: 'Honolulu, Hawaii'
  },
  {
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    title: 'Bamboo Forest 🎋',
    caption: 'Serenity found in nature 🍃 #zen #forest #reels',
    location: 'Kyoto, Japan'
  }
];

const FILTERS = [
  { name: 'Normal', filter: 'none' },
  { name: 'Clarendon', filter: 'contrast(1.2) saturate(1.25)' },
  { name: 'Gingham', filter: 'brightness(1.05) hue-rotate(-10deg)' },
  { name: 'Moon (B&W)', filter: 'grayscale(1) contrast(1.1)' },
  { name: 'Juno', filter: 'contrast(1.15) saturate(1.4) sepia(0.15)' },
  { name: 'Lark', filter: 'contrast(0.9) brightness(1.15) saturate(1.1)' },
  { name: 'Valencia', filter: 'sepia(0.25) contrast(1.08) brightness(1.08)' }
];

export const CreateModal: React.FC = () => {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createModalType,
    createPost,
    createReel,
    createStory,
    currentUser,
    theme
  } = useInstagram();

  const [contentType, setContentType] = useState<'post' | 'reel' | 'story'>(createModalType || 'post');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [audioTrack, setAudioTrack] = useState<string>('Original Audio');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      setContentType(createModalType || 'post');
      setMediaUrl('');
      setCaption('');
      setLocation('');
      setSelectedFilter('none');
      setUploadError(null);
      setUrlInput('');
    }
  }, [isCreateModalOpen, createModalType]);

  if (!isCreateModalOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const isVideo = file.type.startsWith('video');
    setMediaType(isVideo ? 'video' : 'image');

    try {
      if (isVideo) {
        const videoDataUrl = await readVideoToDataUrl(file);
        setMediaUrl(videoDataUrl);
      } else {
        const compressedImage = await compressImageToDataUrl(file, 960, 0.76);
        setMediaUrl(compressedImage);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to load media file.');
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setUploadError(null);
    const looksLikeVideo = /\.(mp4|webm|mov)(\?|$)/i.test(trimmed) || contentType === 'reel';
    setMediaType(looksLikeVideo ? 'video' : 'image');
    setMediaUrl(trimmed);
  };

  const handleSelectPreset = (preset: typeof PRESET_MEDIA[0]) => {
    setMediaUrl(preset.url);
    setMediaType(preset.type as 'image' | 'video');
    setCaption(preset.caption);
    setLocation(preset.location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;

    setIsSubmitting(true);
    try {
      if (contentType === 'post') {
        await createPost({
          mediaUrl,
          mediaType,
          caption,
          location,
          audioTrack
        });
      } else if (contentType === 'reel') {
        await createReel({
          videoUrl: mediaUrl,
          caption,
          audioTrack
        });
      } else if (contentType === 'story') {
        await createStory({
          mediaUrl,
          mediaType,
          caption
        });
      }
      closeCreateModal();
    } catch (err) {
      console.error('Publish error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800/40">
          <button onClick={closeCreateModal} className="p-1 hover:opacity-75 transition">
            <X className="w-5 h-5" />
          </button>

          {/* Type selector */}
          <div className="flex items-center bg-neutral-800/40 p-1 rounded-xl">
            <button
              onClick={() => setContentType('post')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                contentType === 'post' ? 'bg-pink-500 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Feed Post
            </button>
            <button
              onClick={() => setContentType('reel')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                contentType === 'reel' ? 'bg-pink-500 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Reel
            </button>
            <button
              onClick={() => setContentType('story')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                contentType === 'story' ? 'bg-pink-500 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Story
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!mediaUrl || isSubmitting}
            className="text-pink-500 font-bold text-sm hover:text-pink-400 disabled:opacity-40 transition"
          >
            {isSubmitting ? 'Sharing...' : 'Share'}
          </button>
        </div>

        {/* Content Body: Split Left (Media) & Right (Details) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
          {/* Left Media Area */}
          <div className="w-full md:w-3/5 bg-black flex flex-col items-center justify-center min-h-[300px] md:min-h-[460px] p-4 relative">
            {mediaUrl ? (
              <div className="relative w-full h-full flex items-center justify-center max-h-[420px]">
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    className="max-h-[420px] rounded-xl object-contain shadow-lg"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    style={{ filter: selectedFilter }}
                    className="max-h-[420px] rounded-xl object-contain shadow-lg transition duration-200"
                  />
                )}
                <button
                  onClick={() => setMediaUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
                  title="Remove media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Drag & Drop Upload trigger */
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-neutral-800/80 flex items-center justify-center mb-4">
                  <Upload className="w-10 h-10 text-neutral-400" />
                </div>
                <h4 className="font-bold text-base mb-1">Drag photos and videos here</h4>
                <p className="text-xs text-neutral-400 mb-5">
                  Upload high quality media from your computer or phone
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs shadow-md transition mb-4"
                >
                  Select from device
                </button>

                {/* Direct URL option for larger videos/images */}
                <div className="w-full max-w-xs flex items-center gap-1.5 mb-3">
                  <div className="flex-1 flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5">
                    <Link2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <input
                      type="url"
                      placeholder="Or paste image/MP4 URL..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-[11px] text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-white"
                  >
                    Use
                  </button>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-1.5 mb-3 max-w-xs">
                    {uploadError}
                  </p>
                )}

                {/* Preset Suggestions */}
                <div className="w-full border-t border-neutral-800 pt-4">
                  <p className="text-xs text-neutral-400 mb-2 font-medium">Or pick an aesthetic sample:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_MEDIA.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectPreset(preset)}
                        className="cursor-pointer group rounded-lg overflow-hidden border border-neutral-700 hover:border-pink-500 transition relative aspect-square bg-neutral-900"
                      >
                        {preset.type === 'video' ? (
                          <video
                            src={preset.url}
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold p-1 text-center">
                          {preset.type === 'video' ? '🎬' : '📷'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Details Area */}
          <div className="w-full md:w-2/5 p-4 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-800/40">
            <div className="space-y-4">
              {/* Current User Row */}
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-bold">{currentUser?.username}</span>
              </div>

              {/* Caption Textarea */}
              <div>
                <textarea
                  rows={4}
                  placeholder="Write a caption... (e.g. #travel #sunset ✨)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-transparent border border-neutral-700/60 rounded-xl p-3 text-xs outline-none focus:border-pink-500 transition resize-none placeholder:text-neutral-500"
                />
                <div className="flex justify-between items-center text-[11px] text-neutral-500 mt-1 px-1">
                  <div className="flex gap-2">
                    {['#photography', '#aesthetic', '#reels'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCaption((prev) => prev + ' ' + t)}
                        className="hover:text-pink-400 transition"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <span>{caption.length}/2,200</span>
                </div>
              </div>

              {/* Filter Selection for Photos */}
              {mediaType === 'image' && mediaUrl && (
                <div>
                  <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Filter</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => setSelectedFilter(f.filter)}
                        className={`p-1 rounded-lg border text-center text-[10px] transition ${
                          selectedFilter === f.filter
                            ? 'border-pink-500 bg-pink-500/10 font-bold'
                            : 'border-neutral-800 hover:bg-neutral-800/40'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Tag */}
              <div className="flex items-center gap-2 border border-neutral-700/60 rounded-xl px-3 py-2 text-xs">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Add location (e.g. Bali, Dhaka, Tokyo)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs"
                />
              </div>

              {/* Audio Track Tag */}
              <div className="flex items-center gap-2 border border-neutral-700/60 rounded-xl px-3 py-2 text-xs">
                <Music className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Audio track (e.g. Surf Mesa • ily)"
                  value={audioTrack}
                  onChange={(e) => setAudioTrack(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs"
                />
              </div>
            </div>

            {/* Bottom Share Button */}
            <div className="pt-4 border-t border-neutral-800/40">
              <button
                onClick={handleSubmit}
                disabled={!mediaUrl || isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
              >
                {isSubmitting ? 'Publishing to Instagram...' : `Publish ${contentType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
