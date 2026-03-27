import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function TimetableModal({ 
  showModal, 
  modalMode, 
  formData, 
  handleInputChange, 
  handleSubmit, 
  setShowModal, 
  classrooms, 
  teachers, 
  subjects, 
  DAYS, 
  PERIODS 
}) {
  const [isClassroomDropdownOpen, setIsClassroomDropdownOpen] = useState(false);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  
  const classroomDropdownRef = useRef(null);
  const teacherDropdownRef = useRef(null);
  const subjectDropdownRef = useRef(null);
  const dayDropdownRef = useRef(null);
  const periodDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (classroomDropdownRef.current && !classroomDropdownRef.current.contains(event.target)) {
        setIsClassroomDropdownOpen(false);
      }
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target)) {
        setIsTeacherDropdownOpen(false);
      }
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
        setIsSubjectDropdownOpen(false);
      }
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target)) {
        setIsDayDropdownOpen(false);
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setIsPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
        <div className="bg-green-50 border-b-2 border-green-200 p-6 rounded-t-lg">
          <h2 className="text-2xl font-semibold text-green-900">
            {modalMode === 'create' ? 'Create Timetable Entry' : 'Edit Timetable Entry'}
          </h2>
          <p className="text-green-700 text-sm mt-1">Add a new period to the timetable</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Classroom *</label>
              <div className="relative" ref={classroomDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsClassroomDropdownOpen(!isClassroomDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <span className={formData.classroom_id ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.classroom_id ? classrooms.find(c => c.class_id === Number(formData.classroom_id))?.name : 'Select Classroom'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isClassroomDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isClassroomDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange({ target: { name: 'classroom_id', value: '' } });
                        setIsClassroomDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition text-gray-400"
                    >
                      Select Classroom
                    </button>
                    {classrooms.map(c => (
                      <button
                        key={c.class_id}
                        type="button"
                        onClick={() => {
                          handleInputChange({ target: { name: 'classroom_id', value: c.class_id } });
                          setIsClassroomDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition ${
                          Number(formData.classroom_id) === c.class_id ? 'bg-green-50 text-green-600 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
              <div className="relative" ref={teacherDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <span className={formData.teacher_id ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.teacher_id ? teachers.find(t => t.id === Number(formData.teacher_id))?.name : 'Select Teacher'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTeacherDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTeacherDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange({ target: { name: 'teacher_id', value: '' } });
                        setIsTeacherDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition text-gray-400"
                    >
                      Select Teacher
                    </button>
                    {teachers.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          handleInputChange({ target: { name: 'teacher_id', value: t.id } });
                          setIsTeacherDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition ${
                          Number(formData.teacher_id) === t.id ? 'bg-green-50 text-green-600 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <div className="relative" ref={subjectDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <span className={formData.subject_id ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.subject_id ? subjects.find(s => s.subject_id === Number(formData.subject_id))?.name : 'Select Subject'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSubjectDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange({ target: { name: 'subject_id', value: '' } });
                        setIsSubjectDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition text-gray-400"
                    >
                      Select Subject
                    </button>
                    {subjects.map(s => (
                      <button
                        key={s.subject_id}
                        type="button"
                        onClick={() => {
                          handleInputChange({ target: { name: 'subject_id', value: s.subject_id } });
                          setIsSubjectDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition ${
                          Number(formData.subject_id) === s.subject_id ? 'bg-green-50 text-green-600 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day *</label>
              <div className="relative" ref={dayDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <span className={formData.day_of_week ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.day_of_week ? DAYS.find(d => d.value === formData.day_of_week)?.label : 'Select Day'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDayDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDayDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange({ target: { name: 'day_of_week', value: '' } });
                        setIsDayDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition text-gray-400"
                    >
                      Select Day
                    </button>
                    {DAYS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          handleInputChange({ target: { name: 'day_of_week', value: d.value } });
                          setIsDayDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition ${
                          formData.day_of_week === d.value ? 'bg-green-50 text-green-600 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period *</label>
              <div className="relative" ref={periodDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <span className={formData.period ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.period ? `${PERIODS.find(p => p.value === formData.period)?.label} (${PERIODS.find(p => p.value === formData.period)?.time})` : 'Select Period'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPeriodDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange({ target: { name: 'period', value: '' } });
                        setIsPeriodDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition text-gray-400"
                    >
                      Select Period
                    </button>
                    {PERIODS.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          handleInputChange({ target: { name: 'period', value: p.value } });
                          setIsPeriodDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition ${
                          formData.period === p.value ? 'bg-green-50 text-green-600 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        {p.label} ({p.time})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              {modalMode === 'create' ? 'Create Entry' : 'Update Entry'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
