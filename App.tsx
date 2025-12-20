import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, PlusSquare, Filter, Zap, Grid, Home, UserCircle, Menu, LogOut
} from 'lucide-react';
import { Prompt, PromptCategory, AIModel, FilterState, NewPromptInput, User } from './types';
import { getPromptsApi, createPromptApi } from './services/apiService';
import { getCurrentUser, logoutUser } from './services/storageService'; // Helper for local session
import PromptCard from './components/PromptCard';
import AddPromptModal from './components/AddPromptModal';
import GoogleAd from './components/GoogleAd';
import MoreMenu from './components/MoreMenu';
// StatsChart and AdBanner imports removed as they are no longer used
import UserProfile from './components/UserProfile';
import ExploreView from './components/ExploreView';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import PromptDetailModal from './components/PromptDetailModal';


type ViewState = 'home' | 'explore' | 'profile' | 'create' | 'admin';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<ViewState>('home');
  const [selectedProfileUser, setSelectedProfileUser] = useState<string>('');

  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    model: 'All',
    search: '',
  });

  const [adConfig, setAdConfig] = useState<{ client?: string, slot?: string, status?: string } | null>(null);

  // On initial load, check for shared links and refresh user session
  useEffect(() => {
    // Load System Settings (Ads)
    import('./services/apiService').then(({ getAllSettingsApi }) => {
      getAllSettingsApi().then(res => {
        if (res && res.success && res.settings) {
          setAdConfig({
            client: res.settings.adClient,
            slot: res.settings.adSlot,
            status: res.settings.adStatus
          });
        }
      });
    });

    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setSelectedProfileUser(user.username);
      refreshPrompts();

      // Refresh user data from API to ensure we have the latest fields (like id)
      import('./services/apiService').then(({ getUserApi }) => {
        getUserApi(user.username).then((remoteUser: User | null) => {
          if (remoteUser) {
            setCurrentUser(remoteUser);
            // Update local storage invisibly
            try {
              localStorage.setItem('promptnexus_session_v2', JSON.stringify(remoteUser));
            } catch (e) {
              // ignore
            }
          }
        });
      });
    }
  }, []); // Run ONCE on mount

  // On initial load, check for shared links in URL params (profile/post)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profile = params.get('profile');
    const post = params.get('post');

    if (profile) {
      setSelectedProfileUser(profile);
      setActiveTab('profile');
    }

    if (post) {
      // For shared links, we need to ensure prompts are loaded first or fetch specific
      getPromptsApi().then(all => {
        const p = all.find((x: Prompt) => x.id === post);
        if (p) {
          setActivePrompt(p);
        }
      });
    }
  }, []);

  const refreshPrompts = async () => {
    try {
      const data = await getPromptsApi();
      if (Array.isArray(data)) {
        setPrompts(data);
      } else {
        console.error("Invalid prompts data received:", data);
        setPrompts([]);
      }
    } catch (e) {
      console.error("Failed to load prompts", e);
    }
  };

  const refreshUser = () => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false); // Close modal on success
    // Persist session locally (safely)
    try {
      localStorage.setItem('promptnexus_session_v2', JSON.stringify(user));
    } catch (e) {
      console.warn("Failed to save session to localStorage", e);
    }

    // If user was trying to create, open create modal now?
    // For now simple flow: just login. User can click create again.

    if (user.isAdmin) {
      setActiveTab('admin');
    } else {
      // If we are on home, refresh prompts to potentially see personalized stuff?
      // If we were on landing, stay on home.
      refreshPrompts();
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveTab('home'); // Go to home on logout
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCreateClick = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleAddPrompt = async (input: NewPromptInput) => {
    if (!currentUser) return;
    try {
      const res = await createPromptApi({ ...input, authorId: currentUser.id }); // API expects authorId (UUID)
      if (res && res.success) {
        refreshPrompts();
        setActiveTab('home'); // Go home after post
      } else {
        alert("Failed to create prompt: " + (res?.message || "Unknown server error"));
      }
    } catch (e) {
      alert("Failed to create prompt: Network error");
    }
  };



  const navigateToProfile = (username: string) => {
    setSelectedProfileUser(username);
    setActiveTab('profile');
    window.scrollTo(0, 0);
  };

  // Main filter logic for the "Home Feed"
  const homeFeedPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const matchesCategory = filters.category === 'All' || prompt.category === filters.category;
      const matchesModel = filters.model === 'All' || prompt.model === filters.model;
      return matchesCategory && matchesModel;
    }).sort((a, b) => b.createdAt - a.createdAt); // Newest first for feed
  }, [prompts, filters]);

  // Navigation Items
  const NavItem = ({ tab, icon: Icon, label, onClick }: { tab: ViewState, icon: any, label: string, onClick?: () => void }) => {
    const isActive = activeTab === tab && (!onClick || tab !== 'create');

    return (
      <button
        onClick={() => {
          if (onClick) onClick();
          else setActiveTab(tab);
        }}
        className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group w-full md:w-auto md:justify-start justify-center ${isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
      >
        <Icon
          size={26}
          className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
          strokeWidth={isActive ? 2.8 : 2}
        />
        <span className="hidden md:block text-base">{label}</span>
      </button>
    );
  };

  // Removed early return for !currentUser

  return (
    <div className="flex h-screen bg-black text-slate-50 font-sans overflow-hidden">

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-64 lg:w-72 flex-col border-r border-slate-800/60 bg-black h-full p-6 shrink-0 z-50">
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-1.5 rounded-lg shadow-lg shadow-primary-500/20">
            <Zap size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden lg:block">PromptNexus</span>
        </div>

        <div className="space-y-2 flex-1">
          <NavItem tab="home" icon={Home} label="Home" />
          <NavItem tab="explore" icon={Search} label="Explore" />
          <NavItem tab="create" icon={PlusSquare} label="Create" onClick={handleCreateClick} />

          <div onClick={() => currentUser ? navigateToProfile(currentUser.username) : setIsAuthModalOpen(true)}>
            <NavItem tab="profile" icon={UserCircle} label="Profile" />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group w-full ${isMoreMenuOpen ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
            >
              <Menu size={26} className={`transition-transform duration-200 ${isMoreMenuOpen ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={2} />
              <span className="hidden md:block text-base font-normal">More</span>
            </button>
            <MoreMenu
              isOpen={isMoreMenuOpen}
              onClose={() => setIsMoreMenuOpen(false)}
              onLogout={handleLogout}
              onLogin={() => setIsAuthModalOpen(true)}
              currentUser={currentUser}
            />
          </div>

          {currentUser?.isAdmin && (
            <div>
              <NavItem tab="admin" icon={Zap} label="Admin" onClick={() => setActiveTab('admin')} />
            </div>
          )}
        </div>

        {/* Bottom Logout removed, moved to More Menu */}
        <div className="mt-auto hidden">
          {/* Space holder if needed */}
        </div>
      </nav>

      {/* Admin Dashboard takes over full screen mostly, but we can keep it inside structure or separate */}
      {activeTab === 'admin' && currentUser?.isAdmin ? (
        <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <>
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto h-full custom-scrollbar relative scroll-smooth">

            {/* Top Bar (Mobile Only) */}
            <div className="md:hidden sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 h-16">
              <div className="flex items-center gap-2" onClick={() => setActiveTab('home')}>
                <Zap size={20} className="text-primary-500" fill="currentColor" />
                <span className="font-bold text-lg">PromptNexus</span>
              </div>
              <div onClick={() => currentUser ? navigateToProfile(currentUser.username) : setIsAuthModalOpen(true)}>
                <div className={`w-9 h-9 rounded-full p-[1px] ${activeTab === 'profile' ? 'bg-primary-500' : 'bg-slate-700'}`}>
                  <img
                    src={currentUser ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}` : "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
                    className="w-full h-full rounded-full bg-black object-cover"
                    alt={currentUser?.username || "Guest"}
                  />
                </div>
              </div>
            </div>

            {/* Mobile More Menu Instance - Positioned for bottom right access */}
            <div className="md:hidden">
              <MoreMenu
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                onLogout={handleLogout}
                onLogin={() => setIsAuthModalOpen(true)}
                currentUser={currentUser}
                className="fixed right-2 bottom-20 shadow-xl border border-slate-800/50 z-50"
              />
            </div>

            <div className="max-w-screen-lg mx-auto min-h-screen">

              {/* ----- HOME VIEW ----- */}
              {activeTab === 'home' && (
                <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto md:max-w-3xl xl:max-w-4xl">

                  {/* Removed StatsChart and AdBanner per request */}

                  {/* Feed Filters */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar mb-4">
                    <div className="flex items-center text-slate-500 text-xs font-bold uppercase tracking-wider mr-2">
                      <Filter size={12} className="mr-1" /> Feed
                    </div>
                    <select
                      className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-full px-4 py-2 focus:border-primary-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                      value={filters.model}
                      onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value as any }))}
                    >
                      <option value="All">All Models</option>
                      {Object.values(AIModel).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select
                      className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-full px-4 py-2 focus:border-primary-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                    >
                      <option value="All">All Categories</option>
                      {Object.values(PromptCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Feed List */}
                  <div className="space-y-6 pb-24 md:pb-0">
                    {homeFeedPrompts.length > 0 ? (
                      homeFeedPrompts.map((prompt, index) => (
                        <React.Fragment key={prompt.id}>
                          <PromptCard
                            prompt={prompt}
                            currentUser={currentUser}
                            onRefresh={refreshPrompts}
                            onAuthorClick={navigateToProfile}
                            onClick={() => setActivePrompt(prompt)}
                          />
                          {/* Insert Ad after every 5th post */}
                          {(index + 1) % 5 === 0 && (
                            <GoogleAd config={adConfig} />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <p>No prompts yet. Be the first to create one!</p>
                        <button
                          onClick={handleCreateClick}
                          className="mt-4 text-primary-400 hover:text-primary-300 font-semibold"
                        >
                          Create a Prompt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----- EXPLORE VIEW ----- */}
              {activeTab === 'explore' && (
                <ExploreView
                  prompts={prompts}
                  currentUser={currentUser}
                  onRefresh={refreshPrompts}
                />
              )}

              {/* ----- PROFILE VIEW ----- */}
              {activeTab === 'profile' && (
                <UserProfile
                  username={selectedProfileUser}
                  prompts={prompts}
                  currentUser={currentUser}
                  onRefresh={refreshPrompts}
                  onUserUpdate={refreshUser}
                />
              )}

            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black border-t border-slate-800 h-16 z-50 flex items-center justify-around px-2">
            <NavItem tab="home" icon={Home} label="" />
            <NavItem tab="explore" icon={Search} label="" />
            <NavItem tab="create" icon={PlusSquare} label="" onClick={handleCreateClick} />
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group justify-center ${isMoreMenuOpen ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Menu size={26} className={`transition-transform duration-200 ${isMoreMenuOpen ? 'scale-110' : 'group-hover:scale-110'}`} />
            </button>
          </nav>

          {currentUser && (
            <AddPromptModal
              isOpen={isModalOpen}
              onClose={() => { setIsModalOpen(false); }}
              onAdd={handleAddPrompt}
              currentUser={currentUser}
            />
          )}

          {/* Auth Modal */}
          {isAuthModalOpen && (
            <AuthScreen
              onAuthSuccess={handleAuthSuccess}
              isModal={true}
              onClose={() => setIsAuthModalOpen(false)}
            />
          )}

          <PromptDetailModal
            prompt={activePrompt}
            user={activePrompt?.authorDetails || ({} as User)} // Safe fallback if not needed for logic, mostly display
            currentUser={currentUser}
            onClose={() => setActivePrompt(null)}
            onRefresh={refreshPrompts}
          />

        </>
      )}

    </div>
  );
}

export default App;