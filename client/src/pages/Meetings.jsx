import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiCopy,
  FiEdit2,
  FiExternalLink,
  FiFilter,
  FiLink,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
  FiVideo,
  FiX,
} from "react-icons/fi";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Pagination from "../components/Pagination";

const STATUS_OPTIONS = ["ALL", "Scheduled", "Confirmed", "In Progress", "Completed", "Cancelled", "Missed", "Closed"];
const MEETING_TYPES = ["Consultation", "Follow-up", "Demo", "Interview", "Support", "Other"];
const ATTENDANCE_OPTIONS = [
  { value: "online", label: "Online", icon: FiVideo },
  { value: "offline", label: "Offline", icon: FiMapPin },
  { value: "phone", label: "Phone", icon: FiMessageCircle },
  { value: "hybrid", label: "Hybrid", icon: FiUsers },
  { value: "in_person", label: "In Person", icon: FiUser },
];
const REMINDER_OPTIONS = [15, 30, 60, 120, 1440];
const PAGE_SIZE = 20;

const emptyForm = {
  title: "",
  description: "",
  notes: "",
  startDate: "",
  endDate: "",
  meetingType: "Consultation",
  attendanceMode: "online",
  location: "",
  meetingLink: "",
  status: "Scheduled",
  assignedTo: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  sendSystemReminder: true,
  sendEmailReminder: false,
  reminderMinutes: [30],
  leadId: "",
  inquiryId: "",
};

const formatDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const plusMinutes = (value, minutes) => {
  const date = value ? new Date(value) : new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return formatDateTimeLocal(date);
};

const buildFormFromMeeting = (meeting = {}) => ({
  title: meeting.title || "",
  description: meeting.description || "",
  notes: meeting.notes || "",
  startDate: formatDateTimeLocal(meeting.startDate),
  endDate: formatDateTimeLocal(meeting.endDate),
  meetingType: meeting.meetingType || "Consultation",
  attendanceMode: meeting.attendanceMode || meeting.channel || "online",
  location: meeting.location || "",
  meetingLink: meeting.meetingLink || meeting.onlineUrl || "",
  status: meeting.status || "Scheduled",
  assignedTo: meeting.assignedTo?._id || meeting.assignedTo || "",
  contactName: meeting.contactName || meeting.leadId?.name || meeting.inquiryId?.name || "",
  contactEmail: meeting.contactEmail || meeting.leadId?.email || meeting.inquiryId?.email || "",
  contactPhone: meeting.contactPhone || meeting.leadId?.phone || meeting.inquiryId?.phone || "",
  sendSystemReminder: meeting.sendSystemReminder !== false,
  sendEmailReminder: !!meeting.sendEmailReminder,
  reminderMinutes: Array.isArray(meeting.reminderMinutes) && meeting.reminderMinutes.length ? meeting.reminderMinutes : [30],
  leadId: meeting.leadId?._id || meeting.leadId || "",
  inquiryId: meeting.inquiryId?._id || meeting.inquiryId || "",
});

const buildFormFromPrefill = (prefill = {}, currentUser = null) => {
  const startDate = prefill.startDate || plusMinutes(new Date(), 30);
  return {
    ...emptyForm,
    ...prefill,
    title: prefill.title || (prefill.contactName ? `${prefill.contactName} Meeting` : "New Meeting"),
    startDate,
    endDate: prefill.endDate || plusMinutes(startDate, 30),
    assignedTo: prefill.assignedTo || currentUser?.id || "",
    status: prefill.status || "Scheduled",
    meetingType: prefill.meetingType || "Consultation",
    attendanceMode: prefill.attendanceMode || "online",
    reminderMinutes: Array.isArray(prefill.reminderMinutes) && prefill.reminderMinutes.length ? prefill.reminderMinutes : [30],
    sendSystemReminder: prefill.sendSystemReminder !== false,
    sendEmailReminder: !!prefill.sendEmailReminder,
  };
};

const getMeetingModeLabel = (meeting) => {
  const mode = meeting.attendanceMode || meeting.channel || "online";
  const option = ATTENDANCE_OPTIONS.find((item) => item.value === mode);
  return option?.label || mode;
};

const getMeetingVenue = (meeting) => {
  const mode = meeting.attendanceMode || meeting.channel || "online";
  if (mode === "online") return meeting.meetingLink || meeting.onlineUrl || "Add online link";
  if (mode === "hybrid") return [meeting.meetingLink || meeting.onlineUrl, meeting.location].filter(Boolean).join(" | ") || "Add link and location";
  if (mode === "phone") return meeting.contactPhone || "Phone call";
  return meeting.location || "Add meeting location";
};

const getStatusClasses = (status) => {
  if (status === "Completed") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === "Cancelled" || status === "Missed") return "bg-rose-50 text-rose-600 border-rose-100";
  if (status === "In Progress") return "bg-amber-50 text-amber-600 border-amber-100";
  if (status === "Confirmed") return "bg-indigo-50 text-indigo-600 border-indigo-100";
  return "bg-sky-50 text-sky-600 border-sky-100";
};

export default function MeetingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const currentUser = getCurrentUser();
  const prefillConsumed = useRef(false);

  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [formData, setFormData] = useState({
    ...emptyForm,
    assignedTo: currentUser?.id || "",
    startDate: plusMinutes(new Date(), 30),
    endDate: plusMinutes(new Date(), 60),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const roleBase = currentUser?.role === "super_admin"
    ? "/superadmin"
    : currentUser?.role === "branch_manager"
      ? "/branch"
      : currentUser?.role === "sales"
        ? "/sales"
        : "/company";

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/crm/meetings", {
        params: {
          search,
          status: statusFilter,
          attendanceMode: modeFilter,
          page,
          limit: PAGE_SIZE,
        },
      });
      setMeetings(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  }, [modeFilter, page, search, statusFilter, toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await API.get("/users/assignable");
      setUsers(res.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, modeFilter]);

  useEffect(() => {
    const prefillMeeting = location.state?.prefillMeeting;
    if (!prefillMeeting || prefillConsumed.current) return;

    prefillConsumed.current = true;
    setEditingMeeting(null);
    setFormData(buildFormFromPrefill(prefillMeeting, currentUser));
    setShowModal(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [currentUser, location.pathname, location.state, navigate]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayIso = now.toDateString();
    return {
      scheduled: meetings.filter((meeting) => ["Scheduled", "Confirmed", "In Progress"].includes(meeting.status)).length,
      online: meetings.filter((meeting) => ["online", "hybrid"].includes(meeting.attendanceMode || meeting.channel)).length,
      today: meetings.filter((meeting) => new Date(meeting.startDate).toDateString() === todayIso).length,
      reminders: meetings.filter((meeting) => meeting.reminderMinutes?.length).length,
    };
  }, [meetings]);

  const resetComposer = () => {
    setEditingMeeting(null);
    setFormData({
      ...emptyForm,
      assignedTo: currentUser?.id || "",
      startDate: plusMinutes(new Date(), 30),
      endDate: plusMinutes(new Date(), 60),
    });
  };

  const openCreateModal = () => {
    resetComposer();
    setShowModal(true);
  };

  const openEditModal = (meeting) => {
    setEditingMeeting(meeting);
    setFormData(buildFormFromMeeting(meeting));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetComposer();
  };

  const toggleReminderMinute = (minute) => {
    setFormData((prev) => {
      const next = prev.reminderMinutes.includes(minute)
        ? prev.reminderMinutes.filter((value) => value !== minute)
        : [...prev.reminderMinutes, minute];
      return {
        ...prev,
        reminderMinutes: next.sort((a, b) => a - b),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Meeting title is required.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please set both start and end time.");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("Meeting end time must be after the start time.");
      return;
    }

    if (["online", "hybrid"].includes(formData.attendanceMode) && !formData.meetingLink.trim()) {
      toast.error("Please add the meeting link for online or hybrid meetings.");
      return;
    }

    if (["offline", "in_person", "hybrid"].includes(formData.attendanceMode) && !formData.location.trim()) {
      toast.error("Please add the meeting location.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        channel: formData.attendanceMode,
        onlineUrl: formData.meetingLink,
      };

      if (editingMeeting?._id) {
        await API.put(`/crm/meetings/${editingMeeting._id}`, payload);
        toast.success("Meeting updated.");
      } else {
        await API.post("/crm/meetings", payload);
        toast.success("Meeting scheduled.");
      }

      closeModal();
      fetchMeetings();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save meeting.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingMeeting?._id) return;
    if (!window.confirm("Delete this meeting?")) return;

    try {
      await API.delete(`/crm/meetings/${editingMeeting._id}`);
      toast.success("Meeting deleted.");
      closeModal();
      fetchMeetings();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete meeting.");
    }
  };

  const handleCopyShare = async (meeting) => {
    const message = meeting.shareMessage || [
      `Meeting: ${meeting.title}`,
      `When: ${new Date(meeting.startDate).toLocaleString("en-IN")}`,
      `Mode: ${getMeetingModeLabel(meeting)}`,
      `Link/Location: ${getMeetingVenue(meeting)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(message);
      toast.success("Meeting details copied.");
    } catch (error) {
      console.error(error);
      toast.error("Could not copy meeting details.");
    }
  };

  const handleShareEmail = (meeting) => {
    const subject = encodeURIComponent(`Meeting invite: ${meeting.title}`);
    const body = encodeURIComponent(meeting.shareMessage || "");
    window.open(`mailto:${meeting.contactEmail || ""}?subject=${subject}&body=${body}`, "_blank");
  };

  const handleShareWhatsapp = (meeting) => {
    const text = encodeURIComponent(meeting.shareMessage || "");
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleOpenLink = (meeting) => {
    const url = meeting.meetingLink || meeting.onlineUrl;
    if (!url) {
      toast.error("No meeting link added yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-6 pb-20 space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-600">
              <FiCalendar size={22} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Meetings</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Complete Meeting Module</h1>
              <p className="text-sm md:text-base font-medium text-slate-500 max-w-3xl mt-2">
                Create online, offline, phone, or hybrid meetings with reminders, sharing links, assignees, and contact details in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`${roleBase}/calendar`)}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
            >
              Calendar View
            </button>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <FiPlus size={16} />
              Create Meeting
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Active Meetings", value: stats.scheduled, icon: FiCalendar, tint: "text-indigo-600 bg-indigo-50" },
            { label: "Online or Hybrid", value: stats.online, icon: FiVideo, tint: "text-sky-600 bg-sky-50" },
            { label: "Today", value: stats.today, icon: FiClock, tint: "text-emerald-600 bg-emerald-50" },
            { label: "With Reminders", value: stats.reminders, icon: FiRefreshCw, tint: "text-amber-600 bg-amber-50" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.tint}`}>
                  <Icon size={20} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-5">{item.label}</p>
                <p className="text-4xl font-black text-slate-900 mt-2">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr,1fr,1fr,auto] gap-4 items-end">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by meeting, contact, or email"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All statuses" : status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Mode</span>
            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
            >
              <option value="ALL">All modes</option>
              {ATTENDANCE_OPTIONS.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={fetchMeetings}
            className="h-[54px] px-5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 justify-center hover:bg-slate-100 transition-all"
          >
            <FiFilter size={14} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-16 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Loading meetings</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-[28px] bg-slate-50 text-slate-300 flex items-center justify-center">
            <FiCalendar size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-6">No meetings yet</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Create the first meeting with reminders, a meeting link, and share-ready details for email or WhatsApp.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-6 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em]"
          >
            Schedule Meeting
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] ${getStatusClasses(meeting.status)}`}>
                      {meeting.status}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      {meeting.meetingType || "Consultation"}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      {getMeetingModeLabel(meeting)}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{meeting.title}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                      {meeting.description || "No description added yet."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact</p>
                      <p className="text-sm font-black text-slate-900 mt-2">{meeting.contactName || meeting.leadId?.name || meeting.inquiryId?.name || "No contact"}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{meeting.contactEmail || "No email"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Schedule</p>
                      <p className="text-sm font-black text-slate-900 mt-2">{new Date(meeting.startDate).toLocaleString("en-IN")}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        Ends {new Date(meeting.endDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Link / Location</p>
                      <p className="text-sm font-black text-slate-900 mt-2 break-words">{getMeetingVenue(meeting)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reminders</p>
                      <p className="text-sm font-black text-slate-900 mt-2">
                        {meeting.reminderMinutes?.length ? meeting.reminderMinutes.map((minute) => `${minute}m`).join(", ") : "No reminders"}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {(meeting.sendSystemReminder ? "System" : "") + (meeting.sendSystemReminder && meeting.sendEmailReminder ? " + " : "") + (meeting.sendEmailReminder ? "Email" : "") || "Disabled"}
                      </p>
                    </div>
                  </div>

                  {meeting.notes ? (
                    <div className="rounded-2xl bg-amber-50/70 border border-amber-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Internal Notes</p>
                      <p className="text-sm font-semibold text-slate-700 mt-2">{meeting.notes}</p>
                    </div>
                  ) : null}
                </div>

                <div className="xl:w-[320px] space-y-3">
                  <button
                    onClick={() => openEditModal(meeting)}
                    className="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <FiEdit2 size={14} />
                    Edit Meeting
                  </button>
                  <button
                    onClick={() => handleCopyShare(meeting)}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <FiCopy size={14} />
                    Copy Share Text
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleShareEmail(meeting)}
                      className="px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-[0.18em] flex items-center justify-center gap-2"
                    >
                      <FiMail size={14} />
                      Email
                    </button>
                    <button
                      onClick={() => handleShareWhatsapp(meeting)}
                      className="px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-[0.18em] flex items-center justify-center gap-2"
                    >
                      <FiMessageCircle size={14} />
                      WhatsApp
                    </button>
                  </div>
                  {["online", "hybrid"].includes(meeting.attendanceMode || meeting.channel) ? (
                    <button
                      onClick={() => handleOpenLink(meeting)}
                      className="w-full px-5 py-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                    >
                      <FiExternalLink size={14} />
                      Open Meeting Link
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
      {showModal ? (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="w-full max-w-6xl bg-white rounded-[36px] shadow-2xl overflow-hidden border border-slate-100">
              <div className="px-6 md:px-8 py-6 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">
                    {editingMeeting ? "Edit meeting" : "Create meeting"}
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    {editingMeeting ? "Update meeting details" : "Schedule a complete meeting"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1.5fr,1fr] gap-0">
                <div className="p-6 md:p-8 space-y-6 border-b xl:border-b-0 xl:border-r border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="block md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Meeting Title</span>
                      <input
                        value={formData.title}
                        onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Admission consultation with Rahul"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Meeting Type</span>
                      <select
                        value={formData.meetingType}
                        onChange={(event) => setFormData((prev) => ({ ...prev, meetingType: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      >
                        {MEETING_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Status</span>
                      <select
                        value={formData.status}
                        onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      >
                        {STATUS_OPTIONS.filter((status) => status !== "ALL").map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Start</span>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">End</span>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(event) => setFormData((prev) => ({ ...prev, endDate: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Attendance Mode</p>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {ATTENDANCE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = formData.attendanceMode === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, attendanceMode: option.value }))}
                            className={`rounded-2xl border px-4 py-4 text-left transition-all ${isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"}`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={16} />
                              <span className="text-[11px] font-black uppercase tracking-[0.18em]">{option.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {["online", "hybrid"].includes(formData.attendanceMode) ? (
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Meeting Link</span>
                        <div className="relative">
                          <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input
                            value={formData.meetingLink}
                            onChange={(event) => setFormData((prev) => ({ ...prev, meetingLink: event.target.value }))}
                            placeholder="https://meet.google.com/..."
                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                          />
                        </div>
                      </label>
                    ) : <div />}

                    {["offline", "in_person", "hybrid"].includes(formData.attendanceMode) ? (
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Location</span>
                        <div className="relative">
                          <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input
                            value={formData.location}
                            onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                            placeholder="Branch office, client office, cafe..."
                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                          />
                        </div>
                      </label>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Assign To</span>
                      <select
                        value={formData.assignedTo}
                        onChange={(event) => setFormData((prev) => ({ ...prev, assignedTo: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      >
                        <option value="">Select user</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} {user.role ? `(${user.role})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Reminder Minutes</span>
                      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        {REMINDER_OPTIONS.map((minute) => {
                          const active = formData.reminderMinutes.includes(minute);
                          return (
                            <button
                              key={minute}
                              type="button"
                              onClick={() => toggleReminderMinute(minute)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${active ? "bg-indigo-600 text-white" : "bg-white text-slate-500 border border-slate-100"}`}
                            >
                              {minute >= 1440 ? "1 day" : `${minute} min`}
                            </button>
                          );
                        })}
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Contact Name</span>
                      <input
                        value={formData.contactName}
                        onChange={(event) => setFormData((prev) => ({ ...prev, contactName: event.target.value }))}
                        placeholder="Student or client name"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Contact Email</span>
                      <input
                        value={formData.contactEmail}
                        onChange={(event) => setFormData((prev) => ({ ...prev, contactEmail: event.target.value }))}
                        placeholder="name@example.com"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Contact Phone</span>
                      <input
                        value={formData.contactPhone}
                        onChange={(event) => setFormData((prev) => ({ ...prev, contactPhone: event.target.value }))}
                        placeholder="9876543210"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-200"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Meeting Agenda</span>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="What should happen in this meeting?"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-indigo-200 resize-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Internal Notes</span>
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                        placeholder="Internal prep points, documents to discuss, owner reminders..."
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-indigo-200 resize-none"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-6 bg-slate-50/70">
                  <div className="rounded-[28px] bg-indigo-600 text-white p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Sharing Preview</p>
                    <h3 className="text-2xl font-black mt-3">{formData.title || "New meeting"}</h3>
                    <div className="space-y-3 mt-5 text-sm font-medium text-white/90">
                      <p><strong>Mode:</strong> {getMeetingModeLabel(formData)}</p>
                      <p><strong>Starts:</strong> {formData.startDate ? new Date(formData.startDate).toLocaleString("en-IN") : "Not set"}</p>
                      <p><strong>Venue:</strong> {getMeetingVenue(formData)}</p>
                      <p><strong>Contact:</strong> {formData.contactName || "Not set"} {formData.contactEmail ? `(${formData.contactEmail})` : ""}</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-100 bg-white p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Reminder Channels</p>
                    <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">System Reminder</p>
                        <p className="text-xs font-semibold text-slate-500">Show in CRM notifications for the assignee.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.sendSystemReminder}
                        onChange={(event) => setFormData((prev) => ({ ...prev, sendSystemReminder: event.target.checked }))}
                        className="h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">Email Reminder</p>
                        <p className="text-xs font-semibold text-slate-500">Send reminder email to the meeting contact.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.sendEmailReminder}
                        onChange={(event) => setFormData((prev) => ({ ...prev, sendEmailReminder: event.target.checked }))}
                        className="h-4 w-4"
                      />
                    </label>
                  </div>

                  <div className="rounded-[28px] border border-slate-100 bg-white p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Connected CRM Record</p>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                      {formData.leadId ? `Linked to lead ${formData.contactName || formData.leadId}` : formData.inquiryId ? `Linked to inquiry ${formData.contactName || formData.inquiryId}` : "Standalone meeting"}
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      After saving, you can copy the share text or send the invite through email or WhatsApp from the meeting card.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full px-6 py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-60"
                    >
                      {saving ? "Saving..." : editingMeeting ? "Update Meeting" : "Create Meeting"}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-slate-500 text-xs font-black uppercase tracking-[0.2em]"
                    >
                      Cancel
                    </button>
                    {editingMeeting ? (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full px-6 py-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-[0.2em]"
                      >
                        Delete Meeting
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
