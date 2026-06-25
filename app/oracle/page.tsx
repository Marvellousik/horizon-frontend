"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "oracle";
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  title: string;
  firstUserMessageIndex: number;
}

export default function OraclePage() {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [allHistory, setAllHistory] = useState<ChatMessage[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getToken = () =>
    localStorage.getItem("access_token") ?? localStorage.getItem("accessToken");

  // Fetch chat history
  useEffect(() => {
    const fetchChat = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await axios.get<{ history?: Array<{ sender: string; text: string; time: string }> }>(
          "http://127.0.0.1:8000/api/oracle/chat/",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const history = response.data.history ?? [];
        
        // Convert backend format to ChatMessage format
        const messages: ChatMessage[] = history.map((msg) => ({
          role: msg.sender === "USER" ? "user" : "oracle",
          content: msg.text,
          timestamp: msg.time,
        }));

        setAllHistory(messages);
        setChat(messages);

        // Extract conversations from history (user messages)
        const convos: Conversation[] = [];
        history.forEach((msg, idx) => {
          if (msg.sender === "USER") {
            const title = msg.text.split(" ").slice(0, 5).join(" ");
            convos.push({
              id: `conv-${convos.length}`,
              title: title.length > 50 ? title.substring(0, 50) + "..." : title,
              firstUserMessageIndex: idx,
            });
          }
        });
        setConversations(convos);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [chat, isTyping]);

  const loadConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    // The chat display will filter based on activeConversationId
  };

  const startNewInquiry = () => {
    setActiveConversationId(null);
    setChat([]);
    setInputValue("");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const token = getToken();
    if (!token) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Optimistic UI: add user message immediately
    setChat((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date().toLocaleTimeString() },
    ]);

    setIsTyping(true);
    setSending(true);

    try {
      const response = await axios.post<{ response: string }>(
        "http://127.0.0.1:8000/api/oracle/chat/",
        { message: userMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Add oracle response
      setChat((prev) => [
        ...prev,
        {
          role: "oracle",
          content: response.data.response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsTyping(false);
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background dark:bg-background-dim">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary/20 border-t-[#D96C4A] rounded-full mb-4" />
          <p className="text-text-secondary dark:text-slate-400">Loading Oracle...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex bg-background dark:bg-background-dim overflow-hidden">
      {/* Center Chat Column */}
      <section className="flex-1 flex flex-col border-r border-border-sand dark:border-border-sand/40">
        {/* Header */}
        <header className="border-b border-border-sand dark:border-border-sand/40 bg-surface dark:bg-surface px-8 py-6 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-1 font-serif">
            Oracle Guidance
          </h2>
          <p className="text-sm text-text-secondary dark:text-slate-400">
            Your financial well-being, prioritized.
          </p>
        </header>

        {/* Chat Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar"
        >
          {chat.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <p className="text-text-secondary dark:text-slate-400 mb-2">
                  Welcome to Horizon Oracle
                </p>
                <p className="text-sm text-text-secondary dark:text-text-secondary">
                  Ask me anything about your finances
                </p>
              </div>
            </div>
          ) : (
            <>
              {chat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${
                    msg.role === "user"
                      ? "flex-row-reverse justify-start"
                      : "justify-start"
                  }`}
                >
                  {msg.role === "oracle" && (
                    <div className="w-10 h-10 rounded-full bg-[#C8E8CB] flex items-center justify-center shrink-0">
                      <span className="text-lg">✨</span>
                    </div>
                  )}

                  <div
                    className={`max-w-2xl ${
                      msg.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`px-6 py-4 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-surface dark:bg-surface text-text-primary dark:text-white border border-[#C8E8CB]/30 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm sm:text-base leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    {msg.timestamp && (
                      <p className="text-xs text-stone-400 mt-1 px-2">
                        {msg.timestamp}
                      </p>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 text-white font-bold text-sm">
                      A
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C8E8CB] flex items-center justify-center shrink-0">
                    <span className="text-lg">✨</span>
                  </div>
                  <div className="bg-surface dark:bg-surface px-6 py-4 rounded-lg border border-[#C8E8CB]/30 rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border-sand dark:border-border-sand/40 bg-surface dark:bg-surface px-8 py-6">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask the Oracle..."
              disabled={sending}
              className="w-full px-6 py-4 pr-16 rounded-full border border-border-sand dark:border-stone-600 bg-background-dim dark:bg-stone-700 text-text-primary dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#D96C4A]"
            />
            <button
              type="submit"
              disabled={sending || !inputValue.trim()}
              className="absolute right-2 top-2 w-12 h-12 bg-primary hover:bg-primary-hover disabled:bg-stone-300 text-white rounded-full flex items-center justify-center transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-xs text-text-secondary dark:text-text-secondary mt-3">
            Horizon Oracle uses empathetic AI to support your financial journey. Decisions should be verified with your advisor.
          </p>
        </div>
      </section>

      {/* Right Column - Conversation History */}
      <aside className="hidden lg:flex lg:w-80 bg-background-dim dark:bg-background-dim border-l border-border-sand dark:border-border-sand/40 overflow-y-auto p-6 flex-col shrink-0">
        {/* Header */}
        <h3 className="text-xs uppercase tracking-widest text-text-secondary dark:text-slate-400 font-semibold mb-4 font-serif">
          Conversation History
        </h3>

        {/* New Inquiry Button */}
        <button
          onClick={startNewInquiry}
          className="w-full py-3 mb-6 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition"
        >
          New Inquiry
        </button>

        {/* Conversations List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-text-secondary italic py-4">
              No conversations yet. Start a new inquiry.
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeConversationId === conv.id
                    ? "bg-primary text-white"
                    : "bg-surface dark:bg-surface text-text-primary dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-stone-700"
                }`}
              >
                <p className="text-sm font-semibold truncate">{conv.title}</p>
              </button>
            ))
          )}
        </div>
      </aside>
    </main>
  );
}
