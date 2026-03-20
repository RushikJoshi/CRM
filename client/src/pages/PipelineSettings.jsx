import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiArrowLeft, FiMenu, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function SortableRow({ stage, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(stage._id) });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3",
        isDragging ? "opacity-60 shadow-lg" : "",
      ].join(" ")}
    >
      <button
        type="button"
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-grab active:cursor-grabbing"
        disabled={disabled}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <FiMenu />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900 truncate">{stage.name}</div>
        <div className="text-xs text-slate-500">Default probability: {Number(stage.probability || 0)}%</div>
      </div>
      <span className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-600 bg-slate-50">
        {stage.winLikelihood}
      </span>
    </div>
  );
}

export default function PipelineSettings() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = getCurrentUser();

  const [pipeline, setPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStageName, setNewStageName] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const canManage = user?.role === "company_admin";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pipelinesRes = await API.get("/pipeline");
      const first = Array.isArray(pipelinesRes.data?.data) ? pipelinesRes.data.data[0] : null;
      if (!first?._id) {
        setPipeline(null);
        setStages([]);
        return;
      }
      setPipeline(first);
      const stagesRes = await API.get(`/pipeline/${first._id}/stages`);
      setStages(Array.isArray(stagesRes.data?.data) ? stagesRes.data.data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pipeline settings.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stageIds = useMemo(() => stages.map((s) => String(s._id)), [stages]);

  const onDragEnd = async (event) => {
    if (!canManage) return;
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const oldIndex = stageIds.indexOf(activeId);
    const newIndex = stageIds.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(stages, oldIndex, newIndex);
    setStages(next);
  };

  const saveOrder = async () => {
    if (!pipeline?._id || !canManage) return;
    setSaving(true);
    try {
      const orderedStageIds = stages.map((s) => String(s._id));
      const res = await API.post("/pipeline/stages/reorder", { pipelineId: pipeline._id, orderedStageIds });
      setStages(Array.isArray(res.data?.data) ? res.data.data : stages);
      toast.success("Pipeline stage order saved.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  const addStage = async () => {
    if (!pipeline?._id || !canManage) return;
    const name = newStageName.trim();
    if (!name) return;
    setCreating(true);
    try {
      // Default to open, probability 10
      await API.post("/pipeline/stages", {
        name,
        pipelineId: pipeline._id,
        order: stages.length + 1,
        probability: 10,
        winLikelihood: "open",
      });
      setNewStageName("");
      await fetchData();
      toast.success("Stage added.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add stage.");
    } finally {
      setCreating(false);
    }
  };

  const deleteStage = async (stageId) => {
    if (!canManage) return;
    try {
      await API.delete(`/pipeline/stages/${stageId}`);
      toast.success("Stage deleted.");
      await fetchData();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to delete stage.");
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <FiArrowLeft /> Back
        </button>
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="text-lg font-bold text-slate-900">Pipeline Settings</div>
          <div className="mt-1 text-sm text-slate-500">Only Company Admin can manage pipeline stages.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <FiArrowLeft /> Back
        </button>
        <button
          type="button"
          onClick={saveOrder}
          disabled={saving || loading}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <FiSave /> {saving ? "Saving..." : "Save Order"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold text-slate-900">Pipeline Settings</div>
            <div className="text-sm text-slate-500 mt-0.5">Drag to reorder stages. Configure the default pipeline for your company.</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Add stage…"
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            />
            <button
              type="button"
              onClick={addStage}
              disabled={creating || !newStageName.trim()}
              className="px-3 py-2 rounded-xl bg-[#38BDF8] text-white text-sm font-semibold hover:bg-[#0EA5E9] disabled:opacity-50 inline-flex items-center gap-2"
            >
              <FiPlus /> Add
            </button>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : stages.length === 0 ? (
            <div className="text-sm text-slate-500">No stages found.</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={stageIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {stages.map((s) => (
                    <div key={s._id} className="relative">
                      <SortableRow stage={s} disabled={!canManage} />
                      {!s.isSystem && (
                        <button
                          type="button"
                          onClick={() => deleteStage(s._id)}
                          className="absolute right-3 top-3 p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                          aria-label="Delete stage"
                          title="Delete stage"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

