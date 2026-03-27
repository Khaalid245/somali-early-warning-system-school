import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/apiClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { showToast } from '../utils/toast';
import { MessageSquare, Send, Inbox, Mail, User, Calendar, FileText } from 'lucide-react';

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
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-green-600" />
              Messages
            </h1>
            <p className="text-sm text-gray-600 mt-1">Communicate with Form Masters</p>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('send')}
              className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: activeTab === 'send' ? '#16A34A' : 'transparent',
                color: activeTab === 'send' ? '#FFFFFF' : '#374151',
                border: '1px solid ' + (activeTab === 'send' ? '#16A34A' : '#E5E7EB')
              }}
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#374151',
                border: '1px solid #E5E7EB'
              }}
            >
              <Mail className="w-4 h-4" />
              Sent ({sentMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#374151',
                border: '1px solid #E5E7EB'
              }}
            >
              <Inbox className="w-4 h-4" />
              Received ({receivedMessages.length})
            </button>
          </div>

          {activeTab === 'send' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  To: Form Master *
                </label>
                <select
                  value={selectedFM}
                  onChange={(e) => setSelectedFM(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                >
                  <option value="">-- Select Form Master --</option>
                  {formMasters.map(fm => (
                    <option key={fm.id} value={fm.id}>{fm.name} ({fm.email})</option>
                  ))}
                </select>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', minHeight: '140px', borderRadius: '8px' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full md:w-auto px-6 py-2.5 rounded-lg transition font-medium disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                onMouseEnter={(e) => !sending && (e.currentTarget.style.backgroundColor = '#15803D')}
                onMouseLeave={(e) => !sending && (e.currentTarget.style.backgroundColor = '#16A34A')}
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {sentMessages.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {sentMessages.map(msg => (
                    <div key={msg.id} className="p-4 transition-colors" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
                        <p className="font-medium text-sm text-gray-800 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          To: {msg.recipient_name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No sent messages</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {receivedMessages.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {receivedMessages.map(msg => (
                    <div key={msg.id} className="p-4 transition-colors" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
                        <p className="font-medium text-sm text-gray-800 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          From: {msg.sender_name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No received messages</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
