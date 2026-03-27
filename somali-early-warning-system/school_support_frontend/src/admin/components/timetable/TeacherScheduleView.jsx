import React from 'react';
import { Calendar, BookOpen } from 'lucide-react';

export default function TeacherScheduleView({ teacherSchedule, openCreateModal }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Teacher Assignments</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Overview of each teacher's weekly schedule</p>
      </div>
      
      <div className="p-3 sm:p-4">
        {teacherSchedule.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {teacherSchedule.map((teacherData, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0">
                      {teacherData.teacher.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">{teacherData.teacher}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{teacherData.email}</p>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-medium text-xs sm:text-sm self-start sm:self-auto">
                    {teacherData.periods.length} periods/week
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teacherData.periods.map((p, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-sm transition">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-600 capitalize bg-white px-2 py-1 rounded">{p.day}</span>
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">Period {p.period}</span>
                      </div>
                      <div className="font-semibold text-sm text-gray-900">{p.subject}</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{p.classroom}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
            <p className="text-gray-500 text-base sm:text-lg mb-3 sm:mb-4">No teacher assignments yet</p>
            <button
              onClick={() => openCreateModal()}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base"
            >
              Create First Assignment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
