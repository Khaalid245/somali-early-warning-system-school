import { useEffect, useState } from "react";
import api from "../api/apiClient";

export default function DebugDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard/").then(res => {
      setData(res.data);
      console.log("Dashboard Data:", res.data);
    });
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Dashboard Debug</h1>
      <h2>Check Console (F12) for full data</h2>
      
      <h3>New Features Status:</h3>
      <ul>
        <li>insights: {data?.insights ? `✓ (${data.insights.length} items)` : "✗"}</li>
        <li>semester_comparison: {data?.semester_comparison ? "✓" : "✗"}</li>
        <li>student_progress_tracking: {data?.student_progress_tracking ? `✓ (${data.student_progress_tracking.length} items)` : "✗"}</li>
        <li>action_items: {data?.action_items ? `✓ (${data.action_items.length} items)` : "✗"}</li>
      </ul>

      <h3>Raw JSON:</h3>
      <pre style={{ background: "#f5f5f5", padding: "10px", overflow: "auto", maxHeight: "500px" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
