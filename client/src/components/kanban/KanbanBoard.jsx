import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { FiTrendingUp } from "react-icons/fi";
import { motion } from "framer-motion";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";

const skeletonCols = new Array(7).fill(0);

const getDealStageId = (deal) => deal?.stageId?._id || deal?.stageId || null;

const groupDealsByStage = (deals) => {
  const map = new Map();
  for (const d of deals) {
    const sid = getDealStageId(d) || "unassigned";
    if (!map.has(sid)) map.set(sid, []);
    map.get(sid).push(d);
  }
  return map;
};

export default function KanbanBoard() {
  const toast = useToast();
  const scrollRef = useRef(null);

  const [pipeline, setPipeline] = useState(null);    // Single pipeline object
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeDeal, setActiveDeal] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const dealsByStage = useMemo(() => groupDealsByStage(deals), [deals]);

  // ONE PIPELINE PER COMPANY — single GET /pipeline endpoint
  const fetchPipeline = useCallback(async () => {
    const res = await API.get("/pipeline");
    const pl = res.data?.data || null;
    setPipeline(pl);
    // Stages are embedded in the pipeline object — no separate endpoint needed
    const sortedStages = pl?.stages
      ? [...pl.stages].sort((a, b) => (a.order || 0) - (b.order || 0))
      : [];
    setStages(sortedStages);
    console.log("PIPELINE FETCHED:", pl?._id);
    console.log("TOTAL STAGES:", sortedStages.length);
    return pl;
  }, []);

  const fetchDeals = useCallback(async () => {
    const res = await API.get("/deals");
    setDeals(res.data?.data || []);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPipeline(), fetchDeals()]);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load pipeline board.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [fetchDeals, fetchPipeline, toast]);

  const findDeal = useCallback(
    (dealId) => deals.find((d) => d._id === dealId) || null,
    [deals]
  );

  const findStageIdForDeal = useCallback(
    (dealId) => getDealStageId(findDeal(dealId)),
    [findDeal]
  );

  const onDragStart = useCallback(
    (event) => {
      const dealId = event.active?.id;
      const d = findDeal(dealId);
      setActiveDeal(d);
    },
    [findDeal]
  );

  const optimisticMove = useCallback(
    (dealId, toStageId, overDealId) => {
      setDeals((prev) => {
        const idx = prev.findIndex((d) => d._id === dealId);
        if (idx === -1) return prev;

        const next = [...prev];
        const moving = { ...next[idx] };
        moving.stageId = toStageId;
        next[idx] = moving;

        // If dropped over another deal within same target stage, reorder locally for better UX
        if (overDealId && overDealId !== dealId) {
          const srcIndex = next.findIndex((d) => d._id === dealId);
          const dstIndex = next.findIndex((d) => d._id === overDealId);
          if (srcIndex !== -1 && dstIndex !== -1) {
            return arrayMove(next, srcIndex, dstIndex);
          }
        }
        return next;
      });
    },
    []
  );

  const onDragOver = useCallback((event) => {
    // Soft auto-scroll of horizontal container while dragging near edges
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.delta?.x;
    if (!x) return;

    const pointerX = (event.activatorEvent?.clientX ?? null);
    if (pointerX == null) return;
    const edge = 70;
    if (pointerX < rect.left + edge) el.scrollLeft -= 18;
    if (pointerX > rect.right - edge) el.scrollLeft += 18;
  }, []);

  const onDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveDeal(null);
      if (!over) return;

      const dealId = active.id;
      const overId = over.id;

      const fromStageId = findStageIdForDeal(dealId);

      // Determine target stage: if over a column use that, if over a deal use its stage
      const overDataType = over.data?.current?.type;
      const toStageId =
        overDataType === "stage" ? overId : findStageIdForDeal(overId);

      if (!toStageId || !fromStageId) return;
      if (toStageId === fromStageId && overDataType === "stage") return;

      // Optimistic UI update
      optimisticMove(dealId, toStageId, overDataType === "deal" ? overId : null);

      try {
        await API.put(`/deals/${dealId}/stage`, { stageId: toStageId });
      } catch (e) {
        console.error(e);
        toast.error("Failed to move deal. Reverting.");
        await fetchDeals();
      }
    },
    [fetchDeals, findStageIdForDeal, optimisticMove, toast]
  );

  if (loading) {
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
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 dark:bg-teal-600/10 rounded-full blur-3xl opacity-40 -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tight leading-none mb-1 flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-600/10 text-teal-700 dark:text-teal-500 flex items-center justify-center border border-teal-100 dark:border-teal-600/20">
              <FiTrendingUp size={18} />
            </span>
            {pipeline ? pipeline.name : "Deal Pipeline"}
          </h1>
          <p className="text-gray-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest opacity-90">
            {stages.length} stages · Drag deals to move them instantly.
          </p>
        </div>
        {/* No pipeline switcher — ONE pipeline per company */}
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
          {stages.map((stage) => (
            <KanbanColumn
              key={stage._id}
              stage={stage}
              deals={dealsByStage.get(stage._id) || []}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeDeal ? (
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
              <KanbanCard deal={activeDeal} isOverlay />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

