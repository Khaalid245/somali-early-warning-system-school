import { useState } from 'react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function EscalationDebugger() {
  const [caseId, setCaseId] = useState('8');
  const [reason, setReason] = useState('Debug test escalation');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const testEscalation = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Testing escalation API call...');
      console.log('Case ID:', caseId);
      console.log('Reason:', reason);
      
      const response = await api.patch(`/interventions/${caseId}/`, {
        status: 'escalated_to_admin',
        escalation_reason: reason
      });
      
      console.log('API Response:', response.data);
      setResult(`SUCCESS: ${JSON.stringify(response.data, null, 2)}`);
      showToast.success('Escalation successful!');
      
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error Response:', error.response?.data);
      setResult(`ERROR: ${error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message}`);
      showToast.error('Escalation failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 m-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Escalation API Debugger</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Case ID</label>
          <input
            type="text"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        <button
          onClick={testEscalation}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Escalation API'}
        </button>
        
        {result && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Result:</label>
            <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto max-h-64">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}