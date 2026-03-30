import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Loader2, Sparkles, Clock, Calendar, Briefcase, BookOpen, Newspaper, MessageSquare } from 'lucide-react';
import { cn } from './lib/utils';
import { Message, NOBLE_AI_SYSTEM_INSTRUCTION } from './constants';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting from Noble AI
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    if (hour >= 17) timeOfDay = "evening";

    const initialGreeting: Message = {
      id: 'initial',
      role: 'assistant',
      content: `Good ${timeOfDay}. I am Noble AI, your personal intelligence. How may I assist you today?`,
      timestamp: Date.now()
    };
    setMessages([initialGreeting]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: NOBLE_AI_SYSTEM_INSTRUCTION }] },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: input }] }
        ]
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I apologize, but I encountered an error in processing your request.",
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Noble AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I am currently unable to process your request due to a technical difficulty. Please allow me a moment to recover, or try again shortly.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { icon: Briefcase, label: "Work & Productivity", prompt: "I need assistance with my current tasks and productivity planning." },
    { icon: BookOpen, label: "Research & Learning", prompt: "I would like to research a new topic or learn a specific concept." },
    { icon: Calendar, label: "Daily Planning", prompt: "Help me organize my schedule and priorities for the day." },
    { icon: Sparkles, label: "Creative Ideas", prompt: "I am looking for some creative inspiration or brainstorming session." },
    { icon: Newspaper, label: "News & Events", prompt: "What are the latest significant world events I should be aware of?" },
    { icon: MessageSquare, label: "Casual Conversation", prompt: "I would enjoy a thoughtful conversation with you." }
  ];

  return (
    <div className="flex flex-col h-screen bg-noble-bg text-noble-ink selection:bg-noble-accent/20">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-noble-accent/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-noble-accent flex items-center justify-center text-white shadow-lg shadow-noble-accent/20">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">Noble AI</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-noble-muted font-medium">Personal Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-noble-muted">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Clock size={14} />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-0 py-8 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "flex gap-4 group",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  message.role === 'user' ? "bg-noble-accent/10 text-noble-accent" : "bg-noble-accent text-white"
                )}>
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "max-w-[85%] px-5 py-3.5 rounded-2xl shadow-sm",
                  message.role === 'user' 
                    ? "bg-noble-accent text-white rounded-tr-none" 
                    : "bg-white border border-noble-accent/5 rounded-tl-none"
                )}>
                  <div className={cn(
                    "markdown-body text-[15px] leading-relaxed",
                    message.role === 'user' ? "text-white" : "text-noble-ink"
                  )}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <div className={cn(
                    "text-[10px] mt-2 opacity-50 font-medium tracking-wider uppercase",
                    message.role === 'user' ? "text-right" : "text-left"
                  )}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-noble-accent flex items-center justify-center text-white shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-noble-accent/5 px-5 py-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-noble-accent" />
                <span className="text-xs font-medium text-noble-muted italic">Noble AI is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-white/80 backdrop-blur-md border-t border-noble-accent/10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    setInput(action.prompt);
                  }}
                  className="flex items-center gap-2.5 p-3 text-left bg-white border border-noble-accent/10 rounded-xl hover:border-noble-accent/30 hover:bg-noble-accent/5 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-noble-accent/5 text-noble-accent group-hover:bg-noble-accent group-hover:text-white transition-colors">
                    <action.icon size={16} />
                  </div>
                  <span className="text-xs font-semibold tracking-tight">{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Compose your message to Noble AI..."
              className="w-full bg-white border border-noble-accent/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-noble-accent/20 focus:border-noble-accent/30 transition-all resize-none min-h-[60px] max-h-[200px] text-[15px] shadow-sm"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-3 bottom-3 p-2.5 rounded-xl transition-all",
                input.trim() && !isLoading 
                  ? "bg-noble-accent text-white shadow-lg shadow-noble-accent/20 hover:scale-105 active:scale-95" 
                  : "bg-noble-accent/10 text-noble-accent/30 cursor-not-allowed"
              )}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-noble-muted font-medium uppercase tracking-widest">
            Noble AI — Your Trusted Human Companion
          </p>
        </div>
      </footer>
    </div>
  );
}
