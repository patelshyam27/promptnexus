import React, { useState, useEffect } from 'react';
import { Copy, Eye, Tag, Check, Star, ExternalLink, Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, Zap, Bookmark, Image as ImageIcon, Verified } from 'lucide-react';
import { Prompt, AIModel, User } from '../types';
import { copyPromptApi, deletePromptApi } from '../services/apiService';
import { contentToProxiedImageUrl } from '../utils/imageUtils';

interface PromptCardProps {
  prompt: Prompt;
  currentUser: User;
  onRefresh: () => void;
  onAuthorClick?: (author: string) => void;
  onClick?: () => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, currentUser, onRefresh, onAuthorClick, onClick }) => {
  const [copied, setCopied] = useState(false);
  const isAuthor = currentUser.username === prompt.authorId || currentUser.username === prompt.author?.username; // Handle relation

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      await copyPromptApi(prompt.id);
      setCopied(true);
      onRefresh(); // Refresh stats in parent
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };



  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      await deletePromptApi(prompt.id);
      onRefresh();
    }
  };

  const getModelColor = (model: string) => {
    if (Object.values(AIModel).includes(model as AIModel)) {
      switch (model) {
        case AIModel.GEMINI_PRO:
        case AIModel.GEMINI_FLASH:
        case AIModel.GEMINI_1_5_PRO:
          return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
        case AIModel.IMAGEN_3:
          return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
        case AIModel.VEO:
          return 'bg-pink-500/10 text-pink-300 border-pink-500/20';
        default:
          return 'bg-slate-700/50 text-slate-300 border-slate-700';
      }
    }
    return 'bg-slate-700/50 text-slate-300 border-slate-700';
  };

  return (
    <div
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 group flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-primary-900/10 cursor-pointer"
    >

      {/* HEADER: Model Badge & Rating */}
      <div className="px-5 pt-5 pb-3 flex justify-between items-start">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getModelColor(prompt.model)} flex items-center gap-1`}>
          {prompt.model}
          {prompt.modelUrl && <ExternalLink size={10} className="ml-1 opacity-70" />}
        </span>

        {prompt.rating > 0 && (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg text-xs font-bold">
            <Star size={12} fill="currentColor" />
            <span>{prompt.rating.toFixed(1)}</span>
            {/* Attached Image Preview */}
            {prompt.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden border border-slate-800 max-h-48 relative group">
                <img
                  src={contentToProxiedImageUrl(prompt.imageUrl)}
                  alt="Prompt Result"
                  className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    // Hide if broken
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />

              </div>
            )}
          </div>
        )}

        {isAuthor && (
          <div className="flex ml-2 gap-1">

            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete Prompt"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* CONTENT: Title & Desc */}
      <div className="px-5 mb-4">
        <h3 className="text-xl font-bold text-slate-100 mb-2 leading-tight group-hover:text-primary-400 transition-colors">
          {prompt.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
          {prompt.description}
        </p>
      </div>

      {/* PROMPT PREVIEW (The "Code" Block) */}
      <div className="px-5 flex-1">
        <div className="relative bg-black/30 rounded-lg border border-slate-800 p-4 font-mono text-sm text-slate-300 leading-relaxed overflow-hidden hover:border-slate-700 transition-colors">
          <div className="line-clamp-4 opacity-90">
            {prompt.content}
          </div>
          {/* Fade effect at bottom of code block */}
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none"></div>

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const shareUrl = `${window.location.origin}${window.location.pathname}?post=${prompt.id}`;
              if (navigator.share) {
                try { navigator.share({ title: prompt.title, text: prompt.description, url: shareUrl }); }
                catch (err) { navigator.clipboard.writeText(shareUrl); }
              } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  // small visual feedback could be added
                  alert('Post link copied to clipboard');
                });
              }
            }}
            className="ml-2 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/30 transition-colors"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* TAGS */}
      <div className="px-5 mt-4 flex flex-wrap gap-2">
        {prompt.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-900/80 px-2 py-1 rounded-md">
            #{tag}
          </span>
        ))}
      </div>

      {/* FOOTER: Actions & Author */}
      <div className="mt-4 p-4 border-t border-slate-800/60 bg-slate-900/30 flex items-center justify-between">

        {/* Author */}
        <button
          onClick={(e) => { e.stopPropagation(); onAuthorClick?.(prompt.author); }}
          className="flex items-center gap-2 group/author cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 p-0.5 ring-1 ring-slate-700 group-hover/author:ring-primary-500 transition-all">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${prompt.author}`}
              className="w-full h-full rounded-full bg-slate-900"
              alt={prompt.author}
            />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-slate-300 group-hover/author:text-white flex items-center gap-1">
              {prompt.author}
              {prompt.authorDetails?.isVerified && <Verified size={12} className="text-blue-500 fill-blue-500/20" />}
            </span>
            <span className="text-[10px] text-slate-500">Author</span>
          </div>
        </button>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2">

          {/* Views (Tooltip-ish effect handled by browser title) */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 hover:text-slate-300 transition-colors" title={`${prompt.viewCount} Views`}>
            <Eye size={16} />
            <span className="text-xs font-medium">{prompt.viewCount}</span>
          </div>



          {/* Copy Button (Primary Action) */}
          <button
            onClick={handleCopy}
            className={`ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all transform active:scale-95 ${copied
              ? 'bg-green-600 text-white shadow-green-900/20'
              : 'bg-white text-black hover:bg-slate-200 shadow-white/10'
              }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PromptCard;