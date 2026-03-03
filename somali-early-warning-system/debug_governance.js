// TEST: Copy this into browser console when on Governance page

console.log('=== GOVERNANCE DEBUG ===');
console.log('All buttons on page:', document.querySelectorAll('button').length);
console.log('Governance buttons:', document.querySelectorAll('.bg-blue-600, .bg-green-600, .bg-purple-600, .bg-orange-600, .bg-pink-600, .bg-indigo-600').length);

// Click each button programmatically
const buttons = [
  'User Management',
  'Subject Management', 
  'Classroom Management',
  'Student Management',
  'Student Enrollment',
  'Teacher Assignment'
];

buttons.forEach((btnText, index) => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(btnText));
  console.log(`${index + 1}. ${btnText}:`, btn ? 'FOUND' : 'NOT FOUND');
});
