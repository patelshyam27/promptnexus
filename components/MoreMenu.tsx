import React, { useState } from 'react';
import { Settings, Info, MessageSquare, LogOut, X, Moon, Sun, Check, MessageCircle } from 'lucide-react';
import { User } from '../types';

interface MoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    currentUser: User | null;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ isOpen, onClose, onLogout, currentUser }) => {
    const [activeModal, setActiveModal] = useState<'settings' | 'about' | null>(null);
    const [themeColor, setThemeColor] = useState('teal'); // Default, actual implementation would need context

    if (!isOpen && !activeModal) return null;

    const handleFeedback = async () => {
        // Fetch dynamic URL or use fallback
        try {
            const { getSettingApi } = await import('../services/apiService');
            const res = await getSettingApi('feedbackUrl');
            const url = (res && res.success && res.value) ? res.value : 'https://forms.google.com/placeholder';
            window.open(url, '_blank');
        } catch (e) {
            window.open('https://forms.google.com/placeholder', '_blank');
        }
        onClose();
    };

    // Sub-Modals
    if (activeModal === 'settings') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Settings size={20} /> Settings
                        </h2>
                        <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-3">Theme Options</label>
                            <div className="grid grid-cols-4 gap-3">
                                {['teal', 'blue', 'purple', 'orange'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setThemeColor(color)}
                                        className={`h-10 rounded-lg border flex items-center justify-center transition-all ${themeColor === color
                                            ? `border-${color}-500 bg-${color}-500/20 text-${color}-400`
                                            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        {themeColor === color && <Check size={16} />}
                                        {color === 'teal' && themeColor !== 'teal' && <div className="w-3 h-3 rounded-full bg-teal-500" />}
                                        {color === 'blue' && themeColor !== 'blue' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                                        {color === 'purple' && themeColor !== 'purple' && <div className="w-3 h-3 rounded-full bg-purple-500" />}
                                        {color === 'orange' && themeColor !== 'orange' && <div className="w-3 h-3 rounded-full bg-orange-500" />}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Custom accent colors coming soon.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeModal === 'about') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-teal-400 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <span className="text-2xl font-bold text-white">P</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">PromptNexus</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        The ultimate library for AI prompts. Discover, share, and organize your favorite prompts for Gemini, GPT-4, and more.
                    </p>
                    <div className="text-xs text-slate-500 mb-6">
                        Version 1.0.0
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // Dropdown Menu
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute left-4 bottom-20 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="p-2 space-y-1">
                    <button
                        onClick={() => { setActiveModal('settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Settings size={18} /> Settings
                    </button>
                    <button
                        onClick={() => { setActiveModal('about'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Info size={18} /> About
                    </button>
                    <button
                        onClick={handleFeedback}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                    >
                        <MessageSquare size={18} /> Feedback
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} /> Log Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default MoreMenu;
