import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { User } from '../types';
import { addFeedback } from '../services/storageService';

interface FeedbackWidgetProps {
  currentUser: User;
  onSent?: () => void;
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ currentUser, onSent }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      addFeedback(currentUser.username, text.trim());
      setText('');
      setOpen(false);
      if (onSent) onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Floating button */}
      <div className="fixed right-6 bottom-6 z-[60]">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-full shadow-lg"
        >
          <MessageCircle size={16} />
          <span className="hidden md:inline">Feedback</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Send Feedback</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <p className="text-sm text-slate-400 mb-3">Send a message to the site admins — we read everything.</p>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
            />

            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setOpen(false)} className="px-3 py-2 text-slate-400 hover:text-white">Cancel</button>
              <button
                onClick={submit}
                disabled={sending || !text.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl flex items-center gap-2"
              >
                <Send size={14} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;
