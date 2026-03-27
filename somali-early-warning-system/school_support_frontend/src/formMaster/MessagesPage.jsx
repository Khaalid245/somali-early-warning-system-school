import { useState, useEffect, useContext } from 'react';
import { Mail, Send, Inbox, X, Reply } from 'lucide-react';
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
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-6">Messages</h1>

            {/* Tabs */}
            <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('received')}
                className={`pb-3 px-4 whitespace-nowrap text-sm md:text-base font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'received'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Inbox className="w-4 h-4" />
                Received ({receivedMessages.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`pb-3 px-4 whitespace-nowrap text-sm md:text-base font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'sent'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Send className="w-4 h-4" />
                Sent ({sentMessages.length})
              </button>
            </div>

            {/* Messages List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No messages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (activeTab === 'received' && !msg.is_read) {
                        markAsRead(msg.id);
                      }
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedMessage?.id === msg.id
                        ? 'bg-green-50 border-green-300 shadow-md'
                        : 'bg-white border-gray-200 hover:border-green-200 hover:shadow-md'
                    }`}
                    style={{ boxShadow: selectedMessage?.id === msg.id ? '0 2px 8px rgba(22,163,74,0.1)' : '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {activeTab === 'received' && !msg.is_read && (
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base text-gray-800 truncate">
                            {activeTab === 'received' ? msg.sender_name : msg.recipient_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activeTab === 'received' ? 'Teacher' : 'Form Master'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1.5">{msg.subject}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Message Detail Modal */}
            {selectedMessage && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 p-4" 
                onClick={() => setSelectedMessage(null)}
              >
                <div 
                  className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full" 
                  style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {activeTab === 'received' ? selectedMessage.sender_name : selectedMessage.recipient_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activeTab === 'received' ? 'Teacher' : 'Form Master'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedMessage(null)} 
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedMessage.subject}</h3>
                  
                  <p className="text-xs text-gray-400 mb-4">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                  
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                  </div>
                  
                  {activeTab === 'received' && (
                    <div className="flex justify-end">
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        onClick={() => {
                          toast.success('Reply feature coming soon!');
                        }}
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
