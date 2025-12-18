import React, { useState, useEffect } from 'react';
import { User, Prompt } from '../types';
import { getPromptsApi, deletePromptApi } from '../services/apiService';
import { getUsersApi, deleteUserApi, updateUserApi, getFeedbackApi, markFeedbackReadApi, deleteFeedbackApi, getSettingApi, updateSettingApi } from '../services/apiService';
import { Trash2, Users, FileText, Search, LogOut, Shield, Settings, Save, AlertCircle, Database, Download } from 'lucide-react';
import PasswordChallengeModal from './PasswordChallengeModal';

interface AdminDashboardProps {
    currentUser: User;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'prompts' | 'feedback' | 'settings' | 'database'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [feedback, setFeedback] = useState<any[]>([]);

    // Settings State
    const [feedbackUrl, setFeedbackUrl] = useState('');
    const [savingSettings, setSavingSettings] = useState(false);

    // Ad Settings State
    const [adSettings, setAdSettings] = useState({
        adClient: '',
        adSlot: '',
        adStatus: 'test', // test, active, disabled
    });
    const [savingAdSettings, setSavingAdSettings] = useState(false);

    // Security Challenge State
    const [challengeOpen, setChallengeOpen] = useState(false);
    const [challengeAction, setChallengeAction] = useState('');
    const [challengeCallback, setChallengeCallback] = useState<(() => void) | null>(null);

    const refreshData = async () => {
        try {
            const usersData = await getUsersApi();
            setUsers(Array.isArray(usersData) ? usersData : []);

            const promptsData = await getPromptsApi();
            setPrompts(Array.isArray(promptsData) ? promptsData : []);

            const feedbackData = await getFeedbackApi();
            setFeedback(Array.isArray(feedbackData) ? feedbackData : []);

            // Fetch Settings
            const settingsData = await getSettingApi('feedbackUrl');
            if (settingsData && settingsData.success) {
                setFeedbackUrl(settingsData.value);
            }

            // Fetch Ad Settings
            const clientRes = await getSettingApi('adClient');
            const slotRes = await getSettingApi('adSlot');
            const statusRes = await getSettingApi('adStatus');

            setAdSettings({
                adClient: clientRes.success ? clientRes.value : '',
                adSlot: slotRes.success ? slotRes.value : '',
                adStatus: statusRes.success ? statusRes.value : 'test',
            });

        } catch (e) {
            console.error("Failed to load admin data", e);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const triggerChallenge = (actionName: string, onSuccess: () => void) => {
        setChallengeAction(actionName);
        setChallengeCallback(() => onSuccess);
        setChallengeOpen(true);
    };

    const handleChallengeSuccess = () => {
        if (challengeCallback) {
            challengeCallback();
            setChallengeCallback(null);
        }
    };

    const handleSaveSettings = () => {
        triggerChallenge('Save General Settings', async () => {
            setSavingSettings(true);
            try {
                const res = await updateSettingApi('feedbackUrl', feedbackUrl, currentUser.id);
                if (res.success) {
                    alert('Settings saved successfully');
                } else {
                    alert('Failed to save settings: ' + (res.message || 'Unknown error'));
                }
            } catch (e) {
                alert('Error saving settings');
            } finally {
                setSavingSettings(false);
            }
        });
    };

    const handleSaveAdSettings = () => {
        triggerChallenge('Update Ad Configuration', async () => {
            setSavingAdSettings(true);
            try {
                await updateSettingApi('adClient', adSettings.adClient, currentUser.id);
                await updateSettingApi('adSlot', adSettings.adSlot, currentUser.id);
                await updateSettingApi('adStatus', adSettings.adStatus, currentUser.id);
                alert('Ad settings updated successfully');
            } catch (e) {
                alert('Error saving ad settings');
            } finally {
                setSavingAdSettings(false);
            }
        });
    };

    const handleDeleteUser = (username: string) => {
        if (window.confirm(`Delete user ${username}?`)) {
            triggerChallenge(`Delete User ${username}`, async () => {
                await deleteUserApi(username);
                refreshData();
            });
        }
    };

    const handleDeletePrompt = (id: string) => {
        if (window.confirm('Delete this prompt?')) {
            triggerChallenge('Delete Prompt', async () => {
                await deletePromptApi(id);
                refreshData();
            });
        }
    };

    const handleDeleteFeedback = (id: string) => {
        if (window.confirm('Delete this feedback?')) {
            triggerChallenge('Delete Feedback', async () => {
                await deleteFeedbackApi(id);
                refreshData();
            });
        }
    };

    const handlePromote = (username: string) => {
        alert("Promote API not implemented yet");
    };

    const handleDemote = (username: string) => {
        alert("Demote API not implemented yet");
    };

    const handleEditUser = async (user: User) => {
        // Edit User Info doesn't strictly need password challange as it's less destructive, but good practice.
        // Skipping for now to avoid too much friction on minor edits, or can add if requested.
        const newDisplay = prompt('Edit display name', user.displayName);
        if (newDisplay === null) return;
        const newBio = prompt('Edit bio', user.bio || '');
        if (newBio === null) return;

        await updateUserApi({
            username: user.username,
            displayName: newDisplay,
            bio: newBio
        });
        refreshData();
    };

    const handleExport = (data: any[], filename: string) => {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(data, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPrompts = prompts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.author.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 overflow-x-hidden">
            <PasswordChallengeModal
                isOpen={challengeOpen}
                onClose={() => setChallengeOpen(false)}
                onSuccess={handleChallengeSuccess}
                username={currentUser.username}
                actionName={challengeAction}
            />

            <div className="max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/20 border border-red-500/50 rounded-lg shrink-0">
                            <Shield className="text-red-500" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-slate-400 text-sm">Welcome back, {currentUser.displayName}</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors w-full md:w-auto justify-center">
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-400 font-medium">Total Users</h3>
                            <Users className="text-blue-500" size={24} />
                        </div>
                        <p className="text-4xl font-bold text-white">{users.length}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-400 font-medium">Total Prompts</h3>
                            <FileText className="text-purple-500" size={24} />
                        </div>
                        <p className="text-4xl font-bold text-white">{prompts.length}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">System Status</div>
                            <div className="text-green-400 font-bold flex items-center gap-2 justify-center">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                Operational
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-4 border-b border-slate-800 mb-6 no-scrollbar">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors whitespace-nowrap relative ${activeTab === 'users' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Users Management
                        {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors whitespace-nowrap relative ${activeTab === 'prompts' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Prompt Management
                        {activeTab === 'prompts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors whitespace-nowrap relative ${activeTab === 'feedback' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Feedback
                        {activeTab === 'feedback' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors whitespace-nowrap relative ${activeTab === 'settings' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Settings
                        {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('database')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors whitespace-nowrap relative ${activeTab === 'database' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Database
                        {activeTab === 'database' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                    </button>
                </div>

                {/* Search */}
                {(activeTab === 'users' || activeTab === 'prompts') && (
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                        />
                    </div>
                )}

                {/* Content Area */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-w-0">
                    {activeTab === 'users' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredUsers.map(user => (
                                        <tr key={user.username} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={user.avatarUrl} onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = "https://via.placeholder.com/32"; }} className="w-8 h-8 rounded-full" />
                                                    <div>
                                                        <div className="font-bold text-white">{user.displayName}</div>
                                                        <div className="text-slate-500">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.isAdmin ? (
                                                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">Admin</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-bold border border-slate-700">User</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <button
                                                    onClick={() => { setSearchTerm(user.username); setActiveTab('prompts'); }}
                                                    className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                                                    title="View User Posts"
                                                >
                                                    Posts
                                                </button>

                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    Edit
                                                </button>

                                                {!user.isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.username)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTab === 'prompts' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Prompt</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Model</th>
                                        <th className="px-6 py-4">Stats</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredPrompts.map(prompt => (
                                        <tr key={prompt.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white max-w-xs truncate">{prompt.title}</div>
                                                <div className="text-xs text-slate-500">by @{prompt.author}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-300">{prompt.category}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-300">{prompt.model}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                <div>{prompt.viewCount} views</div>
                                                <div>{prompt.rating.toFixed(1)} ★</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeletePrompt(prompt.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete Prompt"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTab === 'feedback' ? (
                        <div className="p-4">
                            {feedback.length === 0 ? (
                                <div className="text-slate-400">No feedback yet.</div>
                            ) : (
                                <div className="space-y-4">
                                    {feedback.map(f => (
                                        <div key={f.id} className={`p-4 rounded-lg border ${f.read ? 'border-slate-700 bg-slate-900' : 'border-yellow-700 bg-yellow-900/5'}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="font-bold text-white">{f.from}</div>
                                                    <div className="text-xs text-slate-400">{new Date(f.createdAt).toLocaleString()}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={async () => { await markFeedbackReadApi(f.id, !f.read); refreshData(); }}
                                                        className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                                    >
                                                        {f.read ? 'Mark Unread' : 'Mark Read'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFeedback(f.id)}
                                                        className="text-xs px-2 py-1 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-slate-200 whitespace-pre-wrap">{f.message}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'settings' ? (
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white mb-6">System Configuration</h2>

                            <div className="space-y-8 max-w-2xl">
                                <div className="bg-black/30 p-6 rounded-xl border border-slate-800">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Settings size={20} className="text-slate-400" />
                                        General Settings
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Feedback Form URL</label>
                                            <div className="text-xs text-slate-500 mb-2">The Google Form link opened by the "Feedback" button in the More menu.</div>
                                            <input
                                                type="url"
                                                value={feedbackUrl}
                                                onChange={(e) => setFeedbackUrl(e.target.value)}
                                                placeholder="https://forms.google.com/..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleSaveSettings}
                                            disabled={savingSettings}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {savingSettings ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>

                                {/* AdSense Configuration */}
                                <div className="bg-black/30 p-6 rounded-xl border border-slate-800">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="bg-amber-500/10 p-1 rounded text-amber-500 font-bold text-xs border border-amber-500/20">ADS</div>
                                        AdSense Configuration
                                    </h3>

                                    <div className="space-y-4">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-2">Publisher ID (Client)</label>
                                                <input
                                                    type="text"
                                                    value={adSettings.adClient}
                                                    onChange={(e) => setAdSettings(p => ({ ...p, adClient: e.target.value }))}
                                                    placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-2">Ad Slot ID</label>
                                                <input
                                                    type="text"
                                                    value={adSettings.adSlot}
                                                    onChange={(e) => setAdSettings(p => ({ ...p, adSlot: e.target.value }))}
                                                    placeholder="1234567890"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Ad Status</label>
                                            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 w-fit">
                                                <button
                                                    onClick={() => setAdSettings(p => ({ ...p, adStatus: 'active' }))}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${adSettings.adStatus === 'active' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    Active
                                                </button>
                                                <button
                                                    onClick={() => setAdSettings(p => ({ ...p, adStatus: 'test' }))}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${adSettings.adStatus === 'test' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    Test Mode
                                                </button>
                                                <button
                                                    onClick={() => setAdSettings(p => ({ ...p, adStatus: 'disabled' }))}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${adSettings.adStatus === 'disabled' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    Disabled
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                Active: Live ads are shown. Test Mode: Shows placeholders (safe for dev). Disabled: Hides all ads.
                                            </p>
                                        </div>

                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleSaveAdSettings}
                                            disabled={savingAdSettings}
                                            className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {savingAdSettings ? 'Saving...' : <><Save size={18} /> Update Ads</>}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-red-900/10 p-6 rounded-xl border border-red-900/30">
                                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                                        <AlertCircle size={20} />
                                        Maintenance
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4">
                                        System-wide actions like clearing caches or resetting temporary data.
                                    </p>
                                    <button className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-sm transition-colors">
                                        Clear System Cache
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Database Tab
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Database className="text-amber-500" /> Database Management
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Users</h3>
                                            <p className="text-slate-400 text-sm">{users.length} records</p>
                                        </div>
                                        <div className="bg-blue-500/10 p-2 rounded-lg"><Users className="text-blue-500" /></div>
                                    </div>
                                    <button
                                        onClick={() => handleExport(users, 'users_export')}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} /> Export JSON
                                    </button>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Prompts</h3>
                                            <p className="text-slate-400 text-sm">{prompts.length} records</p>
                                        </div>
                                        <div className="bg-purple-500/10 p-2 rounded-lg"><FileText className="text-purple-500" /></div>
                                    </div>
                                    <button
                                        onClick={() => handleExport(prompts, 'prompts_export')}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} /> Export JSON
                                    </button>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Feedback</h3>
                                            <p className="text-slate-400 text-sm">{feedback.length} records</p>
                                        </div>
                                        <div className="bg-green-500/10 p-2 rounded-lg"><Users className="text-green-500" /></div>
                                    </div>
                                    <button
                                        onClick={() => handleExport(feedback, 'feedback_export')}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} /> Export JSON
                                    </button>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Full Backup</h3>
                                            <p className="text-slate-400 text-sm">Export all system data</p>
                                        </div>
                                        <div className="bg-amber-500/10 p-2 rounded-lg"><Database className="text-amber-500" /></div>
                                    </div>
                                    <button
                                        onClick={() => handleExport({ users, prompts, feedback, systemSettings: { feedbackUrl } }, 'full_backup')}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} /> Export Full Backup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
