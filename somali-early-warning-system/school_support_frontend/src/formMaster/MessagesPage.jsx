import { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/apiClient';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

export default function MessagesPage() {
  const { user, logout } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages/');
      const allMessages = Array.isArray(data) ? data : (data.results || []);
      console.log('[Form Master] All messages from API:', allMessages);
      console.log('[Form Master] Current user object:', user);
      console.log('[Form Master] User ID:', user?.id, 'User user_id:', user?.user_id);
      setMessages(allMessages);
    } catch (error) {
      console.error('[Form Master] Failed to load messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/mark_read/`);
      // Update local state instead of refetching
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: true } : m
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Don't show error to user, just log it
    }
  };

  const userId = user?.user_id || user?.id;
  const receivedMessages = messages.filter(m => m.recipient === userId);
  const sentMessages = messages.filter(m => m.sender === userId);
  
  console.log('[Form Master] Using user ID:', userId);
  console.log('[Form Master] Received messages:', receivedMessages);
  console.log('[Form Master] Sent messages:', sentMessages);

  const displayMessages = activeTab === 'received' ? receivedMessages : sentMessages;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} dashboardData={{}} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Messages</h1>

            {/* Tabs */}
            <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b overflow-x-auto">
              <button
                onClick={() => setActiveTab('received')}
                className={`pb-2 px-3 md:px-4 whitespace-nowrap text-sm md:text-base ${activeTab === 'received' ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600'}`}
              >
                Received ({receivedMessages.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`pb-2 px-3 md:px-4 whitespace-nowrap text-sm md:text-base ${activeTab === 'sent' ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600'}`}
              >
                Sent ({sentMessages.length})
              </button>
            </div>

            {/* Messages List */}
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : displayMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No messages</div>
            ) : (
              <div className="space-y-3">
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                    }}
                    className="p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:bg-white transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <p className="font-semibold text-sm md:text-base text-gray-900">
                        {activeTab === 'received' ? `From: ${msg.sender_name}` : `To: ${msg.recipient_name}`}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Message Detail Modal */}
            {selectedMessage && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedMessage(null)}>
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-4 md:p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm text-gray-600">
                        {activeTab === 'received' ? 'From' : 'To'}: {activeTab === 'received' ? selectedMessage.sender_name : selectedMessage.recipient_name}
                      </p>
                      <h3 className="text-lg md:text-xl font-bold mt-1">{selectedMessage.subject}</h3>
                    </div>
                    <button onClick={() => setSelectedMessage(null)} className="text-gray-500 hover:text-gray-700 text-xl ml-2">✕</button>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mb-4">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                  <div className="border-t pt-4">
                    <p className="text-sm md:text-base whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
