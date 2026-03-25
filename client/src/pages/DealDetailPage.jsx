import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiEdit2 } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import DealForm from "../components/deal/DealForm";
import ActivityPanel from "../components/deal/ActivityPanel";
import NotesSection from "../components/NotesSection";
import LostModal from "../components/LostModal";

const DEAL_STAGE_WON = "Won";
const DEAL_STAGE_LOST = "Lost";

function getDealsApiBase(role) {
  if (role === "super_admin") return "/super-admin/deals";
  return "/deals";
}

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = getCurrentUser();
  const apiBase = getDealsApiBase(user?.role);

  const [deal, setDeal] = useState(location.state?.deal ?? null);
  const [loading, setLoading] = useState(!location.state?.deal);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);

  const fetchDeal = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await API.get(apiBase);
      const data = res.data?.data ?? res.data;
      const list = Array.isArray(data) ? data : [];
      const found = list.find((d) => d._id === id);
      setDeal(found ?? null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load deal.");
      setDeal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.deal && location.state.deal._id === id) {
      setDeal(location.state.deal);
      setLoading(false);
      return;
    }
    fetchDeal();
  }, [id]);

  const basePath =
    user?.role === "sales"
      ? "/sales"
      : user?.role === "branch_manager"
      ? "/branch"
      : "/company";

  const handleMarkWon = async () => {
    if (!deal?._id) return;
    setUpdatingStage(true);
    try {
      const res = await API.put(`${apiBase}/${deal._id}/stage`, { stage: DEAL_STAGE_WON });
      setDeal(res.data?.data ?? res.data);
      toast.success("Deal marked as Won.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage.");
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleMarkLost = async ({ reason, notes }) => {
    if (!deal?._id) return;
    setUpdatingStage(true);
    try {
      const res = await API.put(`${apiBase}/${deal._id}/stage`, {
        stage: DEAL_STAGE_LOST,
        lostReason: notes ? `${reason} - ${notes}` : reason,
      });
      setDeal(res.data?.data ?? res.data);
      setShowLostModal(false);
      toast.success("Deal marked as Lost.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage.");
    } finally {
      setUpdatingStage(false);
    }
  };

  const stageDisplay =
    deal?.stage != null && typeof deal.stage === "string"
      ? deal.stage.replace(/_/g, " ")
      : "—";
  const isWon = (deal?.stage || "").toLowerCase() === "won";
  const isLost = (deal?.stage || "").toLowerCase() === "lost";

  if (loading) {
    return (
      <div
        className="h-[calc(100vh-56px)] flex flex-col items-center justify-center gap-4 bg-gray-50"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <div className="w-10 h-10 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading deal...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-4">
        <button
          onClick={() => navigate(`${basePath}/deals`)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft size={18} /> Back to Deals
        </button>
        <p className="mt-4 text-gray-500">Deal not found.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-[calc(100vh-56px)] bg-gray-50 overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      {/* Top: title + actions */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`${basePath}/deals`)}
            className="shrink-0 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft size={18} /> Back
          </button>
          <h1 className="text-lg font-semibold text-gray-800 truncate">
            {deal.customId || deal.title || "Deal"}

          </h1>
          <span className="shrink-0 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {stageDisplay}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkWon}
            disabled={updatingStage || isWon || isLost}
            className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Mark Won
          </button>
          <button
            type="button"
            onClick={() => setShowLostModal(true)}
            disabled={updatingStage || isWon || isLost}
            className="px-3 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
          >
            Mark Lost
          </button>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/deals/${deal._id}/edit`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            <FiEdit2 size={14} /> Edit
          </button>
        </div>
      </div>

      {/* Main: 3-col grid — left 2 cols DealForm, right 1 col Activity */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        <div className="lg:col-span-2 min-h-0 overflow-hidden">
          <DealForm deal={deal} />
        </div>
        <div className="min-h-0 overflow-hidden">
          <ActivityPanel dealId={deal._id} />
        </div>
      </div>

      {/* Bottom: Notes (internal scroll only) */}
      <div className="shrink-0 border-t border-gray-200 bg-white">
        <div className="max-h-[240px] overflow-y-auto p-4">
          <NotesSection dealId={deal._id} />
        </div>
      </div>

      <LostModal
        isOpen={showLostModal}
        onClose={() => setShowLostModal(false)}
        onConfirm={handleMarkLost}
        loading={updatingStage}
      />
    </div>
  );
}
