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
import { FiClock, FiCheckCircle, FiAlertCircle, FiUser, FiCalendar } from "react-icons/fi";

const taskStages = [
    { id: "Pending", label: "To Do", color: "bg-gray-400" },
    { id: "In Progress", label: "Doing", color: "bg-sky-500" },
    { id: "Completed", label: "Done", color: "bg-emerald-500" },
    { id: "Cancelled", label: "Cancelled", color: "bg-red-400 opacity-60" },
];

const SortableTask = ({ id, task, onUpdateStatus, color }) => {
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
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-black text-gray-900 tracking-tight leading-4 pr-2">{task.title}</h4>
                <div className="flex items-center gap-1 shrink-0 text-gray-300">
                    <FiClock size={12} />
                    <span className="text-[9px] font-black">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-lg font-black group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    {task.leadId?.name?.charAt(0) || <FiUser size={14} />}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none truncate max-w-[150px]">
                        {task.leadId?.name || "Independent"}
                    </p>
                    <p className="text-[9px] font-black text-gray-300 uppercase truncate max-w-[120px] mt-1">
                        {task.leadId?.companyName || "No Company"}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
                {task.priority && (
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${task.priority === 'High' ? 'bg-red-500 text-white' :
                        task.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                        {task.priority}
                    </span>
                )}
                <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                    <FiCalendar size={10} /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}
                </span>
            </div>
        </div>
    );
};

const Column = ({ id, label, color, tasks, onUpdateStatus }) => {
    return (
        <div className="flex-shrink-0 w-72 flex flex-col gap-3">
            <div className="px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">{label}</h3>
                <span className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">{tasks.length}</span>
            </div>

            <SortableContext id={id} items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-4 min-h-[400px]">
                    {tasks.map((task) => (
                        <SortableTask key={task._id} id={task._id} task={task} onUpdateStatus={onUpdateStatus} color={color} />
                    ))}
                    {tasks.length === 0 && (
                        <div className="h-32 border-2 border-dashed border-gray-100 bg-gray-50/50 rounded-2xl flex items-center justify-center">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">No Tasks</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

const TaskKanban = ({ tasks, onUpdateStatus }) => {
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
        const overStage = taskStages.find(s => s.id === overId) || taskStages.find(s => tasks.find(t => t._id === overId)?.status === s.id);
        const activeTask = tasks.find(t => t._id === activeId);

        if (activeTask && overStage && activeTask.status !== overStage.id) {
            onUpdateStatus(activeId, overStage.id);
        }
    };

    const handleDragEnd = (event) => {
        setActiveId(null);
    };

    const getStageTasks = (stageId) => tasks.filter(t => (t.status || "Pending") === stageId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 overflow-x-auto pb-10 min-h-[600px] scrollbar-hide px-2">
                {taskStages.map((stage) => (
                    <Column
                        key={stage.id}
                        id={stage.id}
                        label={stage.label}
                        color={stage.color}
                        tasks={getStageTasks(stage.id)}
                        onUpdateStatus={onUpdateStatus}
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
                    <div className="bg-white p-5 rounded-2xl border border-blue-500 shadow-2xl opacity-90 scale-105 rotate-2">
                        <h4 className="font-black text-gray-900 pr-6">{tasks.find(t => t._id === activeId)?.title}</h4>
                        <div className="mt-4 flex items-center justify-between text-blue-600 font-black">
                            <span className="text-[10px] uppercase tracking-widest">{tasks.find(t => t._id === activeId)?.leadId?.name}</span>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default TaskKanban;
