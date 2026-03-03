import { useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useWebSocket(url, options = {}) {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000
  } = options;

  const reconnectTimeoutId = useRef(null);
  const heartbeatTimeoutId = useRef(null);
  const reconnectCount = useRef(0);

  useEffect(() => {
    if (!user?.user_id) return;

    let ws = null;

    const connect = () => {
      try {
        // Add user authentication to WebSocket URL
        const wsUrl = `${url}?user_id=${user.user_id}&token=${localStorage.getItem('access_token')}`;
        ws = new WebSocket(wsUrl);
        
        ws.onopen = (event) => {
          console.log('WebSocket connected');
          setConnectionStatus('Connected');
          setError(null);
          reconnectCount.current = 0;
          
          // Start heartbeat
          startHeartbeat(ws);
          
          if (onOpen) onOpen(event);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            
            // Handle heartbeat response
            if (data.type === 'pong') {
              return;
            }
            
            if (onMessage) onMessage(data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setConnectionStatus('Disconnected');
          clearTimeout(heartbeatTimeoutId.current);
          
          if (onClose) onClose(event);
          
          // Attempt reconnection if enabled
          if (shouldReconnect && reconnectCount.current < reconnectAttempts) {
            reconnectCount.current++;
            setConnectionStatus(`Reconnecting... (${reconnectCount.current}/${reconnectAttempts})`);
            
            reconnectTimeoutId.current = setTimeout(() => {
              connect();
            }, reconnectInterval);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('Connection error occurred');
          setConnectionStatus('Error');
          
          if (onError) onError(event);
        };

        setSocket(ws);
      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        setError('Failed to establish connection');
        setConnectionStatus('Error');
      }
    };

    const startHeartbeat = (websocket) => {
      const sendHeartbeat = () => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({ type: 'ping' }));
          heartbeatTimeoutId.current = setTimeout(sendHeartbeat, heartbeatInterval);
        }
      };
      
      heartbeatTimeoutId.current = setTimeout(sendHeartbeat, heartbeatInterval);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeoutId.current);
      clearTimeout(heartbeatTimeoutId.current);
      
      if (ws) {
        ws.close();
      }
    };
  }, [user?.user_id, url]);

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  };

  const disconnect = () => {
    clearTimeout(reconnectTimeoutId.current);
    clearTimeout(heartbeatTimeoutId.current);
    
    if (socket) {
      socket.close();
    }
  };

  return {
    socket,
    lastMessage,
    connectionStatus,
    error,
    sendMessage,
    disconnect
  };
}

// Real-time dashboard updates hook
export function useRealtimeDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const { lastMessage, connectionStatus, sendMessage } = useWebSocket(
    process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/dashboard/',
    {
      onMessage: (data) => {
        switch (data.type) {
          case 'dashboard_update':
            setDashboardData(prev => ({
              ...prev,
              ...data.payload
            }));
            break;
            
          case 'attendance_submitted':
            setNotifications(prev => [...prev, {
              id: Date.now(),
              type: 'success',
              message: `Attendance submitted for ${data.payload.classroom} - ${data.payload.subject}`,
              timestamp: new Date()
            }]);
            break;
            
          case 'alert_created':
            setNotifications(prev => [...prev, {
              id: Date.now(),
              type: 'warning',
              message: `New alert: ${data.payload.student_name} - ${data.payload.alert_type}`,
              timestamp: new Date()
            }]);
            break;
            
          case 'system_notification':
            setNotifications(prev => [...prev, {
              id: Date.now(),
              type: 'info',
              message: data.payload.message,
              timestamp: new Date()
            }]);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      }
    }
  );

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const subscribeToUpdates = (updateTypes) => {
    sendMessage({
      type: 'subscribe',
      payload: { update_types: updateTypes }
    });
  };

  return {
    dashboardData,
    notifications,
    connectionStatus,
    dismissNotification,
    subscribeToUpdates,
    setDashboardData
  };
}