import React, { useState } from "react";
import { FiX, FiUpload, FiCheck, FiAlertCircle, FiFileText } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

const LeadImportModal = ({ isOpen, onClose, onImported }) => {
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>

            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm border border-teal-100">
                            <FiUpload size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Import Leads</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Bulk Create Leads via CSV</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 group">
                        <FiX size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    {/* Instructions */}
                    <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-teal-700">
                            <FiAlertCircle size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">CSV Format Requirements</span>
                        </div>
                        <ul className="space-y-2">
                            <li className="text-[11px] font-bold text-teal-800 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                Columns: <strong>name, email, phone, company, value</strong>
                            </li>
                            <li className="text-[11px] text-teal-700/70 font-medium italic">
                                * Name is mandatory. Other fields are optional.
                            </li>
                        </ul>
                    </div>

                    {/* File Drop Area */}
                    <div
                        className={`relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer bg-gray-50 hover:bg-white
                        ${file ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200 hover:border-teal-300'}`}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {file ? (
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <FiFileText size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Ready to upload</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center space-y-3 opacity-60">
                                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center">
                                    <FiUpload size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">Click to browse file</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Accepts CSV only</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest border border-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            className="flex-[2] flex items-center justify-center gap-3 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black active:scale-95 transition-all text-xs uppercase tracking-widest shadow-xl shadow-gray-400/20 disabled:opacity-40 disabled:scale-100"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><FiCheck size={18} /> Process Import</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadImportModal;
