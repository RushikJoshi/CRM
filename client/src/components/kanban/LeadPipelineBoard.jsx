import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FiTrendingUp, FiPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import LeadPipelineColumn from "./LeadPipelineColumn";
import LeadPipelineCard from "./LeadPipelineCard";
import ConvertLeadModal from "../ConvertLeadModal";

const LEAD_STAGES = ["new_lead", "attempted_contact", "contacted", "qualified", "prospect", "won", "lost"];

const skeletonCols = new Array(7).fill(0);

export default function LeadPipelineBoard() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  const basePath = location.pathname.startsWith("/company") ? "/company" : location.pathname.startsWith("/branch") ? "/branch" : "/sales";

  const [grouped, setGrouped] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState(null);
  const [pendingWonLead, setPendingWonLead] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await API.get("/leads/pipeline");
      setGrouped(res.data?.data && typeof res.data.data === "object" ? res.data.data : {});
    } catch (err) {
      console.error(err);
      setGrouped({});
      if (typeof toast?.error === "function") toast.error("Failed to load lead pipeline.");
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchPipeline()
      .catch((e) => {
        console.error(e);
        if (typeof toast?.error === "function") toast.error("Failed to load lead pipeline.");
      })
      .finally(() => setLoading(false));
  }, [fetchPipeline, toast]);

  const getLeadStage = useCallback(
    (leadId) => {
      if (!grouped || typeof grouped !== "object") return null;
      const id = leadId != null ? String(leadId) : null;
      if (!id) return null;
      for (const stage of LEAD_STAGES) {
        const list = grouped[stage] || [];
        if (list.some((l) => l && String(l._id) === id)) return stage;
      }
      return null;
    },
    [grouped]
  );

  const findLead = useCallback(
    (leadId) => {
      if (!grouped || typeof grouped !== "object") return null;
      const id = leadId != null ? String(leadId) : null;
      if (!id) return null;
      for (const stage of LEAD_STAGES) {
        const list = grouped[stage] || [];
        const found = list.find((l) => l && String(l._id) === id);
        if (found) return found;
      }
      return null;
    },
    [grouped]
  );

  const onDragStart = useCallback(
    (event) => {
      const leadId = event.active?.id;
      const lead = findLead(leadId);
      setActiveLead(lead);
    },
    [findLead]
  );

  const optimisticMove = useCallback((leadId, toStageKey) => {
    const id = leadId != null ? String(leadId) : null;
    if (!id) return;
    setGrouped((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      let moved = null;
      for (const stage of LEAD_STAGES) {
        const list = next[stage] || [];
        const idx = list.findIndex((l) => l && String(l._id) === id);
        if (idx !== -1) {
          [moved] = list.splice(idx, 1);
          next[stage] = [...list];
          break;
        }
      }
      if (!moved) return prev;
      const targetList = next[toStageKey] || [];
      next[toStageKey] = [...targetList, { ...moved, stage: toStageKey, stageUpdatedAt: new Date() }];
      return next;
    });
  }, []);

  const onDragOver = useCallback((event) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.delta?.x;
    if (!x) return;
    const pointerX = event.activatorEvent?.clientX ?? null;
    if (pointerX == null) return;
    const edge = 70;
    if (pointerX < rect.left + edge) el.scrollLeft -= 18;
    if (pointerX > rect.right - edge) el.scrollLeft += 18;
  }, []);

  const onDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      const leadId = active.id;
      const lead = findLead(leadId);
      setActiveLead(null);
      if (!over) return;

      const overId = over.id;
      const overType = over.data?.current?.type;

      const fromStageKey = getLeadStage(leadId);
      const toStageKey = overType === "stage" ? overId : getLeadStage(overId);

      if (!toStageKey || !fromStageKey) return;
      if (toStageKey === fromStageKey && overType === "stage") return;

      optimisticMove(leadId, toStageKey);

      if (toStageKey === "won") {
        setPendingWonLead({ leadId, lead });
        return;
      }

      try {
        await API.patch(`/leads/${leadId}/stage`, { status: toStageKey });
      } catch (e) {
        console.error(e);
        toast.error("Failed to move lead. Reverting.");
        await fetchPipeline();
      }
    },
    [findLead, fetchPipeline, getLeadStage, optimisticMove, toast]
  );

  const handleConvertLead = useCallback(
    async (lead) => {
      if (!lead?._id) return;
      setConvertLoading(true);
      try {
        await API.post(`/leads/${lead._id}/convert`);
        toast.success("Lead converted to Deal & Customer.");
        setPendingWonLead(null);
        await fetchPipeline();
      } catch (e) {
        console.error(e);
        toast.error(e.response?.data?.message || "Failed to convert lead.");
      } finally {
        setConvertLoading(false);
      }
    },
    [fetchPipeline, toast]
  );

  const handleJustMarkWon = useCallback(
    async (lead) => {
      if (!lead?._id) return;
      setConvertLoading(true);
      try {
        await API.patch(`/leads/${lead._id}/stage`, { status: "won" });
        toast.success("Lead marked as Won.");
        setPendingWonLead(null);
        await fetchPipeline();
      } catch (e) {
        console.error(e);
        toast.error("Failed to update. Reverting.");
        await fetchPipeline();
        setPendingWonLead(null);
      } finally {
        setConvertLoading(false);
      }
    },
    [fetchPipeline, toast]
  );

  const handleCloseConvertModal = useCallback(() => {
    if (convertLoading) return;
    setPendingWonLead(null);
    fetchPipeline();
  }, [convertLoading, fetchPipeline]);

  if (loading && grouped == null) {
    return (
      <div className="space-y-8 pb-20">
        <div className="bg-white dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="h-6 w-56 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="mt-3 h-3 w-80 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="flex gap-6 overflow-x-auto pb-8 p-2">
          {skeletonCols.map((_, i) => (
            <div key={i} className="min-w-[320px] max-w-[320px]">
              <div className="bg-white dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                  <div className="h-4 w-40 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="mt-3 h-3 w-28 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-950/40 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-40 -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lead pipeline kanban board</p>
          {grouped && typeof grouped === "object" && (
            <p className="text-xs text-gray-400 mt-1">
              {Object.values(grouped).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)} leads across {LEAD_STAGES.length} stages
            </p>
          )}
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchPipeline()}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50"
          >
            Refresh
          </button>
          <Link
            to={`${basePath}/leads/create`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm"
          >
            <FiPlus size={18} /> Add Lead
          </Link>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        autoScroll
      >
        <div
          ref={scrollRef}
          className="flex flex-nowrap overflow-x-auto pb-8 gap-6 min-h-[62vh] snap-x snap-mandatory scroll-smooth p-2"
        >
          {LEAD_STAGES.map((stageKey) => (
            <LeadPipelineColumn
              key={stageKey}
              stageKey={stageKey}
              leads={grouped && typeof grouped === "object" ? grouped[stageKey] || [] : []}
              onViewLead={(lead) => lead?._id && navigate(`${basePath}/leads/${lead._id}`)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeLead && activeLead._id != null ? (
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
              <LeadPipelineCard lead={activeLead} isOverlay />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ConvertLeadModal
        isOpen={Boolean(pendingWonLead)}
        onClose={handleCloseConvertModal}
        lead={pendingWonLead?.lead}
        onConvert={handleConvertLead}
        onJustMarkWon={handleJustMarkWon}
        loading={convertLoading}
      />
    </div>
  );
}
