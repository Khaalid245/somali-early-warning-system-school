import { useState } from 'react';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';

export default function QuickMessage({ recipientId, recipientName, recipientRole, onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      showToast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      await api.post('/messages/', {
        recipient: recipientId,
        subject: `Message from ${recipientRole}`,
        message: message
      });
      showToast.success(`Message sent to ${recipientName}`);
      setMessage('');
      onClose?.();
    } catch (err) {
      showToast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Send Message</h3>
        <p className="text-sm text-gray-600 mb-4">To: <span className="font-semibold">{recipientName}</span></p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows="5"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
