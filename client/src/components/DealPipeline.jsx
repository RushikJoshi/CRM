import React, { useState, useMemo } from "react";
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

const PIPELINE_STAGES = [
  { id: "New", label: "New" },
  { id: "Proposal", label: "Proposal" },
  { id: "Negotiation", label: "Negotiation" },
  { id: "Won", label: "Won" },
  { id: "Lost", label: "Lost" },
];

function normalizeStage(backendStage) {
  if (!backendStage) return "New";
  const s = String(backendStage).trim();
  if (PIPELINE_STAGES.some((st) => st.id === s)) return s;
  if (/won|closed won/i.test(s)) return "Won";
  if (/lost|closed lost/i.test(s)) return "Lost";
  if (/qualified/i.test(s)) return "Proposal";
  if (/proposal|proposition/i.test(s)) return "Proposal";
  if (/negotiation/i.test(s)) return "Negotiation";
  return "New";
}

const DealPipeline = ({ deals, onEdit, onMove, onAddTask, onViewDeal }) => {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dealsByStage = useMemo(() => {
    const map = {};
    PIPELINE_STAGES.forEach((s) => {
      map[s.id] = [];
    });
    (deals || []).forEach((d) => {
      const key = normalizeStage(d.stage);
      if (map[key]) map[key].push(d);
      else map.New.push(d);
    });
    return map;
  }, [deals]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const getStageFromOver = (overId) => {
    const stage = PIPELINE_STAGES.find((s) => s.id === overId);
    if (stage) return stage.id;
    const deal = (deals || []).find((d) => String(d._id) === String(overId));
    return deal ? normalizeStage(deal.stage) : null;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !onMove) return;

    const dealId = active.id;
    const toStage = getStageFromOver(over.id);
    const activeDeal = (deals || []).find((d) => String(d._id) === String(dealId));
    if (activeDeal && toStage && normalizeStage(activeDeal.stage) !== toStage) {
      onMove(dealId, toStage);
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
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[520px] scrollbar-thin">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stageId={stage.id}
            stageLabel={stage.label}
            deals={dealsByStage[stage.id] || []}
            onEdit={onEdit}
            onAddTask={onAddTask}
            onViewDeal={onViewDeal}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: 0.95 } },
          }),
        }}
      >
        {activeDeal ? (
          <div className="w-[268px] bg-white rounded-xl shadow-lg p-3 border border-gray-200 opacity-95">
            <h4 className="text-sm font-medium text-gray-800 truncate">
              {activeDeal.title || "Untitled"}
            </h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {activeDeal.companyId?.name || activeDeal.leadId?.companyName || "—"}
            </p>
            <p className="text-xs font-medium text-indigo-600 mt-2">
              ₹{Number(activeDeal.value || 0).toLocaleString("en-IN")}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DealPipeline;
