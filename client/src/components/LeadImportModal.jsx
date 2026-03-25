import React, { useState } from "react";
import { FiX, FiUpload, FiCheck, FiAlertCircle, FiFileText } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

const LeadImportModal = ({ isOpen, onClose, onImported, isStandalone = false }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith(".csv")) {
            setFile(selectedFile);
        } else {
            toast.error("Please select a valid CSV file.");
            e.target.value = null;
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.warning("No file selected.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        try {
            const res = await API.post("/leads/import", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success(res.data?.message || "Leads imported successfully.");
            onImported();
            onClose();
            setFile(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Import failed. Please check your CSV format.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const content = (
        <div className={`bg-white w-full ${isStandalone ? "" : "max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 border border-gray-100"} overflow-hidden animate-in zoom-in-95 duration-300`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-50 flex items-center justify-between ${isStandalone ? "bg-white" : "bg-gray-50/50"}`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm border border-teal-100">
                        <FiUpload size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight text-left leading-none">Import Leads</h2>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-left">Bulk Create Leads via CSV</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 group">
                    <FiX size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
            </div>

            <div className="p-5 space-y-4">
                {/* Instructions */}
                <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-3 text-teal-700">
                        <FiAlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">CSV Requirements</span>
                    </div>
                    <ul className="space-y-1 text-left">
                        <li className="text-[10px] font-bold text-teal-800 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-teal-500" />
                            Columns: <strong>name, email, phone, company, value</strong>
                        </li>
                    </ul>
                </div>

                {/* File Drop Area */}
                <div
                    className={`relative border-2 border-dashed rounded-[1.5rem] p-6 flex flex-col items-center justify-center transition-all cursor-pointer bg-gray-50 hover:bg-white
                    ${file ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200 hover:border-teal-300'}`}
                >
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {file ? (
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                <FiFileText size={24} />
                            </div>
                            <div>
                                <p className="text-[12px] font-black text-gray-900 truncate max-w-[200px]">{file.name}</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ready to upload</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-2 opacity-60">
                            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center">
                                <FiUpload size={24} />
                            </div>
                            <div>
                                <p className="text-[12px] font-black text-gray-900">Click to browse file</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CSV only</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white text-gray-400 font-black rounded-xl hover:bg-gray-100 transition-all text-[10px] uppercase tracking-widest border border-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={loading || !file}
                        className="flex-[2] flex items-center justify-center gap-3 py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-black active:scale-95 transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-gray-400/20 disabled:opacity-40"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiCheck size={16} /> Process Import</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    if (isStandalone) return content;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            {content}
        </div>
    );
};

export default LeadImportModal;
