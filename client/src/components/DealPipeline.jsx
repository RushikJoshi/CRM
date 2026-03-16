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
    useDroppable,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiMoreVertical, FiUser, FiMenu, FiCalendar, FiEdit2, FiTrendingUp } from "react-icons/fi";

const stages = [
    { id: "New", label: "New Deals", color: "bg-gray-400 border-gray-500" },
    { id: "Qualified", label: "Qualified", color: "bg-sky-400 border-sky-500" },
    { id: "Proposal", label: "Proposal", color: "bg-sky-500 border-sky-600" },
    { id: "Negotiation", label: "Negotiation", color: "bg-indigo-400 border-indigo-500 shadow-lg shadow-indigo-500/10" },
    { id: "Closed Won", label: "Won", color: "bg-emerald-500 border-emerald-600 shadow-lg shadow-emerald-500/20" },
    { id: "Closed Lost", label: "Lost", color: "bg-red-400 border-red-500 opacity-60" },
];

const SortableItem = ({ id, deal, onEdit, onAddTask, onView, color }) => {
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
            className="bg-white p-6 rounded-[24px] border border-[#E5EAF2] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden hover:-translate-y-1 duration-300"
        >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${color.split(' ')[0]} opacity-70 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-start gap-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="shrink-0 mt-0.5 p-1.5 rounded-lg text-[#CBD5E0] hover:text-blue-600 hover:bg-blue-50 cursor-grab active:cursor-grabbing touch-none"
                    aria-label="Drag to move"
                >
                    <FiMenu size={16} />
                </div>
                <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={onView ? () => onView(deal) : undefined}
                    onKeyDown={onView ? (e) => e.key === "Enter" && onView(deal) : undefined}
                    role={onView ? "button" : undefined}
                    tabIndex={onView ? 0 : undefined}
                >
                    <div className="flex justify-between items-start mb-6">
                        <h4 className="font-black text-[#1A202C] tracking-tight leading-tight pr-6 group-hover:text-blue-600 transition-colors uppercase text-[12px]">{deal.title}</h4>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onAddTask?.(deal); }}
                                className="p-2 text-[#CBD5E0] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Add Task"
                            >
                                <FiCalendar size={16} />
                            </button>
                            <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}
                                className="p-2 text-[#CBD5E0] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Edit Deal"
                            >
                                <FiMoreVertical size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#F4F7FB] border border-[#E5EAF2] flex items-center justify-center text-[#718096] text-lg font-black group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-700 transition-all duration-500 shadow-sm">
                            {deal.assignedTo?.name?.charAt(0) || <FiUser size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-[#1A202C] uppercase tracking-widest leading-none mb-1">{deal.assignedTo?.name || "Unassigned"}</p>
                            <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest truncate">{deal.companyId?.name || "Global Scope"}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#F0F2F5]">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1 leading-none">Deal Value</span>
                            <div className="flex items-center text-blue-600 font-black text-sm tracking-tight">
                                <span className="mr-1 text-[11px] opacity-60">₹</span>
                                {Number(deal.value || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Column = ({ id, label, color, deals, onEdit, onAddTask, onViewDeal }) => {
    const { setNodeRef, isOver } = useDroppable({ id, data: { type: "stage", stageId: id } });
    return (
        <div className="flex-shrink-0 w-80 flex flex-col gap-6 animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="px-6 py-5 bg-white rounded-[24px] border border-[#E5EAF2] shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all duration-500">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color.split(' ')[0]} shadow-lg`} />
                    <div className="flex flex-col">
                        <h3 className="font-black text-[#1A202C] text-[10px] uppercase tracking-[0.25em]">{label}</h3>
                        <span className="text-[9px] font-black text-[#A0AEC0] mt-0.5 tracking-widest">{deals.length} DEALS</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-blue-600 text-sm tracking-tight">
                        ₹{deals.reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 space-y-6 min-h-[400px] rounded-2xl transition-colors ${isOver ? "ring-2 ring-blue-400 ring-offset-2 bg-blue-50/30" : ""}`}
            >
            <SortableContext id={id} items={deals.map(d => d._id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-6 min-h-[380px]">
                    {deals.map((deal) => (
                        <SortableItem key={deal._id} id={deal._id} deal={deal} onEdit={onEdit} onAddTask={onAddTask} onView={onViewDeal} color={color} />
                    ))}
                    {deals.length === 0 && (
                        <div className="h-40 border-2 border-dashed border-[#E5EAF2] bg-[#F4F7FB]/50 rounded-[32px] flex items-center justify-center group hover:bg-white hover:border-blue-200 transition-all duration-700">
                            <p className="text-[10px] font-black text-[#CBD5E0] uppercase tracking-[0.3em] group-hover:text-blue-300 transition-colors">No Deals</p>
                        </div>
                    )}
                </div>
            </SortableContext>
            </div>
        </div>
    );
};

const DealPipeline = ({ deals, onEdit, onMove, onAddTask, onViewDeal }) => {
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragOver = () => {};

    const getStageFromOverId = (overId) => {
        const byStage = stages.find((s) => s.id === overId);
        if (byStage) return byStage;
        const dealOver = deals.find((d) => String(d._id) === String(overId));
        return dealOver ? stages.find((s) => s.id === dealOver.stage) : null;
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || !onMove) return;

        const activeId = active.id;
        const overId = over.id;
        const overStage = getStageFromOverId(overId);
        const activeDeal = deals.find((d) => String(d._id) === String(activeId));

        if (activeDeal && overStage && activeDeal.stage !== overStage.id) {
            onMove(activeId, overStage.id);
        }
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
                        onAddTask={onAddTask}
                        onViewDeal={onViewDeal}
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
                    <div className="bg-white p-8 rounded-[32px] border-2 border-blue-500 shadow-2xl scale-105 rotate-3 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="font-black text-[#1A202C] text-[12px] uppercase tracking-tight pr-6">{deals.find(d => d._id === activeId)?.title}</h4>
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                <FiTrendingUp size={14} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[#F0F2F5]">
                            <div className="flex items-center text-blue-600 font-black text-lg tracking-tight">
                                <span className="mr-1 text-sm opacity-60">₹</span>
                                {Number(deals.find(d => d._id === activeId)?.value).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

        </DndContext>
    );
};

export default DealPipeline;
