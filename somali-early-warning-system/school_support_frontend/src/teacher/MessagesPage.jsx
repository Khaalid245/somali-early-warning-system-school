import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/apiClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { showToast } from '../utils/toast';

export default function MessagesPage() {
  const { user, logout } = useContext(AuthContext);
  const [formMasters, setFormMasters] = useState([]);
  const [selectedFM, setSelectedFM] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('send');

  useEffect(() => {
    loadFormMasters();
    loadMessages();
  }, []);

  const loadFormMasters = async () => {
    try {
      const res = await api.get('/messages/form-masters/');
      setFormMasters(res.data || []);
    } catch (err) {
      console.error('Failed to load form masters', err);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api.get('/messages/');
      const all = res.data.results || res.data || [];
      console.log('[Teacher Messages] All messages:', all);
      console.log('[Teacher Messages] User object:', user);
      const userId = user?.user_id || user?.id;
      console.log('[Teacher Messages] Using user ID:', userId);
      const sent = all.filter(m => m.sender === userId);
      const received = all.filter(m => m.recipient === userId);
      console.log('[Teacher Messages] Sent:', sent);
      console.log('[Teacher Messages] Received:', received);
      setSentMessages(sent);
      setReceivedMessages(received);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleSend = async () => {
    if (!selectedFM) {
      showToast.error('Please select a Form Master');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      showToast.error('Please enter subject and message');
      return;
    }

    setSending(true);
    try {
      await api.post('/messages/', {
        recipient: parseInt(selectedFM),
        subject: subject,
        message: message
      });
      showToast.success('Message sent successfully');
      setSubject('');
      setMessage('');
      setSelectedFM('');
      loadMessages();
    } catch (err) {
      showToast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />
      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Messages</h1>

          <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'send' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Send Message
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'sent' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Sent ({sentMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'received' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Received ({receivedMessages.length})
            </button>
          </div>

          {activeTab === 'send' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">To: Form Master *</label>
                <select
                  value={selectedFM}
                  onChange={(e) => setSelectedFM(e.target.value)}
                  className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select Form Master --</option>
                  {formMasters.map(fm => (
                    <option key={fm.id} value={fm.id}>{fm.name} ({fm.email})</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows="6"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 text-sm md:text-base"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {sentMessages.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {sentMessages.map(msg => (
                    <div key={msg.id} className="p-3 md:p-4 hover:bg-white transition">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm md:text-base text-gray-900">To: {msg.recipient_name}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm md:text-base">No sent messages</div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {receivedMessages.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {receivedMessages.map(msg => (
                    <div key={msg.id} className="p-3 md:p-4 hover:bg-white transition">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm md:text-base text-gray-900">From: {msg.sender_name}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm md:text-base">No received messages</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
