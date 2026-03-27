import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Clock, BookOpen, CheckSquare } from "lucide-react";

const DAYS_ORDER = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];

const PERIOD_TIMES = {
  "1": "8:00 – 8:45",
  "2": "8:45 – 9:30",
  "3": "9:30 – 10:15",
  "4": "11:00 – 11:45",
  "5": "11:45 – 12:30",
  "6": "12:30 – 1:15",
};

export default function TeacherSchedule() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  const fetchSchedule = (isManual = false) => {
    if (isManual) setRefreshing(true);
    api.get("/academics/schedule/timetable/")
      .then(res => {
        setSchedule(res.data.schedule || {});
        setLastUpdated(new Date());
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(() => fetchSchedule(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const orderedDays = DAYS_ORDER.filter(d => schedule[d]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />
      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />
        <div className="p-4 sm:p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Weekly Schedule</h1>
              <p className="text-sm text-gray-500 mt-1">
                Today is <span className="font-semibold capitalize text-green-700">{todayName}</span>
                {lastUpdated && (
                  <span className="ml-3 text-xs text-gray-400">
                    · Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => fetchSchedule(true)}
              disabled={refreshing}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading schedule...</div>
          ) : orderedDays.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No timetable assigned yet. Contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedDays.map(day => {
                const isToday = day === todayName;
                const slots = [...schedule[day]].sort((a, b) => a.period - b.period);
                return (
                  <div
                    key={day}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                      isToday ? "border-green-400 ring-2 ring-green-200" : "border-gray-200"
                    }`}
                  >
                    {/* Day header */}
                    <div className={`px-5 py-3 flex items-center gap-3 ${isToday ? "bg-green-600" : "bg-gray-100"}`}>
                      <span className={`text-sm font-bold capitalize ${isToday ? "text-white" : "text-gray-700"}`}>
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-xs bg-white text-green-700 font-semibold px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                      <span className={`ml-auto text-xs ${isToday ? "text-green-100" : "text-gray-400"}`}>
                        {slots.length} period{slots.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Slots */}
                    <div className="divide-y divide-gray-100">
                      {slots.map(slot => (
                        <div
                          key={slot.timetable_id}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
                        >
                          {/* Period badge */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isToday ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            P{slot.period}
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs text-gray-400 w-28 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {PERIOD_TIMES[String(slot.period)] || `Period ${slot.period}`}
                          </div>

                          {/* Class & Subject */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{slot.subject}</p>
                            <p className="text-xs text-gray-500 truncate">{slot.classroom}</p>
                          </div>

                          {/* Take Attendance — only show for today */}
                          {isToday && (
                            <button
                              onClick={() => navigate("/teacher/attendance", {
                                state: { classroom: slot.classroom, subject: slot.subject }
                              })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition flex-shrink-0"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Take Attendance
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
