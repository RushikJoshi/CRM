import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiClock, FiFileText, FiCheckCircle } from "react-icons/fi";
import API from "../services/api";
import ActivityTimeline from "../components/ActivityTimeline";
import NotesSection from "../components/NotesSection";
import TasksSection from "../components/TasksSection";
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

  const primaryInfo = [
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
  ];

  const additionalInfo = [
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

  const InfoTable = ({ rows, title }) => (
    <div className="flex flex-col min-w-0 flex-1">
      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1.5 border-b border-slate-100 bg-slate-50/80">
        {title}
      </h3>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(({ label, value }) => {
            const v = value ?? "—";
            return (
              <tr key={label} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="py-1 px-2 text-[9px] font-medium text-slate-500 uppercase tracking-wider w-[36%] align-top whitespace-nowrap">
                  {label}
                </td>
                <td className="py-1 px-2 text-[11px] font-medium text-slate-800 break-words align-top">
                  {v}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <FiArrowLeft size={18} />
            Back
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{lead.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{lead.companyName || "Individual"}</p>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            {statusDisplay}
          </span>
        </div>
      </div>

      {/* Main: Lead Info table (full width) + Activity/Notes/Tasks */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Left: Lead Info — small compact panel */}
        <div className="w-full lg:max-w-[380px] xl:max-w-[400px] flex flex-col border-r border-slate-200 bg-white overflow-hidden shadow-sm shrink-0">
          <div className="shrink-0 px-2 py-2 border-b border-slate-200 bg-slate-50/80 flex items-center gap-1.5">
            <FiInfo className="text-emerald-500" size={14} />
            <h2 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Lead Info</h2>
          </div>
          <div className="flex-1 overflow-auto flex flex-col min-h-0">
            <div className="min-w-0 border-b border-slate-100">
              <InfoTable rows={primaryInfo} title="Contact & Basic" />
            </div>
            <div className="min-w-0">
              <InfoTable rows={additionalInfo} title="Assignment & Additional" />
            </div>
          </div>
        </div>

        {/* Right: Activity / Notes / Tasks */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <div className="shrink-0 flex border-b border-slate-200 bg-white px-6 gap-1">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50/50"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <FiClock size={14} /> Activity
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === "notes"
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50/50"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <FiFileText size={14} /> Notes
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === "tasks"
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50/50"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <FiCheckCircle size={14} className={activeTab === "tasks" ? "text-emerald-500" : "text-slate-400"} /> Tasks
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "timeline" && <ActivityTimeline leadId={lead._id} pageSize={8} />}
            {activeTab === "notes" && <NotesSection leadId={lead._id} pageSize={8} />}
            {activeTab === "tasks" && <TasksSection leadId={lead._id} pageSize={8} />}
          </div>
        </div>
      </div>

    </div>
  );
}
