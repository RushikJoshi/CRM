import React, { useState, useEffect } from "react";
import API from "../services/api";
import { FiPlus, FiFileText } from "react-icons/fi";

const NotesSection = ({ leadId, customerId, dealId, contactId }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: "", content: "" });
    const [loading, setLoading] = useState(true);

    const fetchNotes = async () => {
        try {
            let url = "/crm/notes?";
            if (leadId) url += `leadId=${leadId}&`;
            if (customerId) url += `customerId=${customerId}&`;
            if (dealId) url += `dealId=${dealId}&`;
            if (contactId) url += `contactId=${contactId}&`;

            const res = await API.get(url);
            // Robust check for array data
            const rawData = res.data?.data || res.data;
            setNotes(Array.isArray(rawData) ? rawData : []);
        } catch (err) {
            console.error("Notes fetch error:", err);
            setNotes([]); // Fallback to empty array
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            await API.post("/crm/notes", {
                ...newNote,
                leadId,
                customerId,
                dealId,
                contactId
            });
            setNewNote({ title: "", content: "" });
            fetchNotes();
        } catch (err) {
            console.error("Add note error:", err);
        }
    };

    const handleDeleteNote = async (id) => {
        try {
            await API.delete(`/crm/notes/${id}`);
            fetchNotes();
        } catch (err) {
            console.error("Delete note error:", err);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [leadId, customerId, dealId, contactId]);

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                <FiFileText className="text-green-500" />
                Internal Notes
            </h3>

            {/* Form */}
            <form onSubmit={handleAddNote} className="space-y-5 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                    <input
                        type="text"
                        placeholder="Enter title..."
                        className="w-full px-5 py-4 bg-white rounded-2xl border border-transparent outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-bold text-sm text-gray-700 placeholder:text-gray-300 shadow-sm transition-all"
                        value={newNote.title}
                        required
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Note Content</label>
                    <textarea
                        placeholder="Enter Note..."
                        className="w-full px-5 py-4 bg-white rounded-[2rem] border border-transparent outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-medium text-sm text-gray-600 placeholder:text-gray-300 min-h-[120px] shadow-sm transition-all"
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    />
                </div>
                <button type="submit" className="w-full py-4.5 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95">
                    Add Note
                </button>
            </form>

            <div className="space-y-4">
                {Array.isArray(notes) && notes.map((note) => (
                    <div key={note._id} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm relative group overflow-hidden hover:shadow-xl transition-all">

                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <h4 className="font-black text-gray-900 tracking-tight pr-10 text-lg uppercase">{note.title}</h4>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">{note.content}</p>
                        <div className="flex items-center gap-2 pt-6 border-t border-gray-50">
                            <FiFileText className="text-green-500/40" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                Date: {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {(!notes || notes.length === 0) && !loading && (
                    <div className="p-16 text-center bg-gray-50/30 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[10px]">No notes found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesSection;
