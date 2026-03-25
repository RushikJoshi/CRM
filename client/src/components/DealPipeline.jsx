import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import DealCard from "./pipeline/DealCard";
import PipelineColumn from "./pipeline/PipelineColumn";

const DealPipeline = ({ deals = [], onEdit, onMove, onAddTask, onViewDeal, stages: propStages }) => {
  // 1. ZERO HARDCODED STAGES ANYWHERE
  const PIPELINE_STAGES = useMemo(() => {
    // UI MUST RENDER EXACTLY WHAT BACKEND RETURNS
    if (propStages && Array.isArray(propStages) && propStages.length > 0) {
      return [...propStages]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(s => ({ 
            id: s._id,
            label: s.name, 
            _id: s._id,
            color: s.color,
            probability: s.probability
        }));
    }
    // No hardcoded arrays like ["New", "Qualified"] - Render empty array
    return [];
  }, [propStages]);

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 2. LEAD GROUPING (STRICT)
  const groupedLeads = useMemo(() => {
    const map = {};
    // Initialize exactly with pipeline.stages
    PIPELINE_STAGES.forEach((s) => {
      map[s.id] = [];
    });
    
    (deals || []).forEach((d) => {
      // Use stageId from database directly
      const stageId = d.stageId?._id || d.stageId || d.stage; 
      
      // Match by _id (id) or label (name)
      const match = PIPELINE_STAGES.find(s => String(s.id) === String(stageId) || s.label === String(stageId));
      
      if (match && map[match.id]) {
          map[match.id].push(d);
      }
    });

    console.log("DEALS GROUPED BY STAGE ID:", Object.keys(map).length, "stages found");
    return map;
  }, [deals, PIPELINE_STAGES]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const getStageFromOver = (overId) => {
    const stage = PIPELINE_STAGES.find((s) => s.id === overId);
    if (stage) return stage;
    const deal = (deals || []).find((d) => String(d._id) === String(overId));
    if (deal) {
        const sid = deal.stageId?._id || deal.stageId || deal.stage;
        return PIPELINE_STAGES.find(s => String(s.id) === String(sid) || s.label === String(sid));
    }
    return null;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !onMove) return;

    const dealId = active.id;
    const toStage = getStageFromOver(over.id);
    const activeDeal = (deals || []).find((d) => String(d._id) === String(dealId));
    
    if (activeDeal && toStage) {
        const currentStageId = activeDeal.stageId?._id || activeDeal.stageId || activeDeal.stage;
        if (String(currentStageId) !== String(toStage.id) && String(currentStageId) !== String(toStage.label)) {
            // SYNCED PERSISTENCE: Pass name and _id
            onMove(dealId, toStage.label, toStage._id);
        }
    }
  };

  const activeDeal = activeId
    ? (deals || []).find((d) => String(d._id) === String(activeId))
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-10 min-h-[520px] scroll-smooth no-scrollbar">
        {/* RENDER STAGES (STRICT DYNAMIC) */}
        {PIPELINE_STAGES.length > 0 ? (
          PIPELINE_STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stageId={stage.id}
              stageLabel={stage.label}
              color={stage.color}
              probability={stage.probability}
              deals={groupedLeads[stage.id] || []}
              onEdit={onEdit}
              onAddTask={onAddTask}
              onViewDeal={onViewDeal}
            />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 text-center animate-pulse">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">No Backend Pipeline Stages</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Backend returned 0 stages. Ask Super Admin to configure stage structure.</p>
          </div>
        )}
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: 0.95 } },
          }),
        }}
      >
        {activeDeal ? (
          <div className="w-[280px] bg-white rounded-[32px] shadow-2xl p-4 border border-teal-500/10 rotate-1 scale-105">
            <h4 className="text-sm font-black text-gray-900 truncate">
              {activeDeal.customId || activeDeal.title || "Opportunity"}

            </h4>
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {activeDeal.companyId?.name || "Deal Pipeline"}
                </p>
                <span className="text-xs font-black text-teal-600">
                  ₹{Number(activeDeal.value || 0).toLocaleString("en-IN")}
                </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DealPipeline;
