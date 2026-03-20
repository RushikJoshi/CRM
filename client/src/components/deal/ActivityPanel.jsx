import React, { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";
import API from "../../services/api";
import ActivityItem from "./ActivityItem";
import FollowUpInput from "./FollowUpInput";

/**
 * Odoo-style activity/chatter panel for a deal. Timeline of calls, meetings, notes;
 * only internal scroll. "+ Add Activity" via FollowUpInput.
 */
export default function ActivityPanel({ dealId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    if (!dealId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/activities/timeline?dealId=${dealId}`);
      setActivities(res.data?.data || []);
    } catch (err) {
      console.error("Activity timeline error:", err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [dealId]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <FiClock size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-800">Activity / Follow-up</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <FollowUpInput dealId={dealId} onAdded={fetchTimeline} />
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No activities yet.</p>
          ) : (
            <div className="space-y-0">
              {activities.map((activity, index) => (
                <ActivityItem
                  key={activity.id || activity._id || index}
                  activity={activity}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
