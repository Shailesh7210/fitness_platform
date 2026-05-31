import { useEffect, useState, useRef } from 'react';
import { Send, Trash2, Bot, User }     from 'lucide-react';
import toast                           from 'react-hot-toast';
import { api }                         from '../../api/client';
import { useAuthStore }                from '../../store/authStore';
import { UserLayout }                  from '../../components/layout/UserLayout';
import { Spinner }                     from '../../components/ui/Spinner';
import type { ChatMessage }            from '../../types';

export function ChatPage() {
  const { user }                        = useAuthStore();
  const [messages,  setMessages]        = useState<ChatMessage[]>([]);
  const [input,     setInput]           = useState('');
  const [loading,   setLoading]         = useState(true);
  const [sending,   setSending]         = useState(false);
  const [clearing,  setClearing]        = useState(false);
  const bottomRef                       = useRef<HTMLDivElement>(null);
  const inputRef                        = useRef<HTMLTextAreaElement>(null);

  // ── Load history ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/chat/history');
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;

    // Optimistic UI
    const userMsg: ChatMessage = {
      role:      'user',
      content:   msg,
      flagged:   false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Typing indicator
    const typingMsg: ChatMessage = {
      role:      'assistant',
      content:   '__typing__',
      flagged:   false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, typingMsg]);

    try {
      const res = await api.post('/api/chat/message', { message: msg });

      // Replace typing indicator with real reply
      setMessages(prev => [
        ...prev.filter(m => m.content !== '__typing__'),
        {
          role:      'assistant',
          content:   res.data.reply,
          flagged:   res.data.flagged || false,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.content !== '__typing__'));
      if (err.response?.status === 429) {
        toast.error('Too many messages. Please wait a moment.');
      } else {
        toast.error('Failed to send message');
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // ── Clear history ─────────────────────────────────────────────────
  async function handleClear() {
    if (!window.confirm('Clear all chat history?')) return;
    setClearing(true);
    try {
      await api.delete('/api/chat/history');
      setMessages([]);
      toast.success('Chat cleared');
    } catch {
      toast.error('Failed to clear chat');
    } finally {
      setClearing(false);
    }
  }

  // ── Handle Enter to send ──────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  }

  function timeStr(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour:   '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <UserLayout title="AI Assistant">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Platform Assistant</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs text-slate-400">Always online</p>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-red-200 hover:text-red-500 transition disabled:opacity-50"
            >
              <Trash2 size={13} />
              {clearing ? 'Clearing...' : 'Clear chat'}
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {loading ? (
            <div className="py-20"><Spinner className="mx-auto" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <Bot size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Hi {user?.firstName}! 👋
              </h3>
              <p className="text-slate-400 text-sm max-w-sm">
                I'm your wellness assistant. Ask me about challenges,
                nutrition, programs, devices, or anything else on the platform.
              </p>
              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {[
                  'How do I join a challenge?',
                  'Tips for better nutrition',
                  'What mind programs are available?',
                  'How do I connect my device?',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 rounded-full border border-blue-200 text-xs text-blue-600 hover:bg-blue-50 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isUser   = msg.role === 'user';
              const isTyping = msg.content === '__typing__';

              return (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar — assistant */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mb-1">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}

                  <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                    }`}>
                      {isTyping ? (
                        <div className="flex items-center gap-1 py-0.5 px-1">
                          {[0, 1, 2].map(i => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {!isTyping && (
                      <div className={`flex items-center gap-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs text-slate-400">
                          {timeStr(msg.createdAt)}
                        </span>
                        {msg.flagged && (
                          <span className="text-xs text-orange-500">⚠ flagged</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Avatar — user */}
                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mb-1 text-white text-xs font-bold">
                      {user?.firstName?.[0]}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 pt-4">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={1}
                maxLength={500}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none max-h-32 overflow-y-auto"
                style={{ minHeight: '48px' }}
              />
              <span className="absolute bottom-2 right-3 text-xs text-slate-300">
                {input.length}/500
              </span>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={18} />
              }
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-2">
            AI responses are generated based on platform context
          </p>
        </div>
      </div>
    </UserLayout>
  );
}