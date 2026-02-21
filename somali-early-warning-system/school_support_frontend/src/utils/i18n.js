const translations = {
  en: {
    dashboard: {
      title: 'Student Support Center',
      subtitle: 'Monitor and support student success',
      refresh: 'Refresh Data',
      noData: 'No data available'
    },
    alerts: {
      title: 'Assigned Alerts',
      noAlerts: 'No recent alerts',
      review: 'Review',
      escalate: 'Escalate',
      resolve: 'Resolve'
    },
    cases: {
      title: 'Intervention Cases',
      noCases: 'No intervention cases'
    },
    students: {
      title: 'Students Needing Support',
      noStudents: 'No students found'
    },
    progression: {
      title: 'Student Progression Tracking',
      subtitle: 'Monitor intervention effectiveness and student improvement',
      improving: 'Improving',
      notImproving: 'Not Improving',
      noContact: 'No Contact Yet',
      resolved: 'Resolved'
    },
    attendance: {
      title: 'Attendance Overview',
      subtitle: 'View all students attendance records and history'
    }
  }
};

let currentLanguage = 'en';

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
  }
};

export const t = (key) => {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};

export const getCurrentLanguage = () => currentLanguage;

const savedLang = localStorage.getItem('language');
if (savedLang && translations[savedLang]) {
  currentLanguage = savedLang;
}
