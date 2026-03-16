import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiMessageCircle, FiClock, FiFileText, FiCheckCircle } from "react-icons/fi";
import API from "../services/api";
import ActivityTimeline from "../components/ActivityTimeline";
import NotesSection from "../components/NotesSection";
import TasksSection from "../components/TasksSection";
import SendMessageModal from "../components/SendMessageModal";
import ConvertLeadWizard from "../components/ConvertLeadWizard";
import { useToast } from "../context/ToastContext";

const STAGE_LABELS = {
  new_lead: "New Lead",
  attempted_contact: "Attempted Contact",
  contacted: "Contacted",
  qualified: "Qualified",
  prospect: "Prospect",
  won: "Won",
  lost: "Lost",
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const formatDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");
  const [showMsg, setShowMsg] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    API.get(`/leads/${id}`)
      .then((res) => setLead(res.data?.data || res.data))
      .catch(() => toast.error("Failed to load lead"))
      .finally(() => setLoading(false));
  }, [id]);

  const refetchLead = async () => {
    try {
      const res = await API.get(`/leads/${id}`);
      setLead(res.data?.data || res.data);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading lead...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4">
          <FiArrowLeft size={18} /> Back
        </button>
        <p className="text-gray-500">Lead not found.</p>
      </div>
    );
  }

  const stageLabel =
    lead.stage != null && typeof lead.stage === "string"
      ? (STAGE_LABELS[lead.stage] || lead.stage.replace(/_/g, " "))
      : null;
  const statusDisplay = stageLabel || lead.status?.name || lead.status || "New";

  const infoRows = [
    { label: "Phone", value: lead.phone },
    { label: "Email", value: lead.email },
    { label: "Company", value: lead.companyName },
    { label: "Industry", value: lead.industry },
    { label: "Status", value: lead.status },
    { label: "Stage", value: statusDisplay },
    { label: "Source", value: lead.source || lead.sourceId?.name },
    { label: "Value", value: lead.value != null ? `₹${Number(lead.value).toLocaleString("en-IN")}` : null },
    { label: "Score", value: lead.score },
    { label: "Priority", value: lead.priority },
    { label: "City", value: lead.city },
    { label: "Address", value: lead.address },
    { label: "Course", value: lead.course },
    { label: "Location", value: lead.location },
    { label: "Inquiry Status", value: lead.inquiryStatus },
    { label: "Assigned To", value: lead.assignedTo?.name },
    { label: "Branch", value: lead.branchId?.name },
    { label: "Created By", value: lead.createdBy?.name },
    { label: "Created At", value: formatDateTime(lead.createdAt) },
    { label: "Updated At", value: formatDateTime(lead.updatedAt) },
    { label: "Stage Updated", value: formatDateTime(lead.stageUpdatedAt) },
    { label: "Converted", value: lead.isConverted ? "Yes" : "No" },
    { label: "Converted At", value: lead.convertedAt ? formatDate(lead.convertedAt) : "—" },
    { label: "Notes", value: lead.notes },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F8FAFC] overflow-hidden">
      {/* Compact header: Back + title + status + WhatsApp */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft size={18} />
            Back
          </button>
          <h1 className="text-xl font-black text-gray-900 truncate">{lead.name}</h1>
          <span className="shrink-0 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold uppercase">
            {statusDisplay}
          </span>
          <span className="text-[10px] text-gray-400 uppercase font-bold truncate">{lead.companyName || "Individual"}</span>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => setShowConvert(true)}
            disabled={lead?.isConverted}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs uppercase"
          >
            Convert
          </button>
          <button
            onClick={() => setShowMsg(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 hover:bg-green-100 text-green-600 rounded-lg font-bold text-xs uppercase"
          >
            <FiMessageCircle size={14} /> WhatsApp
          </button>
        </div>
      </div>

      {/* Main: two columns, full height, no max-width */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Left: full lead info - dense grid, scrollable */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col border-r border-gray-100 bg-white overflow-hidden">
          <div className="shrink-0 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <FiInfo className="text-green-500" size={14} />
            <h2 className="font-black text-gray-900 uppercase tracking-wider text-[11px]">Lead Info</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {infoRows.map(({ label, value }) => {
                const v = value ?? "—";
                const isLong = typeof v === "string" && v.length > 40;
                return (
                  <div key={label} className={isLong ? "sm:col-span-2" : ""}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{v}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: tabs + content */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
          <div className="shrink-0 flex border-b border-gray-200 bg-white px-4 gap-4">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-3 font-bold text-[10px] uppercase tracking-wider border-b-2 flex items-center gap-2 -mb-px ${
                activeTab === "timeline" ? "border-green-500 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiClock size={14} /> Activity
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-3 font-bold text-[10px] uppercase tracking-wider border-b-2 flex items-center gap-2 -mb-px ${
                activeTab === "notes" ? "border-green-500 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiFileText size={14} /> Notes
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-3 font-bold text-[10px] uppercase tracking-wider border-b-2 flex items-center gap-2 -mb-px ${
                activeTab === "tasks" ? "border-green-500 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiCheckCircle size={14} className={activeTab === "tasks" ? "text-green-500" : "text-gray-400"} /> Tasks
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "timeline" && <ActivityTimeline leadId={lead._id} pageSize={8} />}
            {activeTab === "notes" && <NotesSection leadId={lead._id} pageSize={8} />}
            {activeTab === "tasks" && <TasksSection leadId={lead._id} pageSize={8} />}
          </div>
        </div>
      </div>

      {showMsg && (
        <SendMessageModal
          isOpen={showMsg}
          onClose={() => setShowMsg(false)}
          recipientNumber={lead.phone}
          leadId={lead._id}
        />
      )}

      <ConvertLeadWizard
        isOpen={showConvert}
        onClose={() => setShowConvert(false)}
        lead={lead}
        onConverted={() => refetchLead()}
      />
    </div>
  );
}
