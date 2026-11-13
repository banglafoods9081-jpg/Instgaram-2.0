import React, { useState } from 'react';
import { Search, Film, Heart, MessageCircle } from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { Post } from '../../types/instagram';

export const ExploreGrid: React.FC = () => {
  const { posts, setSelectedPostDetail, theme } = useInstagram();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const popularTags = React.useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      p.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [posts]);

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.caption.toLowerCase().includes(search.toLowerCase()) ||
      p.user.username.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesTag =
      selectedTag === 'all' ||
      p.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-2 sm:px-6">
      {/* Search Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
        <div
          className={`flex items-center gap-3 w-full max-w-xl px-4 py-2.5 rounded-2xl border text-sm shadow-sm ${
            theme === 'dark'
              ? 'bg-neutral-900 border-neutral-800 text-white'
              : 'bg-neutral-100 border-neutral-200 text-neutral-900'
          }`}
        >
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Search creators, hashtags, captions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-neutral-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full py-1">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
              selectedTag === 'all'
                ? 'bg-pink-500 text-white'
                : theme === 'dark'
                ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            All
          </button>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                selectedTag === tag
                  ? 'bg-pink-500 text-white'
                  : theme === 'dark'
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Posts */}
      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center text-neutral-400">
          <p className="text-sm">No explore posts matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {filteredPosts.map((post: Post, idx: number) => {
            // Every 7th item can be featured large (2 cols / 2 rows) on tablet+
            const isFeatured = idx % 8 === 2;

            return (
              <div
                key={post.id}
                onClick={() => setSelectedPostDetail(post)}
                className={`relative aspect-square cursor-pointer group overflow-hidden rounded-md sm:rounded-xl bg-neutral-900 ${
                  isFeatured ? 'col-span-2 row-span-2' : ''
                }`}
              >
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                )}

                {/* Video reel indicator */}
                {post.mediaType === 'video' && (
                  <div className="absolute top-2.5 right-2.5 z-10 p-1 rounded-md bg-black/60 text-white">
                    <Film className="w-4 h-4" />
                  </div>
                )}

                {/* Hover stats overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-6 text-white font-bold text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
