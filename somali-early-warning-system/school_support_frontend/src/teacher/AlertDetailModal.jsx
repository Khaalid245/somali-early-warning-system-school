import { useState } from "react";
import api from "../api/apiClient";
import { showToast } from "../utils/toast";

export default function AlertDetailModal({ alert, onClose, onAcknowledge }) {
  const [loading, setLoading] = useState(false);

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      await api.patch(`/alerts/${alert.alert_id}/`, { status: "under_review" });
      showToast.success('Alert acknowledged successfully');
      onAcknowledge();
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to acknowledge alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Alert Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <p className="text-sm text-gray-500">Student</p>
            <p className="font-semibold">{alert.student__full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Subject</p>
            <p className="font-semibold">{alert.subject__name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Alert Type</p>
            <p className="font-semibold capitalize">{alert.alert_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Risk Level</p>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              alert.risk_level === "critical" ? "bg-red-600 text-white" : "bg-orange-500 text-white"
            }`}>
              {alert.risk_level}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAcknowledge}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Acknowledge Alert"}
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
