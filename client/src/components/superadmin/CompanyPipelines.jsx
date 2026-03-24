import React, { useState, useEffect } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiPlus, FiMenu, FiTrash2, FiSettings, FiActivity, FiLayers, FiInfo } from "react-icons/fi";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";

// ── STAGE ROW ─────────────────────────────────────────────────────────────────
function StageRow({ stage, onDelete, onUpdate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(stage._id || stage.tempId)
    });

    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : "auto" };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border ${isDragging ? "border-teal-400 shadow-2xl scale-[1.02]" : "border-gray-200"} rounded-2xl p-4 flex items-center gap-4 group transition-all duration-200`}
        >
            <div className="flex items-center gap-3 flex-grow min-w-0">
                <button {...attributes} {...listeners} className="p-2 text-gray-400 hover:text-teal-600 cursor-grab active:cursor-grabbing shrink-0 hover:bg-teal-50 rounded-lg transition-colors">
                    <FiMenu size={18} />
                </button>
                <div className="w-5 h-5 rounded-full shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: stage.color || "#0ea5e9" }} />
                <input
                    value={stage.name}
                    onChange={(e) => onUpdate({ ...stage, name: e.target.value })}
                    placeholder="Stage name..."
                    className="flex-grow text-sm font-black text-gray-800 bg-transparent border-none focus:ring-0 p-0"
                />
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Win %</span>
                    <input
                        type="number"
                        value={stage.probability ?? 50}
                        onChange={(e) => onUpdate({ ...stage, probability: Number(e.target.value) })}
                        className="w-10 text-xs font-black text-teal-600 bg-transparent border-none p-0 focus:ring-0 text-center"
                        step="5" min="0" max="100"
                    />
                </div>
                <input
                    type="color"
                    value={stage.color || "#0ea5e9"}
                    onChange={(e) => onUpdate({ ...stage, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm p-0 bg-transparent hover:scale-110 transition-transform"
                />
                <button
                    onClick={onDelete}
                    className="p-2.5 text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                    <FiTrash2 size={18} />
                </button>
            </div>
        </div>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
// ONE COMPANY = ONE PIPELINE. No switching, no isDefault, no multiple pipelines.
const CompanyPipelines = ({ companyId }) => {
    const toast = useToast();
    const [pipeline, setPipeline] = useState(null);  // Single pipeline object
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    // ── FETCH: ONE PIPELINE BY COMPANY ID ────────────────────────────────────
    const fetchPipeline = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/super-admin/pipeline/${companyId}`);
            const data = res.data?.data;
            setPipeline(data);
            console.log("PIPELINE DATA:", data);
            console.log("STAGES COUNT:", data?.stages?.length ?? 0);
        } catch (err) {
            // 404 means no pipeline yet — will be created on first save
            if (err.response?.status === 404) {
                setPipeline({ name: "Main Pipeline", companyId, stages: [] });
            } else {
                toast.error("Failed to load pipeline.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPipeline(); }, [companyId]);

    // ── SAVE: FULL STAGES REPLACEMENT ────────────────────────────────────────
    const handleSave = async () => {
        if (!pipeline) return;
        setSaving(true);
        try {
            const res = await API.put(`/super-admin/pipeline/${companyId}`, {
                name: pipeline.name,
                stages: (pipeline.stages || []).map((s, idx) => ({
                    _id: s._id,   // Keep existing _ids; DB will generate for new ones
                    name: s.name,
                    order: idx + 1,
                    color: s.color || "#0ea5e9",
                    probability: s.probability ?? 50,
                    tempId: undefined  // Strip temp IDs before send
                }))
            });
            const updated = res.data?.data;
            setPipeline(updated);
            console.log("PIPELINE UPDATED:", updated._id);
            console.log("STAGES COUNT:", updated.stages.length);
            toast.success(`Pipeline saved — ${updated.stages.length} stages synced to all panels.`);
        } catch (err) {
            toast.error("Save failed. Try again.");
        } finally {
            setSaving(false);
        }
    };

    // ── DRAG & DROP REORDER ───────────────────────────────────────────────────
    const onDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setPipeline(prev => {
            const oldIdx = prev.stages.findIndex(s => (s._id || s.tempId) === active.id);
            const newIdx = prev.stages.findIndex(s => (s._id || s.tempId) === over.id);
            return { ...prev, stages: arrayMove(prev.stages, oldIdx, newIdx) };
        });
    };

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-300">
            <div className="w-8 h-8 border-4 border-gray-100 border-t-teal-500 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Loading Pipeline...</span>
        </div>
    );

    return (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
            {/* ── HEADER ── */}
            <div className="p-8 md:p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm">
                            <FiSettings size={18} />
                        </div>
                        <span className="text-[11px] font-black text-teal-600 uppercase tracking-widest">Pipeline Configuration</span>
                    </div>
                    <input
                        value={pipeline?.name || ""}
                        onChange={(e) => setPipeline(prev => ({ ...prev, name: e.target.value }))}
                        className="text-3xl font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-gray-200"
                        placeholder="Pipeline name..."
                    />
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mt-2">
                        ONE pipeline · {pipeline?.stages?.length || 0} stages · All panels sync automatically
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-10 py-5 bg-teal-600 text-white font-black rounded-3xl text-[12px] uppercase tracking-widest shadow-2xl shadow-teal-600/40 hover:bg-teal-700 disabled:opacity-50 transition-all hover:-translate-y-1 active:scale-95"
                >
                    <FiActivity className={saving ? "animate-pulse" : ""} />
                    {saving ? "Saving..." : "Sync to All Panels"}
                </button>
            </div>

            {/* ── STAGE EDITOR ── */}
            <div className="p-8 md:p-10 bg-gray-50/20">
                <div className="flex items-center justify-between mb-8 px-2">
                    <div>
                        <h4 className="text-md font-black text-gray-900 uppercase flex items-center gap-2">
                            Pipeline Stages
                            <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-black">
                                {pipeline?.stages?.length || 0} Total
                            </span>
                        </h4>
                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">
                            Drag to reorder · Changes save on "Sync to All Panels"
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setPipeline(prev => ({
                                ...prev,
                                stages: [
                                    ...(prev.stages || []),
                                    {
                                        name: "New Stage",
                                        color: "#64748b",
                                        probability: 50,
                                        tempId: `tmp-${Date.now()}`
                                    }
                                ]
                            }));
                        }}
                        className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest bg-white border border-teal-100 px-6 py-3 rounded-2xl shadow-sm hover:bg-teal-50 hover:border-teal-300 transition-all active:scale-95"
                    >
                        <FiPlus /> Add Stage
                    </button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext
                        items={(pipeline?.stages || []).map(s => s._id || s.tempId)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {(pipeline?.stages || []).map((stage, idx) => (
                                <StageRow
                                    key={stage._id || stage.tempId}
                                    stage={stage}
                                    onDelete={() => {
                                        setPipeline(prev => ({
                                            ...prev,
                                            stages: prev.stages.filter((_, i) => i !== idx)
                                        }));
                                    }}
                                    onUpdate={(updated) => {
                                        setPipeline(prev => {
                                            const next = [...prev.stages];
                                            const i = next.findIndex(s => (s._id || s.tempId) === (updated._id || updated.tempId));
                                            if (i !== -1) next[i] = updated;
                                            return { ...prev, stages: next };
                                        });
                                    }}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {(pipeline?.stages?.length || 0) === 0 && (
                    <div className="text-center py-24 bg-white border-4 border-dashed border-gray-50 rounded-[40px] mt-4">
                        <FiLayers size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Pipeline is Empty</p>
                        <p className="text-[10px] text-gray-200 font-bold mt-1">Click "Add Stage" to define the first stage</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyPipelines;
