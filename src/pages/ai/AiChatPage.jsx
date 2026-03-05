import { useEffect, useRef, useState } from 'react';
import { aiApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react';

export default function AiChatPage() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your LandEase AI Assistant. I'm here to help you with migration questions, find services, understand local laws, and navigate your settlement journey. How can I help you today?",
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const userMsg = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res = await aiApi.chat({ message: input.trim() });
            const reply = res.data.data?.reply || res.data.data?.message || res.data.message || 'I\'m unable to respond right now.';
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally { setLoading(false); }
    };

    const clearHistory = async () => {
        try {
            await aiApi.clearHistory();
            setMessages([{ role: 'assistant', content: "Chat cleared! How can I help you today?" }]);
            toast.success('Chat history cleared');
        } catch { toast.error('Failed to clear history'); }
    };

    const SUGGESTIONS = [
        "What documents do I need for a visa?",
        "How do I find housing in my destination?",
        "What are my employment rights?",
        "How do I access healthcare?",
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold text-white">AI Assistant</h1>
                        <p className="text-xs text-gray-500">Powered by LandEase AI</p>
                    </div>
                </div>
                <button onClick={clearHistory} title="Clear chat"
                    className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-950/30">
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${msg.role === 'user' ? 'bg-gold-500/20' : 'bg-purple-900/50'}`}>
                            {msg.role === 'user'
                                ? <User size={15} className="text-gold-400" />
                                : <Bot size={15} className="text-purple-400" />}
                        </div>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user'
                                ? 'bg-gold-500/10 border border-gold-500/20 text-white rounded-tr-none'
                                : 'bg-navy-800 border border-navy-700 text-gray-300 rounded-tl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                            <Bot size={15} className="text-purple-400" />
                        </div>
                        <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-tl-none px-4 py-3">
                            <div className="flex items-center gap-1">
                                {[0, 1, 2].map(n => (
                                    <div key={n} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                                        style={{ animationDelay: `${n * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggestions (show only if 1 message) */}
            {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
                    {SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => setInput(s)}
                            className="text-xs bg-navy-800 border border-navy-700 text-gray-300 hover:border-navy-500 hover:text-white px-3 py-1.5 rounded-full transition-all">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-3 flex-shrink-0">
                <input className="input flex-1 text-sm"
                    placeholder="Ask anything about your migration journey..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading} />
                <button type="submit" disabled={loading || !input.trim()}
                    className="btn-primary px-4 py-3 flex items-center gap-2 disabled:opacity-50 flex-shrink-0">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
