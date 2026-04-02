import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getSocket } from "../services/socket";
import { 
  getStoredPrivateKey, 
  generateAESKey, 
  encryptContent, 
  decryptContent, 
  encryptAESKeyWithRSA, 
  decryptAESKeyWithRSA, 
  importPublicKey 
} from "../services/encryptionService";

const Chat = () => {
    const toast = useToast();
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [privateKey, setPrivateKey] = useState(null);
    const [directory, setDirectory] = useState([]); // All users in company
    const [showDirectory, setShowDirectory] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const scrollRef = useRef();
    const socket = useRef(null);

    const currentUser = API.getCurrentUser ? API.getCurrentUser() : JSON.parse(localStorage.getItem("user") || "{}");

    // ── INITIALIZATION: Fetch conversations & Load Private Key ──────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [convRes, dirRes] = await Promise.all([
                    API.get("/chat/conversations"),
                    API.get("/users/directory")
                ]);
                
                setConversations(convRes.data?.data || []);
                setDirectory(dirRes.data?.data || []);
                
                const currentId = currentUser?.id || currentUser?._id;
                const pvKey = await getStoredPrivateKey(currentId);
                setPrivateKey(pvKey);
                
                setLoading(false);
            } catch (err) {
                toast.error("Cloud connection failed.");
                setLoading(false);
            }
        };
        init();
    }, [currentUser.id]);

    // ── SELECTION LOGIC ──────────────────────────────────────────────────────
    const startNewLink = async (targetUserId) => {
        try {
            const res = await API.post("/chat/conversations", { targetUserId });
            const conversation = res.data.data;
            
            // Add to conversations if not present
            if (!conversations.find(c => c._id === conversation._id)) {
                setConversations(prev => [conversation, ...prev]);
            }
            
            setSelectedId(conversation._id);
            setShowDirectory(false);
            setSearchQuery("");
        } catch (err) {
            toast.error("Failed to establish link.");
        }
    };

    // ── Filtered Directory ───────────────────────────────────────────────────
    const filteredUsers = directory.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── SOCKET.IO: Real-time listeners ───────────────────────────────────────
    useEffect(() => {
        const s = getSocket();
        s.connect();
        socket.current = s;

        s.on("message:new", async (newMsg) => {
            // Robust match: convert to String then trim/lowercase
            const incomingConvId = String(newMsg.conversationId || "").toLowerCase().trim();
            const currentConvId = String(selectedId || "").toLowerCase().trim();

            if (incomingConvId === currentConvId && currentConvId !== "") {
                const decrypted = await decryptMessage(newMsg);
                setMessages(prev => {
                    // CRITICAL: Prevent duplicate bubbles (optimistic vs socket vs redundant emits)
                    const exists = prev.some(m => String(m._id) === String(newMsg._id));
                    if (exists) return prev;
                    return [...prev, decrypted];
                });
            }
        });

        s.on("chat:update", () => {
            fetchConversations();
        });

        return () => {
            s.off("message:new");
            s.off("chat:update");
        };
    }, [selectedId]);

    // ── ROOM MANAGEMENT ──────────────────────────────────────────────────────
    useEffect(() => {
        if (selectedId && socket.current) {
            socket.current.emit("chat:join", selectedId);
            fetchMessages(selectedId);
        }
    }, [selectedId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── E2EE: Decrypting logic ───────────────────────────────────────────────
    const decryptMessage = useCallback(async (msg) => {
        if (!msg.isEncrypted || msg._decrypted) return msg;

        if (!privateKey) {
            return { ...msg, message: "⚠️ [Cloud Sync Required - Please wait or refresh]", _error: true };
        }

        try {
            const currentId = currentUser?.id || currentUser?._id;
            // Use sender key if I am the sender, else use receiver's key
            const keyToUse = String(msg.senderId) === String(currentId) ? msg.senderEncryptedKey : msg.encryptedAESKey;
            
            if (!keyToUse) {
                // Compatibility for legacy history that didn't have sender-encryption key
                if (String(msg.senderId) === String(currentId)) return { ...msg, message: msg.message || "Encrypted Message" }; 
                throw new Error("Encrypted key missing");
            }

            // RSA Decrypt the AES key
            const aesKey = await decryptAESKeyWithRSA(keyToUse, privateKey);
            // Content Decrypt (Note: field name in DB is 'message')
            const decryptedBody = await decryptContent(msg.message, aesKey, msg.iv);
            return { ...msg, message: decryptedBody, _decrypted: true };
        } catch (err) {
            console.error("🗝️  E2EE Decryption Error Details:", {
                error: err.message,
                msgId: msg._id,
                sender: msg.senderId
            });
            // ALWAYS return the message object so it's not hidden
            return { ...msg, message: "🔒 Message encrypted with old key", _error: true };
        }
    }, [privateKey]);

    const fetchConversations = async () => {
        try {
            const res = await API.get("/chat/conversations");
            setConversations(res.data?.data || []);
        } catch (err) {}
    };

    const fetchMessages = async (id) => {
        try {
            const res = await API.get(`/chat/${id}/messages`);
            const encryptedMsgs = res.data?.data || [];
            
            // Decrypt all messages in bank
            const decryptedMsgs = await Promise.all(encryptedMsgs.map(m => decryptMessage(m)));
            setMessages(decryptedMsgs);
        } catch (err) {
            console.error("Fetch messages failed");
        }
    };

    // ── E2EE: Encryption flow ───────────────────────────────────────────────
    const handleSend = async (e) => {
        e.preventDefault();
        const text = newMsg.trim();
        if (!text || sending || !selectedId) return;

        setSending(true);
        try {
            const activeConv = conversations.find(c => c._id === selectedId);
            const receiverSummary = activeConv?.participants?.find(p => p._id !== currentUser.id);
            
            if (!receiverSummary) throw new Error("Receiver not found");

            // CRITICAL FIX: Fetch FRESH public key from API before encrypting
            const userRes = await API.get(`/users/${receiverSummary._id}`);
            const receiver = userRes.data.data;

            let payload = { conversationId: selectedId, text };

            // ── SECURE SHIELD: Encrypt if receiver has a public key ────────────────
            if (receiver?.publicKey) {
                console.log("🔒 Encrypting message for fresh key of:", receiver.name);
                
                // 1. Generate one-time session key (AES)
                const aesKey = await generateAESKey();
                
                // 2. Encrypt message content
                const { cipherText, iv } = await encryptContent(text, aesKey);
                
                // 3. Encrypt the Session Key for the RECEIVER (RSA)
                const encryptedAESKey = await encryptAESKeyWithRSA(aesKey, receiver.publicKey);

                // 4. Encrypt the same Session Key for the SENDER (RSA - so I can read my history later!)
                let senderEncryptedKey = null;
                if (currentUser.publicKey) {
                    senderEncryptedKey = await encryptAESKeyWithRSA(aesKey, currentUser.publicKey);
                }
                
                payload = { 
                    ...payload, 
                    text: cipherText, 
                    encryptedAESKey, 
                    senderEncryptedKey,
                    iv, 
                    isEncrypted: true 
                };
            }

            const res = await API.post("/chat/messages", payload);
            const sentMsg = res.data.data;
            
            // Optimistic update (show decrypted to self)
            setMessages(prev => [...prev.filter(m => m._id !== sentMsg._id), { ...sentMsg, message: text, _decrypted: true }]);
            setNewMsg("");
            fetchConversations(); 
        } catch (err) {
            console.error("Send failed:", err);
            toast.error("Secure transmission failed.");
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Initializing Secure Tunnels...</p>
        </div>
    );

    const activeConversation = conversations.find(c => c._id === selectedId);
    const otherParticipant = activeConversation?.participants?.find(p => p._id !== currentUser.id);

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden m-4 relative">
            {/* ── SELECTION MODAL ────────────────────────────────────────────────── */}
            {showDirectory && (
                <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white">
                        <div className="p-6 border-b border-slate-50 bg-white flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Access Directory</h3>
                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Personnel Lookup</p>
                            </div>
                            <button onClick={() => setShowDirectory(false)} className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-all font-black">&times;</button>
                        </div>
                        <div className="p-4 bg-slate-50/50">
                            <input 
                                type="text"
                                placeholder="Search by name or node identifier..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-bold"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                            {filteredUsers.length === 0 ? (
                                <div className="p-10 text-center opacity-30">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none">No Nodes Located</p>
                                </div>
                            ) : (
                                filteredUsers.map(u => (
                                    <button 
                                        key={u._id}
                                        onClick={() => startNewLink(u._id)}
                                        className="w-full p-4 flex items-center gap-4 hover:bg-indigo-50 rounded-2xl transition-all group border border-transparent hover:border-indigo-100"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                            {u.profilePhotoUrl ? <img src={u.profilePhotoUrl} className="w-full h-full object-cover rounded-xl" /> : u.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{u.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{u.role?.replace("_", " ")}</p>
                                        </div>
                                        <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-400 font-black tracking-tighter opacity-0 group-hover:opacity-100 transition-all">LINK</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-80 border-r border-gray-100 flex flex-col bg-slate-50/20">
                <div className="p-6 border-b border-gray-100 bg-white shadow-sm flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Secure Link</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Connected</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowDirectory(true)}
                        className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-[1.1] active:translate-y-1 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center opacity-40">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">No Links Active</p>
                        </div>
                    ) : (
                        conversations.map(c => {
                            const other = c.participants.find(p => p._id !== currentUser.id);
                            const isActive = selectedId === c._id;
                            const isEnc = c.lastMessage?.text?.includes("🔒");
                            
                            return (
                                <button 
                                    key={c._id}
                                    onClick={() => setSelectedId(c._id)}
                                    className={`w-full p-5 flex items-center gap-4 transition-all hover:bg-white relative border-l-[6px] ${isActive ? "bg-white border-indigo-600 shadow-md z-10" : "border-transparent text-slate-500 opacity-60"}`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-100">
                                        {other?.name?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-slate-800 text-sm tracking-tight">{other?.name || "Unknown Collector"}</span>
                                            <span className="text-[9px] font-black text-slate-300">
                                                {c.lastMessage?.createdAt && new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {isEnc && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                                            <p className={`text-xs truncate max-w-[140px] font-bold ${isEnc ? "text-indigo-400 italic" : "text-slate-400"}`}>
                                                {c.lastMessage?.text || "New Link Established"}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                {selectedId ? (
                    <>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-black shadow-inner">
                                    {otherParticipant?.name?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-base leading-none tracking-tight">{otherParticipant?.name}</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-500/20">Shield Active</span>
                                        {otherParticipant?.publicKey && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">E2EE Verified</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/10 custom-scrollbar">
                            {messages.map((m, idx) => {
                                const isMine = m.senderId === currentUser.id;
                                return (
                                    <div key={m._id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                        <div className={`group flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                                            <div className={`max-w-[480px] p-4 px-5 rounded-3xl shadow-lg border relative ${isMine ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-indigo-100" : "bg-white border-slate-100 text-slate-700 rounded-tl-none shadow-slate-200/50"}`}>
                                                <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{m.message}</p>
                                                {m.isEncrypted && (
                                                    <div className={`mt-2 flex items-center gap-1.5 opacity-40 ${isMine ? "justify-end" : "justify-start"}`}>
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Shielded</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[9px] mt-2 font-black text-slate-300 uppercase tracking-widest px-2">
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
                            <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-[28px] focus-within:ring-8 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all duration-300">
                                <input 
                                    type="text"
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    placeholder="Execute secure transmission..."
                                    className="flex-1 bg-transparent px-5 py-3 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                />
                                <button 
                                    disabled={!newMsg.trim() || sending}
                                    className="bg-indigo-600 text-white h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:translate-y-[-2px] active:translate-y-[0px] active:scale-95 disabled:opacity-30 disabled:translate-y-0 disabled:scale-100 transition-all duration-200"
                                >
                                    Transmit
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-slate-50/10">
                        <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-indigo-500 mb-8 border border-white rotate-3">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Terminal ID Ready</h3>
                        <p className="text-slate-400 text-sm mt-3 max-w-xs font-bold leading-relaxed px-4">Identify a node from the sidebar to establish a secure end-to-end encrypted link within your company perimeter.</p>
                        <div className="mt-8 flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            <div className="w-2 h-2 rounded-full bg-indigo-300" />
                            <div className="w-2 h-2 rounded-full bg-indigo-200" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
