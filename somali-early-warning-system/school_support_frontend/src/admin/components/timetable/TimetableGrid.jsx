import React, { useState, useRef, useEffect } from 'react';
import { Plus, Users, ChevronDown, Trash2, GripVertical } from 'lucide-react';
import api from '../../../api/apiClient';
import { showToast } from '../../../utils/toast';

export default function TimetableGrid({
  classrooms,
  selectedClassroom,
  setSelectedClassroom,
  schedule,
  DAYS,
  PERIODS,
  openCreateModal,
  onDeleteEntry,
}) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dragSource, setDragSource] = useState(null); // { day, period, entry }
  const [dragOver, setDragOver] = useState(null);     // { day, period }
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────
  const handleDragStart = (e, day, period, entry) => {
    setDragSource({ day, period, entry });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, day, period) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver({ day, period });
  };

  const handleDrop = async (e, targetDay, targetPeriod) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragSource) return;

    const { day: srcDay, period: srcPeriod, entry } = dragSource;
    if (srcDay === targetDay && srcPeriod === targetPeriod) return;

    // Check target is empty
    const targetDaySchedule = schedule[targetDay] || [];
    const targetOccupied = targetDaySchedule.find(p => p.period === targetPeriod);
    if (targetOccupied) {
      showToast.error('That slot is already occupied. Delete it first.');
      setDragSource(null);
      return;
    }

    // School standard: same subject cannot appear twice on the same day
    if (srcDay !== targetDay) {
      const targetDaySubjects = (schedule[targetDay] || []).map(p => p.subject);
      if (targetDaySubjects.includes(entry.subject)) {
        showToast.error(`${entry.subject} is already scheduled on ${targetDay}. Each subject can only appear once per day.`);
        setDragSource(null);
        return;
      }
    }

    try {
      // Delete old entry then create new one in target slot
      if (entry.timetable_id) {
        await api.delete(`/academics/schedule/timetable/${entry.timetable_id}/delete/`);
      }

      const classroom = classrooms.find(c => c.name === entry.classroom);
      await api.post('/academics/schedule/timetable/create/', {
        classroom_id: classroom?.class_id || selectedClassroom,
        teacher_id: entry.teacher_id,
        subject_id: entry.subject_id,
        day_of_week: targetDay,
        period: targetPeriod,
        academic_year: '2024-2025',
        term: 'Term 1',
      });

      showToast.success(`Moved to ${targetDay} Period ${targetPeriod}`);
      // Trigger parent reload
      window.dispatchEvent(new CustomEvent('timetableChanged'));
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Move failed');
    }
    setDragSource(null);
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDragOver(null);
  };

  // ── Helpers ────────────────────────────────────────────────────
  const isDragOver = (day, period) =>
    dragOver?.day === day && dragOver?.period === period;

  const isDragging = (day, period) =>
    dragSource?.day === day && dragSource?.period === period;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Classroom:</label>
            <div className="relative flex-1 sm:flex-none" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span>{classrooms.find(c => c.class_id === selectedClassroom)?.name || 'Select Classroom'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {classrooms.map(c => (
                    <button
                      key={c.class_id}
                      type="button"
                      onClick={() => { setSelectedClassroom(c.class_id); setIsDropdownOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition ${
                      selectedClassroom === c.class_id ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateModal()}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center gap-1.5 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Period
            </button>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              Drag &amp; drop to move periods
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-3 text-left font-semibold text-sm w-32">Period</th>
              {DAYS.map(day => (
                <th key={day.value} className="border border-gray-200 p-3 text-center font-semibold text-sm">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period.value}>
                <td className="border border-gray-200 p-3 bg-gray-50">
                  <div className="font-semibold text-sm">{period.label}</div>
                  <div className="text-xs text-gray-500">{period.time}</div>
                  {period.value === '4' && (
                    <div className="text-xs text-amber-600 mt-1">After break</div>
                  )}
                </td>
                {DAYS.map(day => {
                  const daySchedule = schedule[day.value] || [];
                  const entry = daySchedule.find(p => p.period === period.value);
                  const isOver = isDragOver(day.value, period.value);
                  const isDraggingThis = isDragging(day.value, period.value);

                  return (
                    <td
                      key={day.value}
                      className={`border border-gray-200 p-2 transition ${isOver && !entry ? 'bg-green-50' : ''}`}
                      onDragOver={(e) => handleDragOver(e, day.value, period.value)}
                      onDrop={(e) => handleDrop(e, day.value, period.value)}
                    >
                      {entry ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, day.value, period.value, entry)}
                          onDragEnd={handleDragEnd}
                          className={`p-2 rounded-md border cursor-grab active:cursor-grabbing transition ${
                            isDraggingThis
                              ? 'opacity-40 bg-gray-100 border-gray-300'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 text-xs mb-1 truncate">{entry.subject}</div>
                              <div className="text-gray-400 text-xs flex items-center gap-1">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{entry.teacher}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <GripVertical className="w-3 h-3 text-gray-400" />
                              {onDeleteEntry && entry.timetable_id && (
                                <button
                                  onClick={() => onDeleteEntry(entry.timetable_id)}
                                  className="text-red-400 hover:text-red-600 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-full h-16 rounded border-dashed border transition flex items-center justify-center ${
                            isOver
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <button
                            onClick={() => openCreateModal(day.value, period.value)}
                            className="w-full h-full flex items-center justify-center text-gray-300 hover:text-gray-500 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {DAYS.map(day => {
          const daySchedule = schedule[day.value] || [];
          const isExpanded = expandedDay === day.value;
          return (
            <div key={day.value} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.value)}
                className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{day.label}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {daySchedule.length}/{PERIODS.length}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="bg-gray-50 p-3 space-y-2">
                  {PERIODS.map(period => {
                    const entry = daySchedule.find(p => p.period === period.value);
                    return (
                      <div key={period.value} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{period.label}</div>
                            <div className="text-xs text-gray-500">{period.time}</div>
                          </div>
                          {!entry && (
                            <button
                              onClick={() => openCreateModal(day.value, period.value)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {entry && (
                          <div className="p-2 rounded-md bg-white border border-gray-200 flex items-start justify-between">
                            <div>
                              <div className="font-medium text-gray-800 text-sm mb-1">{entry.subject}</div>
                              <div className="text-gray-400 text-xs flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{entry.teacher}</span>
                              </div>
                            </div>
                            {onDeleteEntry && entry.timetable_id && (
                              <button
                                onClick={() => onDeleteEntry(entry.timetable_id)}
                                className="text-red-400 hover:text-red-600 transition ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
