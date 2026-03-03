import { useParams, useNavigate } from 'react-router-dom';

export default function EditAttendanceTest() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Attendance Test</h1>
        <p className="mb-4">Session ID from URL: <strong>{sessionId || 'undefined'}</strong></p>
        
        <div className="space-y-4">
          <p>This is a test page to verify the route is working.</p>
          <p>The sessionId should be passed from the URL parameter.</p>
          
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/teacher/attendance-tracking')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Attendance Tracking
            </button>
            
            <button
              onClick={() => navigate('/teacher/edit-attendance/123')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test with Session ID 123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}