import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import { API_BASE_URL } from "../../config/api";
import { useToast } from "../../context/ToastContext";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiMousePointer,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);

  const fetchCampaign = async (showError = true) => {
    try {
      const res = await API.get(`/mass-messaging/${id}`);
      setCampaign(res.data?.data?.campaign || null);
      setLogs(res.data?.data?.logs || []);
    } catch {
      if (showError) {
        toast.error("Failed to load campaign details.");
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    const timer = window.setInterval(() => fetchCampaign(false), 15000);
    return () => window.clearInterval(timer);
  }, [id, navigate, toast]);

  const stats = useMemo(() => ({
    total: logs.length,
    sent: logs.filter((log) => ["SENT", "OPENED", "CLICKED"].includes(log.status)).length,
    opened: logs.filter((log) => ["OPENED", "CLICKED"].includes(log.status) || (log.openedCount || 0) > 0).length,
    clicked: logs.filter((log) => log.status === "CLICKED" || (log.clickedCount || 0) > 0).length,
    failed: logs.filter((log) => log.status === "FAILED").length,
    pending: logs.filter((log) => log.status === "PENDING").length,
  }), [logs]);

  const trackingNeedsPublicUrl = useMemo(
    () => /localhost|127\.0\.0\.1|::1/.test(API_BASE_URL),
    []
  );

  const statusPill = (status) => {
    const map = {
      SENT: "bg-emerald-50 text-emerald-600 border-emerald-100",
      OPENED: "bg-sky-50 text-sky-600 border-sky-100",
      CLICKED: "bg-violet-50 text-violet-600 border-violet-100",
      FAILED: "bg-rose-50 text-rose-600 border-rose-100",
      PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    };
    return map[status] || "bg-slate-50 text-slate-500 border-slate-100";
  };

  if (loading) {
    return <div className="p-10 text-center text-sm font-bold text-slate-400">Loading campaign detail...</div>;
  }

  if (!campaign) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-10 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-slate-700 transition-all">
            <FiArrowLeft className="mx-auto" size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{campaign.name}</h1>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {campaign.channel} campaign • {campaign.audienceType}
            </p>
          </div>
        </div>
        <Link to="../create" className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white">
          New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {[
          { label: "Total", value: stats.total, icon: FiClock, tone: "text-slate-700" },
          { label: "Sent", value: stats.sent, icon: FiCheckCircle, tone: "text-emerald-600" },
          { label: "Opened", value: stats.opened, icon: FiMail, tone: "text-sky-600" },
          { label: "Clicked", value: stats.clicked, icon: FiMousePointer, tone: "text-violet-600" },
          { label: "Failed", value: stats.failed, icon: FiXCircle, tone: "text-rose-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className={`mt-2 text-3xl font-black ${stat.tone}`}>{stat.value}</p>
                </div>
                <Icon className={stat.tone} size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {campaign.channel === "EMAIL" && trackingNeedsPublicUrl && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
          <p className="text-[10px] font-black uppercase tracking-widest">Tracking Setup Needed</p>
          <p className="mt-2 font-medium leading-6">
            This campaign was sent while tracking points to <span className="font-black">localhost</span>. Gmail image proxy cannot reach localhost, so opens usually stay at zero until your backend exposes a public <span className="font-black">TRACKING_BASE_URL</span> ending in <span className="font-black">/api</span>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Channel</p>
            <p className="mt-2 text-sm font-bold text-slate-800 flex items-center gap-2">
              {campaign.channel === "EMAIL" ? <FiMail size={16} /> : <FiMessageSquare size={16} />}
              {campaign.channel}
            </p>
          </div>
          {campaign.channel === "EMAIL" && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{campaign.subject || "No subject"}</p>
            </div>
          )}
          {campaign.templateId && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{campaign.templateId.name}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sender</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{campaign.senderProfileId?.label || campaign.senderName || "Not specified"}</p>
            <p className="mt-1 text-xs text-slate-500">{campaign.senderProfileId?.fromEmail || campaign.senderEmail || "Default SMTP sender"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled At</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{new Date(campaign.scheduledAt).toLocaleString()}</p>
          </div>
          <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-indigo-700">
                <FiRefreshCw size={14} />
                Engagement status refreshes every 15 seconds.
              </span>
              <button
                type="button"
                onClick={() => fetchCampaign(false)}
                className="rounded-full border border-indigo-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700"
              >
                Refresh
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Preview</p>
            <div className="mt-3 rounded-[24px] border border-slate-100 bg-slate-50 p-5 text-sm text-slate-700 leading-7" dangerouslySetInnerHTML={{ __html: campaign.message || "<p>No content.</p>" }} />
          </div>
        </div>

        <div className="xl:col-span-7 rounded-[32px] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-sm font-black tracking-tight text-slate-900">Delivery Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sent At</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Opened</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Clicked</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{log.recipientName || log.recipient || "Pending..."}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusPill(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{log.sentAt ? new Date(log.sentAt).toLocaleString() : "Not yet"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {log.openedCount ? `${log.openedCount} time(s)${log.openedAt ? ` • ${new Date(log.openedAt).toLocaleString()}` : ""}` : "No"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {log.clickedCount ? `${log.clickedCount} time(s)${log.clickedAt ? ` • ${new Date(log.clickedAt).toLocaleString()}` : ""}` : "No"}
                    </td>
                    <td className="px-6 py-4 text-sm text-rose-500">{log.error || "—"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                      No delivery records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
