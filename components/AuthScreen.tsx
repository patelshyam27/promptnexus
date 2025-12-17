import React, { useState } from 'react';
import { Zap, ArrowRight, UserPlus, LogIn, Loader2, User as UserIcon } from 'lucide-react';
import { registerUserApi, loginUserApi, FALLBACK_AVATAR } from '../services/apiService';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // Helper to generate preview URL live
  const getAvatarUrl = (seed: string, genderType: 'male' | 'female') => {
    const s = encodeURIComponent((seed || 'placeholder').trim());
    let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`;
    if (genderType === 'male') {
      url += `&top[]=shortHair&top[]=theCaesar&top[]=theCaesarSidePart&facialHairProbability=20&accessoriesProbability=0`;
    } else {
      url += `&top[]=longHair&top[]=bob&top[]=straight01&facialHairProbability=0&accessoriesProbability=20`;
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanUsername = username.trim();
    const cleanDisplayName = displayName.trim();

    try {
      if (isLogin) {
        // API Call
        const result = await loginUserApi({ username: cleanUsername, password });
        if (result.success && result.user) {
          onAuthSuccess(result.user);
        } else {
          setError(result.message || 'Login failed');
        }
      } else {
        if (!cleanUsername || !password || !cleanDisplayName) {
          setError("Please fill in all required fields");
          setIsLoading(false);
          return;
        }

        const avatarUrl = getAvatarUrl(cleanUsername, gender);

        const newUser = {
          username: cleanUsername,
          password,
          displayName: cleanDisplayName,
          bio: bio || 'I love exploring AI prompts!',
          gender,
          avatarUrl,
        };

        const result = await registerUserApi(newUser);
        if (result.success && result.user) {
          onAuthSuccess(result.user);
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'An error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
    setDisplayName('');
    setBio('');
    setGender('male');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col items-center mb-8 z-10">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-3 rounded-xl shadow-2xl shadow-primary-500/30 mb-4">
          <Zap size={40} className="text-white" fill="white" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">PromptNexus</h1>
        <p className="text-slate-400 mt-2">The community for AI pioneers</p>
      </div>

      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl z-10 transition-all duration-300">
        <div className="flex justify-center mb-6 bg-slate-950/50 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => !isLoading && isLogin === false && toggleMode()}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => !isLoading && isLogin === true && toggleMode()}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="flex flex-col items-center mb-6 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-primary-500 to-purple-600 mb-2 shadow-xl">
                <div className="w-full h-full rounded-full border-4 border-slate-950 overflow-hidden bg-slate-800">
                  <img
                    src={getAvatarUrl(username, gender)}
                    onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = FALLBACK_AVATAR; }}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Preview</span>
            </div>
          )}

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Display Name</label>
                <input
                  type="text"
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="e.g. Alex Carter"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-3">Gender Style</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all group ${gender === 'male'
                      ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-black/50 border-slate-700 hover:bg-slate-800'
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-600">
                      <img
                        src={getAvatarUrl(username, 'male')}
                        onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = FALLBACK_AVATAR; }}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        alt="Male Style"
                      />
                    </div>
                    <span className={`text-xs font-bold ${gender === 'male' ? 'text-blue-400' : 'text-slate-400'}`}>Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all group ${gender === 'female'
                      ? 'bg-pink-900/20 border-pink-500 ring-1 ring-pink-500/50'
                      : 'bg-black/50 border-slate-700 hover:bg-slate-800'
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-600">
                      <img
                        src={getAvatarUrl(username, 'female')}
                        onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = FALLBACK_AVATAR; }}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        alt="Female Style"
                      />
                    </div>
                    <span className={`text-xs font-bold ${gender === 'female' ? 'text-pink-400' : 'text-slate-400'}`}>Female</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Username</label>
            <input
              type="text"
              className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              placeholder="e.g. prompt_wizard"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Bio (Optional)</label>
              <input
                type="text"
                className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder="Short description about you"
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-slate-500 text-xs">
        © 2025 PromptNexus. Demo Application.
      </div>
    </div>
  );
};

export default AuthScreen;