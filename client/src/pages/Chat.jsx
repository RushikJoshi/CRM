import React, { useState, useEffect, useRef } from "react";
import API from "../utils/api";
import { toast } from "react-hot-toast";

const Chat = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef();

    const currentUser = API.getCurrentUser ? API.getCurrentUser() : JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedId) {
            fetchMessages(selectedId);
            // Polling for demo if websocket not fully setup
            const timer = setInterval(() => fetchMessages(selectedId), 5000);
            return () => clearInterval(timer);
        }
    }, [selectedId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await API.get("/chat/conversations");
            setConversations(res.data?.data || []);
            setLoading(false);
        } catch (err) {
            toast.error("Failed to load conversations.");
            setLoading(false);
        }
    };

    const fetchMessages = async (id) => {
        try {
            const res = await API.get(`/chat/${id}/messages`);
            setMessages(res.data?.data || []);
        } catch (err) {
            console.error("Fetch messages failed");
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || sending) return;

        setSending(true);
        try {
            await API.post("/chat/messages", { conversationId: selectedId, text: newMsg });
            setNewMsg("");
            fetchMessages(selectedId);
            fetchConversations(); // Update preview
        } catch (err) {
            toast.error("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Initializing secure chat channel...</div>;

    const activeConversation = conversations.find(c => c._id === selectedId);
    const otherParticipant = activeConversation?.participants?.find(p => p._id !== currentUser.id);

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden m-4">
            {/* Sidebar: Conversations */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">Communications</h2>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">Internal Exchange</p>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-xs text-gray-400 font-medium">No active exchanges. Start a chat from the User Directory.</p>
                        </div>
                    ) : (
                        conversations.map(c => {
                            const other = c.participants.find(p => p._id !== currentUser.id);
                            const isActive = selectedId === c._id;
                            return (
                                <button 
                                    key={c._id}
                                    onClick={() => setSelectedId(c._id)}
                                    className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-white border-l-4 ${isActive ? "bg-white border-indigo-600 shadow-sm" : "border-transparent text-gray-500 opacity-70"}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-indigo-100 shadow-lg">
                                        {other?.name?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-800 text-sm">{other?.name || "Unknown"}</span>
                                            <span className="text-[9px] font-black text-gray-400">
                                                {c.lastMessage?.createdAt && new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate max-w-[150px] font-medium mt-0.5">
                                            {c.lastMessage?.text || "Started conversation"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main: Chat View */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">
                                    {otherParticipant?.name?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm leading-none">{otherParticipant?.name}</h3>
                                    <span className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">Secured Connection</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
                            {messages.map((m, idx) => {
                                const isMine = m.senderId === currentUser.id;
                                return (
                                    <div key={m._id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${isMine ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                                            <p className="text-sm font-medium leading-relaxed">{m.message}</p>
                                            <p className={`text-[9px] mt-1 font-bold uppercase opacity-50 ${isMine ? "text-right" : "text-left"}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    placeholder="Type your message securely..."
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-medium"
                                />
                                <button 
                                    disabled={!newMsg.trim() || sending}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-indigo-50/10">
                        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 mb-6">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Secure Exchange Shielded</h3>
                        <p className="text-gray-400 text-sm mt-2 max-w-sm font-medium">Select a colleague from the sidebar to begin an isolated internal conversation. All messages are scoped to your company context.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
