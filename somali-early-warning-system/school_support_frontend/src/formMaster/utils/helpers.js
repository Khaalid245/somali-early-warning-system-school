export const getBadgeColors = () => ({
  getRiskBadgeColor: (level) => {
    const colors = {
      low: 'bg-green-50 text-green-800 border border-green-200',
      medium: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
      high: 'bg-orange-50 text-orange-800 border border-orange-200',
      critical: 'bg-red-50 text-red-800 border border-red-200'
    };
    return colors[level?.toLowerCase()] || colors.medium;
  },

  getAlertStatusBadgeColor: (status) => {
    const colors = {
      active: 'bg-red-50 text-red-800 border border-red-200',
      under_review: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
      escalated: 'bg-orange-50 text-orange-800 border border-orange-200',
      resolved: 'bg-green-50 text-green-800 border border-green-200',
      dismissed: 'bg-gray-50 text-gray-800 border border-gray-200'
    };
    return colors[status] || colors.active;
  },

  getCaseStatusBadgeColor: (status) => {
    const colors = {
      open: 'bg-red-50 text-red-800 border border-red-200',
      in_progress: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
      awaiting_parent: 'bg-orange-50 text-orange-800 border border-orange-200',
      escalated_to_admin: 'bg-red-50 text-red-800 border border-red-200',
      closed: 'bg-green-50 text-green-800 border border-green-200'
    };
    return colors[status] || colors.open;
  }
});

export const getTrendHelpers = () => ({
  getTrendIcon: (trend) => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  },

  getTrendColor: (trend, inverse = false) => {
    if (inverse) {
      if (trend === "up") return "text-red-600";
      if (trend === "down") return "text-green-600";
    } else {
      if (trend === "up") return "text-green-600";
      if (trend === "down") return "text-red-600";
    }
    return "text-gray-600";
  },

  getTimeAgo: (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
});
