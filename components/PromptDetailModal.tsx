import React, { useState, useEffect } from 'react';
import { X, MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Copy, Check, Star, ExternalLink, Trash2 } from 'lucide-react';
import { Prompt, User, AIModel } from '../types';
import { incrementCopyCount, toggleFavorite, isPromptFavorite, getUserRating, ratePrompt, deletePrompt, incrementViewCount } from '../services/storageService';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  user: User; // The author of the prompt or relevant user context for display
  currentUser: User; // The logged in user
  onClose: () => void;
  onRefresh: () => void;
}

const PromptDetailModal: React.FC<PromptDetailModalProps> = ({ prompt, user, currentUser, onClose, onRefresh }) => {
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (prompt) {
      setIsFavorite(isPromptFavorite(currentUser.username, prompt.id));
      setUserRating(getUserRating(currentUser.username, prompt.id));
      // Track view
      incrementViewCount(prompt.id, currentUser.username);
    }
  }, [prompt, currentUser.username]);

  if (!prompt) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      incrementCopyCount(prompt.id, currentUser.username);
      setCopied(true);
      onRefresh();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleFavorite = () => {
    const newState = toggleFavorite(currentUser.username, prompt.id);
    setIsFavorite(newState);
    onRefresh();
  };

  const handleRate = (rating: number) => {
    setUserRating(rating);
    ratePrompt(currentUser.username, prompt.id, rating);
    onRefresh();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      deletePrompt(prompt.id);
      onRefresh();
      onClose();
    }
  };



  const getModelColor = (model: string) => {
    if (Object.values(AIModel).includes(model as AIModel)) {
      switch (model) {
        case AIModel.GEMINI_PRO:
        case AIModel.GEMINI_FLASH: return 'border-blue-500 text-blue-400';
        case AIModel.IMAGEN_3: return 'border-purple-500 text-purple-400';
        case AIModel.VEO: return 'border-pink-500 text-pink-400';
        default: return 'border-gray-500 text-gray-400';
      }
    }
    return 'border-gray-500 text-gray-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white/80 hover:text-white md:hidden z-[110]">
        <X size={32} />
      </button>

      <div
        className="w-full max-w-5xl bg-black border border-slate-800 rounded-sm overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side ("Image" area - shows prompt content) */}
        <div className="hidden md:flex w-[60%] bg-slate-900 items-center justify-center p-10 border-r border-slate-800 relative group overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-950 pointer-events-none" />
          <div className="relative z-10 w-full">
            <div className="mb-6 flex justify-center">
              {prompt.modelUrl ? (
                <a
                  href={prompt.modelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-bold px-3 py-1 rounded-full border bg-slate-950/50 hover:bg-slate-900 flex items-center gap-1.5 transition-colors ${getModelColor(prompt.model)}`}
                >
                  {prompt.model}
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border bg-slate-950/50 ${getModelColor(prompt.model)}`}>
                  {prompt.model}
                </span>
              )}
            </div>
            <code className="block w-full text-sm md:text-lg text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-transparent">
              {prompt.content}
            </code>
          </div>
        </div>

        {/* Right Side (Details/Comments) */}
        <div className="w-full md:w-[40%] bg-slate-950 flex flex-col h-full">

          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${prompt.author}`} className="w-full h-full rounded-full bg-slate-900" alt={prompt.author} />
              </div>
              <span className="font-bold text-sm text-white hover:text-slate-300 cursor-pointer">{prompt.author}</span>
            </div>
            <div className="flex items-center gap-2">
              {currentUser.username === prompt.author && (
                <button
                  onClick={handleDelete}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2"
                  title="Delete Prompt"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button onClick={onClose} className="text-white hover:text-slate-300">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {/* Post Caption */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${prompt.author}`} className="w-8 h-8 rounded-full bg-slate-800" alt={prompt.author} />
              </div>
              <div className="text-sm">
                <span className="font-bold text-white mr-2">{prompt.author}</span>
                <span className="text-slate-300">{prompt.description}</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {prompt.tags.map(t => (
                    <span key={t} className="text-blue-400/90 hover:underline cursor-pointer">#{t}</span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-2 uppercase">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Rating Section */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Rate this prompt</span>
                <span className="text-xs text-slate-400">{prompt.rating > 0 ? `${prompt.rating} / 5.0 (${prompt.ratingCount} votes)` : 'No ratings yet'}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      fill={(hoverRating || userRating) >= star ? "#fbbf24" : "none"}
                      className={(hoverRating || userRating) >= star ? "text-yellow-400" : "text-slate-600"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile visual content fallback */}
            <div className="md:hidden bg-slate-900 p-4 rounded-lg mb-6 border border-slate-800">
              <div className="flex justify-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getModelColor(prompt.model)}`}>
                  {prompt.model}
                </span>
              </div>
              <code className="text-xs text-slate-300 font-mono whitespace-pre-wrap block max-h-60 overflow-y-auto">
                {prompt.content}
              </code>
            </div>

            {/* Comments Mock */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400 font-bold border border-purple-500/30">S</div>
                <div className="text-sm">
                  <span className="font-bold text-white mr-2">system</span>
                  <span className="text-slate-300">Great structure. I used this with Veo and got amazing results.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 z-10">
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-4 text-white">
                <button
                  onClick={handleFavorite}
                  className={`transition-colors ${isFavorite ? 'text-red-500' : 'text-white hover:text-slate-400'}`}
                  title={isFavorite ? 'Unsave' : 'Save'}
                >
                  <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                </button>
                {/* Share button */}
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${prompt.id}`;
                    if (navigator.share) {
                      navigator.share({ title: prompt.title, text: prompt.description, url: shareUrl }).catch(() => navigator.clipboard.writeText(shareUrl));
                    } else {
                      navigator.clipboard.writeText(shareUrl).then(() => alert('Post link copied to clipboard'));
                    }
                  }}
                  className="text-slate-300 hover:text-white p-2 rounded-lg"
                  title="Share post"
                >
                  <ExternalLink size={20} />
                </button>
              </div>
              <button
                onClick={handleFavorite}
                className={`text-white hover:text-slate-400 transition-colors ${isFavorite ? 'text-red-500' : ''}`}
                title={isFavorite ? 'Unsave' : 'Save'}
              >
                <Bookmark size={24} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="flex gap-4 text-sm font-bold text-white mb-3">
              <span>{formatNumber(prompt.viewCount)} views</span>
              <span>{formatNumber(prompt.copyCount)} copies</span>
              <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" fill="currentColor" /> {prompt.rating > 0 ? prompt.rating : '-'}</span>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${copied
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
            >
              {copied ? (
                <><Check size={18} /> Copied to Clipboard</>
              ) : (
                <><Copy size={18} /> Copy Prompt</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptDetailModal;