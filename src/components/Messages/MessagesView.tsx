import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Edit,
  Send,
  Image as ImageIcon,
  Heart,
  Mic,
  Phone,
  Video,
  Info,
  Smile,
  Check,
  CheckCheck,
  Play,
  Pause,
  ArrowLeft
} from 'lucide-react';
import { useInstagram } from '../../context/InstagramContext';
import { Message, User } from '../../types/instagram';
import { compressImageToDataUrl } from '../../utils/mediaUtils';

export const MessagesView: React.FC = () => {
  const {
    currentUser,
    users,
    conversations,
    currentChatUserId,
    chatMessages,
    isChatUserTyping,
    openChatWithUser,
    closeChat,
    sendMessage,
    sendTyping,
    openProfile,
    theme
  } = useInstagram();

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeParticipant: User | undefined = users.find((u) => u.id === currentChatUserId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatUserTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleSendHeart = () => {
    sendMessage(undefined, undefined, 'heart');
  };

  const handleSendVoiceNote = () => {
    sendMessage('Voice message (0:14)', undefined, 'voice');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 720, 0.72);
      await sendMessage(undefined, compressed, 'image');
    } catch (err) {
      console.error('Image send error:', err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-[calc(100vh-60px)] md:h-screen flex max-w-6xl mx-auto overflow-hidden">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`w-full md:w-[350px] lg:w-[380px] shrink-0 border-r flex flex-col ${
          currentChatUserId ? 'hidden md:flex' : 'flex'
        } ${theme === 'dark' ? 'bg-black border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'}`}
      >
        {/* User Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{currentUser?.username}</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Online
            </span>
          </div>

          <button
            onClick={() => setIsNewMessageModalOpen(true)}
            className="p-1.5 hover:bg-neutral-800/20 rounded-full transition"
            title="New message"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2.5">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              theme === 'dark'
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700'
            }`}
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Search direct messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/30">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No messages found. Start a conversation with a friend!
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.participant.id === currentChatUserId;

              return (
                <div
                  key={conv.participant.id}
                  onClick={() => openChatWithUser(conv.participant.id)}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer transition ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-neutral-900'
                        : 'bg-neutral-100'
                      : 'hover:bg-neutral-800/20'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.participant.avatar}
                      alt={conv.participant.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">
                        {conv.participant.username}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-400 truncate mt-0.5">
                      <span className={`truncate ${conv.unreadCount > 0 ? 'font-bold text-white' : ''}`}>
                        {conv.lastMessage.text || (conv.lastMessage.mediaType === 'image' ? '📷 Photo' : '❤️ Sticker')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Window or Empty State */}
      <div
        className={`flex-1 flex flex-col h-full ${
          !currentChatUserId ? 'hidden md:flex' : 'flex'
        } ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-neutral-900'}`}
      >
        {activeParticipant ? (
          <>
            {/* Active Chat Header */}
            <div
              className={`p-3.5 border-b flex items-center justify-between ${
                theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={closeChat}
                  className="md:hidden p-1 hover:opacity-75"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div
                  onClick={() => openProfile(activeParticipant.id)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="relative">
                    <img
                      src={activeParticipant.avatar}
                      alt={activeParticipant.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold group-hover:underline">
                      {activeParticipant.name}
                    </h3>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      Active now
                    </p>
                  </div>
                </div>
              </div>

              {/* Call / Info Actions */}
              <div className="flex items-center gap-3 text-neutral-400">
                <button className="p-2 hover:text-white transition hover:bg-neutral-800/30 rounded-full" title="Start Audio Call">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:text-white transition hover:bg-neutral-800/30 rounded-full" title="Start Video Call">
                  <Video className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openProfile(activeParticipant.id)}
                  className="p-2 hover:text-white transition hover:bg-neutral-800/30 rounded-full"
                  title="Profile Info"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Profile Card Header in Chat */}
              <div className="flex flex-col items-center justify-center py-6 text-center border-b border-neutral-800/40 mb-4">
                <img
                  src={activeParticipant.avatar}
                  alt={activeParticipant.username}
                  className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-pink-500"
                />
                <h4 className="font-bold text-base">{activeParticipant.name}</h4>
                <p className="text-xs text-neutral-400">@{activeParticipant.username} • Instagram</p>
                <p className="text-xs text-neutral-400 max-w-sm mt-1">{activeParticipant.bio}</p>
                <button
                  onClick={() => openProfile(activeParticipant.id)}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition"
                >
                  View Profile
                </button>
              </div>

              {chatMessages.map((msg: Message) => {
                const isMe = msg.senderId === currentUser?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={activeParticipant.avatar}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                      />
                    )}

                    <div className="max-w-[70%] space-y-1">
                      {/* Heart sticker message */}
                      {msg.mediaType === 'heart' ? (
                        <div className="p-1 animate-bounce">
                          <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-md" />
                        </div>
                      ) : msg.mediaType === 'image' && msg.mediaUrl ? (
                        <div className="rounded-2xl overflow-hidden border border-neutral-800 shadow-md">
                          <img
                            src={msg.mediaUrl}
                            alt="Attachment"
                            className="max-h-72 object-cover rounded-2xl cursor-pointer hover:opacity-95 transition"
                          />
                        </div>
                      ) : msg.mediaType === 'voice' ? (
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
                            isMe ? 'bg-pink-600 text-white' : 'bg-neutral-800 text-white'
                          }`}
                        >
                          <button
                            onClick={() =>
                              setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)
                            }
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1 flex items-center gap-1 h-5">
                            {[12, 20, 8, 16, 24, 18, 10, 22, 14, 6].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full ${
                                  playingVoiceId === msg.id ? 'bg-white animate-pulse' : 'bg-white/60'
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-mono opacity-80">0:14</span>
                        </div>
                      ) : (
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-sm'
                              : 'bg-neutral-800 text-white rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}

                      {/* Delivery checkmark */}
                      {isMe && (
                        <div className="flex items-center justify-end gap-1 text-[10px] text-neutral-500 pr-1">
                          {msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{msg.isRead ? 'Seen' : 'Delivered'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator bubble */}
              {isChatUserTyping && (
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <img
                    src={activeParticipant.avatar}
                    alt="Typing"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="bg-neutral-800 px-3 py-2 rounded-2xl flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce delay-300" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div
              className={`p-3 border-t ${
                theme === 'dark' ? 'border-neutral-800 bg-black' : 'border-neutral-200 bg-white'
              }`}
            >
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 border border-neutral-700/60 rounded-full px-3 py-1.5 focus-within:border-neutral-500 transition"
              >
                {/* Emoji Shortcut */}
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + ' 😊 ')}
                  className="p-1 hover:text-pink-400 transition text-neutral-400"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder="Message..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-neutral-500 py-1"
                />

                {/* File Upload (Photos) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="text-pink-500 font-bold hover:text-pink-400 transition text-sm px-2"
                  >
                    Send
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 hover:text-white transition"
                      title="Send image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendVoiceNote}
                      className="p-1 hover:text-white transition"
                      title="Send voice note"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendHeart}
                      className="p-1 hover:text-rose-500 transition"
                      title="Send Heart"
                    >
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </button>
                  </div>
                )}
              </form>
            </div>
          </>
        ) : (
          /* Empty Chat State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="w-24 h-24 rounded-full border-2 border-neutral-700 flex items-center justify-center mb-4">
              <Send className="w-12 h-12 text-neutral-400 stroke-1 ml-1" />
            </div>
            <h3 className="text-xl font-bold mb-1">Your Messages</h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-5">
              Send private photos and messages to a friend or group. Real-time chat sync is active!
            </p>
            <button
              onClick={() => setIsNewMessageModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-md transition"
            >
              Send Message
            </button>
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      {isNewMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="font-bold text-base">New message</h3>
              <button
                onClick={() => setIsNewMessageModalOpen(false)}
                className="text-xs font-semibold hover:opacity-75"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3">Select a friend to message:</p>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {users
                .filter((u) => u.id !== currentUser?.id)
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      openChatWithUser(u.id);
                      setIsNewMessageModalOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800/40 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold">{u.username}</p>
                        <p className="text-xs text-neutral-400">{u.name}</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-pink-500">Chat</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
