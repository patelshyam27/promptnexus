import React, { useState, useEffect } from 'react';
import { User, Prompt } from '../types';
import { getPrompts, deleteUser, deletePrompt, FALLBACK_AVATAR, promoteUser, demoteUser, updateUser, getAllFeedback, markFeedbackRead, deleteFeedback } from '../services/storageService';
import { Trash2, Users, FileText, Search, LogOut, Shield } from 'lucide-react';

// Expose getAllUsers in storageService if not exported, or duplicate logic here?
// Ideally storageService should export it. I will import it, but first I need to export it in storageService.ts
// Wait, I didn't export `getAllUsers` in storageService.ts. Use a local helper or export it.

// Let's assume I'll export it or implementation details below.
// Actually, `getAllUsers` was not exported in the previous `view_file`. I should update storageService to export it.
// Checking storageService again... `getAllUsers` is internal.
// I will implement a `getUsers` wrapper in storageService or just read from local storage here?
// Better to follow pattern: export `getUsers` from storageService.

interface AdminDashboardProps {
    currentUser: User;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'prompts' | 'feedback'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // We need to fetch users. Since getAllUsers isn't exported, we need to fix that first.
    // But for now, let's write the component structure and I will fix storageService in next step.

    const refreshData = () => {
        // Temporary direct read or service call
        const usersStr = localStorage.getItem('promptnexus_users_v2');
        if (usersStr) setUsers(JSON.parse(usersStr));
        setPrompts(getPrompts());
        // load feedback
        try {
            setFeedback(getAllFeedback());
        } catch (e) {
            setFeedback([]);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const [feedback, setFeedback] = useState<any[]>([]);

    const handleDeleteUser = (username: string) => {
        if (window.confirm(`Delete user ${username}?`)) {
            deleteUser(username);
            refreshData();
        }
    };

    const handlePromote = (username: string) => {
        if (!confirm(`Promote ${username} to admin?`)) return;
        promoteUser(username);
        refreshData();
    };

    const handleDemote = (username: string) => {
        if (!confirm(`Demote ${username} from admin?`)) return;
        demoteUser(username);
        refreshData();
    };

    const handleEditUser = (user: User) => {
        const newDisplay = prompt('Edit display name', user.displayName);
        if (newDisplay === null) return; // cancelled
        const newBio = prompt('Edit bio', user.bio || '');
        if (newBio === null) return;
        const newGender = prompt('Gender (male/female)', (user.gender as string) || 'male');
        if (newGender === null) return;
        updateUser(user.username, { displayName: newDisplay, bio: newBio, gender: (newGender === 'female' ? 'female' : 'male') as any });
        refreshData();
    };

    const handleDeletePrompt = (id: string) => {
        if (window.confirm('Delete this prompt?')) {
            deletePrompt(id);
            refreshData();
        }
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPrompts = prompts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.author.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/20 border border-red-500/50 rounded-lg">
                            <Shield className="text-red-500" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-slate-400">Welcome back, {currentUser.displayName}</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
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
                        <div className="text-slate-400 text-sm">Admin utilities are limited in this demo.</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-800 mb-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${activeTab === 'users' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Users Management
                        {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${activeTab === 'prompts' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Prompt Management
                        {activeTab === 'prompts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${activeTab === 'feedback' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Feedback
                        {activeTab === 'feedback' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />}
                    </button>
                </div>

                {/* Search */}
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

                {/* Content Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {activeTab === 'users' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
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
                                                    <img src={user.avatarUrl} onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = FALLBACK_AVATAR; }} className="w-8 h-8 rounded-full" />
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

                                                {user.isAdmin ? (
                                                    <button onClick={() => handleDemote(user.username)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">Demote</button>
                                                ) : (
                                                    <button onClick={() => handlePromote(user.username)} className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg">Promote</button>
                                                )}

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
                            <table className="w-full text-left text-sm">
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
                                                    <button onClick={() => { markFeedbackRead(f.id, !f.read); refreshData(); }} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{f.read ? 'Mark Unread' : 'Mark Read'}</button>
                                                    <button onClick={() => { if (confirm('Delete this feedback?')) { deleteFeedback(f.id); refreshData(); } }} className="text-xs px-2 py-1 rounded bg-red-700 text-white">Delete</button>
                                                </div>
                                            </div>
                                            <div className="text-slate-200 whitespace-pre-wrap">{f.message}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
