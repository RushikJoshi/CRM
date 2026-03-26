import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FiTrendingUp, FiPlus, FiRefreshCw, FiSettings } from "react-icons/fi";
import { motion } from "framer-motion";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import LeadPipelineColumn from "./LeadPipelineColumn";
import LeadPipelineCard from "./LeadPipelineCard";
import ConvertLeadModal from "../ConvertLeadModal";
import { getCurrentUser } from "../../context/AuthContext";

export default function LeadPipelineBoard() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  const basePath = location.pathname.startsWith("/company") ? "/company" : location.pathname.startsWith("/branch") ? "/branch" : "/sales";
  const user = getCurrentUser();
  const canManagePipeline = user?.role === "company_admin" && basePath === "/company";

  const [pipeline, setPipeline] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState(null);
  const [pendingWonLead, setPendingWonLead] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get("/leads/pipeline");
      if (res.data?.success) {
        setPipeline(res.data.pipeline);
        setLeads(res.data.leads || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load lead pipeline.");
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onDragStart = useCallback(
    (event) => {
      const leadId = event.active?.id;
      const l = leads.find(item => String(item._id) === String(leadId));
      setActiveLead(l);
    },
    [leads]
  );

  const grouped = useMemo(() => {
    if (!pipeline?.stages || !leads) return null;
    const map = {};
    pipeline.stages.forEach(s => {
      map[s.name] = [];
    });
    leads.forEach(l => {
      const sName = l.stage || "New";
      const match = pipeline.stages.find(s => 
        s.name.toLowerCase() === sName.toLowerCase() || 
        s._id === sName
      );
      const key = match ? match.name : (pipeline.stages[0]?.name || "New");
      if (map[key]) map[key].push(l);
    });
    return map;
  }, [pipeline, leads]);

  const findLead = useCallback(
    (leadId) => leads?.find(l => String(l._id) === String(leadId)),
    [leads]
  );

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
      if (!over) {
        setActiveLead(null);
        return;
      }

      const leadId = active.id;
      const lead = findLead(leadId);
      setActiveLead(null);

      const overType = over.data?.current?.type;
      const overId = over.id;
      const overLead = over.data?.current?.lead;
      
      // LOGIC: If we drop on a column, overId is the stage name.
      // If we drop on a card, overLead.stage contains the stage name.
      const targetStage = overType === "stage" ? overId : overLead?.stage;
      
      if (!targetStage || targetStage === lead?.stage) return;

      // Update local state for immediate feedback
      setLeads(prev => prev.map(l => String(l._id) === String(leadId) ? { ...l, stage: targetStage } : l));

      if (targetStage.toLowerCase() === "won") {
        setPendingWonLead({ leadId, lead });
        return;
      }

      try {
        await API.patch(`/leads/${leadId}/stage`, { status: targetStage });
      } catch (e) {
        console.error("DRAG ERROR:", e);
        const msg = e.response?.data?.message || e.message || "Failed to move lead.";
        toast.error(`${msg} Reverting.`);
        await fetchData();
      }
    },
    [findLead, fetchData, toast]
  );

  const handleConvertLead = useCallback(
    async (lead) => {
      if (!lead?._id) return;
      setConvertLoading(true);
      try {
        await API.post(`/leads/${lead._id}/convert`);
        toast.success("Lead converted to Deal & Customer.");
        setPendingWonLead(null);
        await fetchData();
      } catch (e) {
        console.error(e);
        toast.error(e.response?.data?.message || "Failed to convert lead.");
      } finally {
        setConvertLoading(false);
      }
    },
    [fetchData, toast]
  );

  const handleJustMarkWon = useCallback(
    async (lead) => {
      if (!lead?._id) return;
      setConvertLoading(true);
      try {
        await API.patch(`/leads/${lead._id}/stage`, { status: "won" });
        toast.success("Lead marked as Won.");
        setPendingWonLead(null);
        await fetchData();
      } catch (e) {
        console.error(e);
        toast.error("Failed to update. Reverting.");
        await fetchData();
        setPendingWonLead(null);
      } finally {
        setConvertLoading(false);
      }
    },
    [fetchData, toast]
  );

  const handleCloseConvertModal = useCallback(() => {
    if (convertLoading) return;
    setPendingWonLead(null);
    fetchData();
  }, [convertLoading, fetchData]);

  if (loading && !pipeline) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--border)] rounded-md animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => <div key={i} className="flex-1 min-w-[240px] h-[500px] bg-[var(--surface2)] rounded-[var(--r-md)] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
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
          className="flex-1 flex flex-nowrap overflow-x-auto no-scrollbar gap-3 pb-2"
        >
          {/* RENDER ALL STAGES DYNAMICALLY FROM DB */}
          {pipeline?.stages?.map((stage) => (
            <LeadPipelineColumn
              key={stage.name}
              stageKey={stage.name}
              color={stage.color}
              leads={grouped ? (grouped[stage.name] || []) : []}
              onViewLead={(lead) => lead?._id && navigate(`${basePath}/leads/${lead._id}`)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeLead && activeLead._id != null ? (
            <LeadPipelineCard lead={activeLead} isOverlay />
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
