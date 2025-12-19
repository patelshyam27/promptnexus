import React, { useState, useMemo, useEffect } from 'react';
import { Grid, Users, Verified, Bookmark, Copy, Eye, TrendingUp, Award, Edit3, X, Save, User as UserIcon, Share2 } from 'lucide-react';
import { Prompt, User, AIModel, NewPromptInput } from '../types';
import { getUserApi, updateUserApi, updatePromptApi } from '../services/apiService';
import PromptDetailModal from './PromptDetailModal';
import AddPromptModal from './AddPromptModal';

export const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect fill='%2320282d' width='128' height='128'/><circle cx='64' cy='44' r='26' fill='%234a5568'/><rect x='24' y='80' width='80' height='28' rx='12' fill='%234a5568'/></svg>";

interface UserProfileProps {
  username: string;
  prompts: Prompt[];
  currentUser: User;
  onRefresh: () => void;
  onUserUpdate?: () => void;
}

type ProfileTab = 'posts' | 'tagged';

const UserProfile: React.FC<UserProfileProps> = ({ username, prompts, currentUser, onRefresh, onUserUpdate }) => {
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Edit Form State
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female'>('male');
  const [editInstagram, setEditInstagram] = useState('');
  const [editLinkdeal, setEditLinkdeal] = useState('');

  // Helper to generate avatar URL
  const generateAvatarUrl = (uName: string, gender: 'male' | 'female') => {
    const s = encodeURIComponent((uName || 'placeholder').trim());
    let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`;
    if (gender === 'male') {
      url += `&top[]=shortHair&top[]=theCaesar&top[]=theCaesarSidePart&facialHairProbability=20&accessoriesProbability=0`;
    } else {
      url += `&top[]=longHair&top[]=bob&top[]=straight01&facialHairProbability=0&accessoriesProbability=20`;
    }
    return url;
  };

  const isOwnProfile = username === currentUser.username;



  // Fetch user if not own profile
  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
    } else {
      getUserApi(username).then((data: any) => {
        // If array (from get all users? no getUserApi returns object), or error
        if (data && data.username) setProfileUser(data);
        // Handle 404 or fallback?
      }).catch(() => setProfileUser(null));
    }
  }, [username, currentUser, isOwnProfile]);

  // Use profileUser or fallback
  const user: User = profileUser || {
    username: username,
    displayName: username,
    bio: '',
    avatarUrl: generateAvatarUrl(username, 'male'),
    isVerified: false,
    gender: 'male',
    password: ''
  };

  const openEditModal = () => {
    setEditDisplayName(currentUser.displayName);
    setEditBio(currentUser.bio);
    setEditGender(currentUser.gender || 'male');
    setEditInstagram(currentUser.instagramUrl || '');
    setEditLinkdeal(currentUser.linkdealUrl || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    const newAvatarUrl = generateAvatarUrl(currentUser.username, editGender);

    await updateUserApi({
      username: currentUser.username,
      displayName: editDisplayName,
      bio: editBio,
      gender: editGender,
      instagramUrl: editInstagram || null,
      linkdealUrl: editLinkdeal || null,
      avatarUrl: newAvatarUrl
    });

    setIsEditModalOpen(false);
    if (onUserUpdate) onUserUpdate();
  };

  const handleUpdatePrompt = async (id: string, input: NewPromptInput) => {
    try {
      await updatePromptApi(id, input);
      setEditingPrompt(null);
      onRefresh();
    } catch (e) {
      console.error('Failed to update prompt', e);
    }
  };

  // Filter prompts authored by this user (for stats and default view)
  const userCreatedPrompts = useMemo(() =>
    prompts.filter(p => p.author === username).sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
    [prompts, username]);

  // Determine which prompts to show based on tab
  // Determine which prompts to show based on tab
  const displayPrompts = useMemo(() => {
    let filtered = userCreatedPrompts;
    if (selectedModel) {
      filtered = filtered.filter(p => p.model === selectedModel);
    }
    return filtered;
  }, [activeTab, userCreatedPrompts, selectedModel]);

  // --- Statistics Calculation (Based on created prompts) ---
  const totalViews = userCreatedPrompts.reduce((acc, curr) => acc + curr.viewCount, 0);
  const totalCopies = userCreatedPrompts.reduce((acc, curr) => acc + curr.copyCount, 0);
  const avgViews = userCreatedPrompts.length > 0 ? Math.round(totalViews / userCreatedPrompts.length) : 0;

  // Most Popular Category (by views)
  const topCategory = useMemo(() => {
    if (userCreatedPrompts.length === 0) return 'N/A';
    const stats: Record<string, number> = {};
    userCreatedPrompts.forEach(p => {
      stats[p.category] = (stats[p.category] || 0) + p.viewCount;
    });
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : 'N/A';
  }, [userCreatedPrompts]);

  // Model Usage Breakdown
  const modelUsage = useMemo(() => {
    const stats: Record<string, number> = {};
    userCreatedPrompts.forEach(p => {
      stats[p.model] = (stats[p.model] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [userCreatedPrompts]);

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
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

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-4">

      {/* Header Section */}
      <div className="px-4 md:px-10 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">

          {/* Avatar - Clickable for Owner */}
          <div
            className={`relative group shrink-0 ${isOwnProfile ? 'cursor-pointer' : ''}`}
            onClick={isOwnProfile ? openEditModal : undefined}
          >
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-2xl">
              <div className="w-full h-full rounded-full border-4 border-slate-950 overflow-hidden bg-slate-800 relative">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = FALLBACK_AVATAR; }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay for editing */}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Edit3 className="text-white drop-shadow-md" size={32} />
                  </div>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <div className="absolute bottom-1 right-1 bg-slate-800 rounded-full p-2 border border-slate-700 md:hidden shadow-lg">
                <Edit3 size={14} className="text-white" />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">

            <div className="flex flex-col md:flex-row items-center gap-4 mb-5">
              <h1 className="text-xl md:text-2xl font-light text-white flex items-center gap-2">
                {user.username}
                {user.isVerified && <Verified className="text-blue-500 ml-1" size={18} />}

                {/* Gender Icon Display */}
                {user.gender && (
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${user.gender === 'male' ? 'border-blue-500 text-blue-400 bg-blue-900/20' : 'border-pink-500 text-pink-400 bg-pink-900/20'
                    }`}>
                    <UserIcon size={12} />
                  </div>
                )}
              </h1>

              <div className="flex gap-2">
                {isOwnProfile && (
                  <button
                    onClick={openEditModal}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                )}
                {/* Share Profile Button */}
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?profile=${user.username}`;
                    if ((navigator as any).share) {
                      (navigator as any).share({ title: user.displayName || user.username, url: shareUrl }).catch(() => navigator.clipboard.writeText(shareUrl));
                    } else {
                      navigator.clipboard.writeText(shareUrl).then(() => alert('Profile link copied to clipboard'));
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  title="Share profile"
                >
                  <Share2 size={14} />
                  Share
                </button>
                {/* Admin button removed per request */}
              </div>
            </div>

            {/* Primary Stats */}
            <div className="flex items-center gap-8 md:gap-10 mb-4 text-base">
              <div><span className="font-bold text-white">{userCreatedPrompts.length}</span> posts</div>
              <div><span className="font-bold text-white">{formatNumber(totalViews)}</span> views</div>
              <div><span className="font-bold text-white">{formatNumber(totalCopies)}</span> copies</div>
            </div>

            {/* Bio */}
            <div className="space-y-1 text-sm md:text-base max-w-md mb-4">
              <div className="font-bold text-white">{user.displayName}</div>
              <p className="text-slate-300 whitespace-pre-wrap">{user.bio}</p>
            </div>

            {/* Social Links */}
            {(user.instagramUrl || user.linkdealUrl) && (
              <div className="flex items-center gap-3 mb-4">
                {user.instagramUrl && (
                  <a href={user.instagramUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gradient-to-r from-pink-500 to-yellow-400 text-white rounded-lg text-sm font-semibold">
                    Instagram
                  </a>
                )}
                {user.linkdealUrl && (
                  <a href={user.linkdealUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-slate-800 text-white rounded-lg text-sm font-semibold border border-slate-700">
                    LinkedIn
                  </a>
                )}
              </div>
            )}

            {/* Detailed Insights (Pill Badges) */}
            {userCreatedPrompts.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300">
                  <TrendingUp size={14} className="text-green-400" />
                  <span>Avg Views: <span className="font-bold text-white">{formatNumber(avgViews)}</span></span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300">
                  <Award size={14} className="text-yellow-400" />
                  <span>Top Category: <span className="font-bold text-white">{topCategory}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Highlights (Story Style) */}
      {modelUsage.length > 0 && (
        <div className="flex gap-6 overflow-x-auto px-4 md:px-10 mb-8 no-scrollbar pb-2">
          {modelUsage.map(([model, count]) => (
            <div
              key={model}
              onClick={() => setSelectedModel(selectedModel === model ? null : model)}
              className="flex flex-col items-center space-y-1 shrink-0 cursor-pointer group"
            >
              <div className={`w-16 h-16 rounded-full p-[2px] border transition-all duration-200 group-hover:scale-105 ${selectedModel === model ? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-105' : getModelColor(model)}`}>
                <div className={`w-full h-full rounded-full flex flex-col items-center justify-center border transition-colors ${selectedModel === model ? 'bg-slate-800 border-primary-500/50' : 'bg-slate-900 border-slate-800'}`}>
                  <span className={`text-xs font-bold ${selectedModel === model ? 'text-white' : 'text-slate-200'}`}>{count}</span>
                  <span className="text-[9px] text-slate-400 uppercase">Prompts</span>
                </div>
              </div>
              <span className={`text-[10px] md:text-xs max-w-[70px] text-center leading-tight truncate px-1 transition-colors ${selectedModel === model ? 'text-primary-400 font-semibold' : 'text-slate-300'}`}>{model}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-t border-slate-800 mb-1">
        <div className="flex justify-center gap-12">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-3 text-xs font-medium tracking-widest cursor-pointer -mt-[1px] border-t ${activeTab === 'posts' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <Grid size={12} />
            POSTS
          </button>




        </div>
      </div>

      {/* Instagram Grid */}
      {displayPrompts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4 px-0 md:px-0">
          {displayPrompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => setActivePrompt(prompt)}
              className="relative aspect-square bg-slate-900 cursor-pointer group overflow-hidden md:rounded-sm"
            >
              {/* Tile Content */}
              <div className="absolute inset-0 p-3 md:p-6 flex flex-col items-center justify-center text-center border border-slate-800/50 group-hover:border-slate-700 transition-colors bg-slate-900">
                <span className={`text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 border ${getModelColor(prompt.model)} opacity-70`}>
                  {prompt.model}
                </span>
                <h3 className="text-[10px] md:text-sm lg:text-base font-semibold text-slate-200 line-clamp-3">
                  {prompt.title}
                </h3>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col md:flex-row items-center justify-center gap-4 backdrop-blur-[2px] transition-all animate-in fade-in duration-200">
                <div className="flex items-center text-white font-bold">
                  <Eye className="mr-2 w-5 h-5" fill="white" /> {formatNumber(prompt.viewCount)}
                </div>
                <div className="flex items-center text-white font-bold">
                  <Copy className="mr-2 w-5 h-5" fill="white" /> {formatNumber(prompt.copyCount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center mb-4">
            <Grid size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">
            No Posts Yet
          </h3>
        </div>
      )}


      <PromptDetailModal
        prompt={activePrompt}
        user={currentUser}
        onClose={() => setActivePrompt(null)}
        onRefresh={onRefresh}
        currentUser={currentUser}
        onEdit={(p) => { setActivePrompt(null); setEditingPrompt(p); }}
      />

      {/* Edit Prompt Modal */}
      <AddPromptModal
        isOpen={!!editingPrompt}
        onClose={() => setEditingPrompt(null)}
        onAdd={() => { }} // Not used in edit mode
        onUpdate={handleUpdatePrompt}
        initialData={editingPrompt}
        currentUser={currentUser}
      />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Live Avatar Preview */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-primary-500 to-purple-600 mb-2">
                  <div className="w-full h-full rounded-full border-4 border-slate-950 overflow-hidden bg-slate-800">
                    <img
                      src={generateAvatarUrl(currentUser.username, editGender)}
                      onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = FALLBACK_AVATAR; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400">Preview</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-3">Gender & Avatar Style</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setEditGender('male')}
                    className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 transition-all group overflow-hidden ${editGender === 'male'
                      ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-700">
                      <img src={generateAvatarUrl(currentUser.username, 'male')} className="w-full h-full object-cover" />
                    </div>
                    <div className={`text-sm font-medium ${editGender === 'male' ? 'text-blue-400' : 'text-slate-400'}`}>Male</div>
                    {editGender === 'male' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </button>

                  <button
                    onClick={() => setEditGender('female')}
                    className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 transition-all group overflow-hidden ${editGender === 'female'
                      ? 'bg-pink-900/20 border-pink-500 ring-1 ring-pink-500/50'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-700">
                      <img src={generateAvatarUrl(currentUser.username, 'female')} className="w-full h-full object-cover" />
                    </div>
                    <div className={`text-sm font-medium ${editGender === 'female' ? 'text-pink-400' : 'text-slate-400'}`}>Female</div>
                    {editGender === 'female' && <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></div>}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Display Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Bio</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Instagram URL</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/yourhandle"
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={editLinkdeal}
                  onChange={(e) => setEditLinkdeal(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default UserProfile;