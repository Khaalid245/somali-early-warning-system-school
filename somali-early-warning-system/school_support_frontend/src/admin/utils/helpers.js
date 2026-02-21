export const formatNumber = (num) => {
  return num?.toLocaleString() || 0;
};

export const formatPercentage = (num) => {
  return `${num?.toFixed(1) || 0}%`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) return date.toLocaleDateString();
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

export const getRiskColor = (level) => {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'red',
    critical: 'purple'
  };
  return colors[level] || 'gray';
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'blue',
    under_review: 'yellow',
    escalated: 'red',
    resolved: 'green',
    dismissed: 'gray'
  };
  return colors[status] || 'gray';
};
