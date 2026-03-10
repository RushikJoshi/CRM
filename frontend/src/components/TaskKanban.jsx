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
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'bg-red-50 text-red-500' :
                        task.priority === 'Medium' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                        {task.priority}
                    </span>
                )}
            </div>
        </div>
    );
};

const Column = ({ id, label, color, tasks, onUpdateStatus }) => {
    return (
        <div className="flex-shrink-0 w-80 flex flex-col gap-4 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
                    <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-[0.2em]">{label}</h3>
                    <span className="ml-1 px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 text-[9px] font-black rounded-lg">{tasks.length}</span>
                </div>
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
