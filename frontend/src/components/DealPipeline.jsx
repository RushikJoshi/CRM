import React, { useState } from "react";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiMoreVertical, FiUser, FiMoreHorizontal } from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

const stages = [
    { id: "New", label: "New Inquiry", color: "bg-gray-400" },
    { id: "Qualified", label: "Qualified", color: "bg-emerald-400" },
    { id: "Proposal", label: "Proposal", color: "bg-green-400" },
    { id: "Negotiation", label: "Negotiation", color: "bg-emerald-600" },
    { id: "Closed Won", label: "Closed Won", color: "bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.4)]" },
    { id: "Closed Lost", label: "Closed Lost", color: "bg-red-400 opacity-60" },
];

const SortableItem = ({ id, deal, onEdit, color }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing"
        >
            <div className={`absolute top-0 left-0 w-1 h-full ${color} opacity-80`} />
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-black text-gray-900 tracking-tight leading-4 pr-6">{deal.title}</h4>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onEdit(deal)}
                    className="p-1.5 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"
                >
                    <FiMoreVertical size={14} />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-lg font-black group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
                    {deal.assignedTo?.name?.charAt(0) || <FiUser size={14} />}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{deal.assignedTo?.name || "Unassigned"}</p>
                    <p className="text-[9px] font-black text-gray-300 uppercase truncate max-w-[120px] mt-1">{deal.companyId?.name || "Global"}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center text-green-600 font-black text-sm">
                    <span className="mr-0.5 text-[10px]">₹</span>
                    {Number(deal.value).toLocaleString('en-IN')}
                </div>
            </div>
        </div>
    );
};

const Column = ({ id, label, color, deals, onEdit }) => {
    return (
        <div className="flex-shrink-0 w-80 flex flex-col gap-4 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
                    <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-[0.2em]">{label}</h3>
                    <span className="ml-1 px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 text-[9px] font-black rounded-lg">{deals.length}</span>
                </div>
                <p className="font-black text-gray-900 text-xs">
                    ₹{deals.reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString('en-IN')}
                </p>
            </div>

            <SortableContext id={id} items={deals.map(d => d._id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-4 min-h-[300px]">
                    {deals.map((deal) => (
                        <SortableItem key={deal._id} id={deal._id} deal={deal} onEdit={onEdit} color={color} />
                    ))}
                    {deals.length === 0 && (
                        <div className="h-32 border-2 border-dashed border-gray-100 bg-gray-50/50 rounded-2xl flex items-center justify-center">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Zone Cleared</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

const DealPipeline = ({ deals, onEdit, onMove }) => {
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find which stage the "over" target belongs to
        const overStage = stages.find(s => s.id === overId) || stages.find(s => deals.find(d => d._id === overId)?.stage === s.id);
        const activeDeal = deals.find(d => d._id === activeId);

        if (activeDeal && overStage && activeDeal.stage !== overStage.id) {
            onMove(activeId, overStage.id);
        }
    };

    const handleDragEnd = (event) => {
        setActiveId(null);
    };

    const getStageDeals = (stageId) => deals.filter(d => d.stage === stageId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 overflow-x-auto pb-10 min-h-[600px] scrollbar-hide px-2">
                {stages.map((stage) => (
                    <Column
                        key={stage.id}
                        id={stage.id}
                        label={stage.label}
                        color={stage.color}
                        deals={getStageDeals(stage.id)}
                        onEdit={onEdit}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.0',
                        },
                    },
                }),
            }}>
                {activeId ? (
                    <div className="bg-white p-5 rounded-2xl border border-green-500 shadow-2xl opacity-90 scale-105 rotate-2">
                        <h4 className="font-black text-gray-900 pr-6">{deals.find(d => d._id === activeId)?.title}</h4>
                        <div className="mt-4 flex items-center justify-between text-green-600 font-black">
                            <span>₹{Number(deals.find(d => d._id === activeId)?.value).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default DealPipeline;
