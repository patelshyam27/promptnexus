import React, { useState, useMemo } from 'react';
import { Search, Copy, Eye, Grid, X } from 'lucide-react';
import { Prompt, AIModel, User } from '../types';
import PromptDetailModal from './PromptDetailModal';

interface ExploreViewProps {
  prompts: Prompt[];
  currentUser: User;
  onRefresh: () => void;
}

const ExploreView: React.FC<ExploreViewProps> = ({ prompts, currentUser, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const query = searchQuery.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(query)) ||
        prompt.author.toLowerCase().includes(query)
      );
    });
  }, [prompts, searchQuery]);

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
    <div className="max-w-5xl mx-auto pb-20 pt-4">
      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative w-full max-w-md mx-auto md:mx-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search prompts by title, content, tags, or author..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {filteredPrompts.map((prompt) => (
            <div 
              key={prompt.id}
              onClick={() => setActivePrompt(prompt)}
              className="relative aspect-square bg-slate-900 cursor-pointer group overflow-hidden"
            >
               {/* Tile Content */}
               <div className="absolute inset-0 p-2 md:p-4 flex flex-col items-center justify-center text-center border border-slate-800/30 group-hover:border-slate-700 transition-colors bg-slate-900">
                  <span className={`text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1 md:mb-2 border ${getModelColor(prompt.model)} opacity-70`}>
                    {prompt.model}
                  </span>
                  <h3 className="text-[10px] md:text-sm lg:text-base font-semibold text-slate-200 line-clamp-3 px-1">
                    {prompt.title}
                  </h3>
               </div>

               {/* Hover Overlay (Desktop) */}
               <div className="absolute inset-0 bg-black/60 hidden md:group-hover:flex flex-col items-center justify-center gap-2 backdrop-blur-[2px] transition-all animate-in fade-in duration-200">
                  <div className="flex items-center text-white font-bold text-sm">
                     <Eye className="mr-2 w-4 h-4" fill="white" /> {formatNumber(prompt.viewCount)}
                  </div>
                  <div className="flex items-center text-white font-bold text-sm">
                     <Copy className="mr-2 w-4 h-4" fill="white" /> {formatNumber(prompt.copyCount)}
                  </div>
                  <div className="mt-2 text-xs text-slate-300 font-medium">
                    by {prompt.author}
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
           <Grid size={48} className="mb-4 opacity-50" />
           <p className="text-lg font-medium">No matching prompts found.</p>
           <button 
             onClick={() => setSearchQuery('')}
             className="mt-4 text-primary-400 hover:text-primary-300 text-sm font-semibold"
           >
             Clear Search
           </button>
        </div>
      )}

      <PromptDetailModal 
        prompt={activePrompt}
        user={currentUser}
        currentUser={currentUser}
        onClose={() => setActivePrompt(null)}
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default ExploreView;