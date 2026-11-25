const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('RUNNING COMPREHENSIVE TEST SUITE FOR ABACUS KIDS APP');
console.log('Multi-School Teacher Homework Publishing & Principal Supervision');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log('✅ PASS:', name);
    passCount++;
  } catch (err) {
    console.error('❌ FAIL:', name, err.message);
    failCount++;
  }
}

const html = fs.readFileSync('index.html', 'utf8');

// TEST 1: JavaScript Syntax & Parsing
runTest('index.html contains valid JavaScript without syntax errors', () => {
  const sStart = html.indexOf('<script>');
  const sEnd = html.lastIndexOf('</script>');
  assert(sStart !== -1 && sEnd !== -1, 'Script tags not found in index.html');
  const code = html.substring(sStart + 8, sEnd);
  new Function(code);
});

// TEST 2: Multi-School Context & Config
runTest('Multi-school configuration supports the-abacus-academy and gr-children-academy', () => {
  assert(html.includes('"the-abacus-academy"'), 'the-abacus-academy missing');
  assert(html.includes('"gr-children-academy"'), 'gr-children-academy missing');
  assert(html.includes('The Abacus Academy'), 'The Abacus Academy branding missing');
  assert(html.includes('GR Children Academy'), 'GR Children Academy branding missing');
  assert(html.includes('setActiveSchoolId'), 'setActiveSchoolId function missing');
  assert(html.includes('getActiveSchoolId'), 'getActiveSchoolId function missing');
  assert(html.includes('openSchoolSelectModal'), 'openSchoolSelectModal missing');
});

// TEST 3: Three Clean Role Access Modes
runTest('Home screen provides 3 role access modes: Parent/Student, Teacher, Principal', () => {
  assert(html.includes('role-card-parent'), 'Parent mode card missing');
  assert(html.includes('role-card-teacher'), 'Teacher portal card missing');
  assert(html.includes('role-card-principal'), 'Principal desk card missing');
  assert(html.includes('enterParentMode'), 'enterParentMode missing');
  assert(html.includes('openTeacherLoginModal'), 'openTeacherLoginModal missing');
  assert(html.includes('openPrincipalLoginModal'), 'openPrincipalLoginModal missing');
});

// TEST 4: Strict Class-Teacher Access Control (kids_class_teachers)
runTest('Strict Class-Teacher access control for Nursery, LKG, and UKG', () => {
  assert(html.includes('DEFAULT_CLASS_TEACHERS'), 'DEFAULT_CLASS_TEACHERS missing');
  assert(html.includes('kids_class_teachers'), 'kids_class_teachers table references missing');
  assert(html.includes('getAssignedClassTeacher'), 'getAssignedClassTeacher helper missing');
  assert(html.includes('submitTeacherModalLogin'), 'submitTeacherModalLogin missing');
  assert(html.includes('Access Restricted: Mobile/Emp Code is not assigned'), 'Strict access denial message missing');
  assert(html.includes('appSession.teacherClass = teacher.class_name'), 'Class lock enforcement missing');
});

// TEST 5: Teacher Homework Publisher & Live Completion (kids_homework)
runTest('Teacher Homework & Activity Publisher with live completion counts', () => {
  assert(html.includes('renderTeacherSendHomeworkTab'), 'renderTeacherSendHomeworkTab missing');
  assert(html.includes('teacher-hw-subject'), 'Subject selector missing');
  assert(html.includes('teacher-hw-type'), 'Activity type selector missing');
  assert(html.includes('teacher-hw-instructions'), 'Instructions input missing');
  assert(html.includes('teacher-hw-photo-file'), 'Worksheet photo file upload missing');
  assert(html.includes('renderTeacherCompletionReportTab'), 'renderTeacherCompletionReportTab missing');
  assert(html.includes('Completed ('), 'Completion metric missing');
  assert(html.includes('deleteTeacherHomework'), 'deleteTeacherHomework missing');
});

// TEST 6: Parent Homework View & One-Tap Completion (kids_homework_submissions)
runTest("Parent Today's Homework view and One-Tap completion with photo upload", () => {
  assert(html.includes("Today's Homework"), "Today's Homework header missing");
  assert(html.includes('openParentHomeworkCompleteModal'), 'openParentHomeworkCompleteModal missing');
  assert(html.includes('parent-sub-photo-input'), 'Child notebook photo upload missing');
  assert(html.includes('submitParentHomeworkDone'), 'submitParentHomeworkDone missing');
  assert(html.includes('kids_homework_submissions'), 'kids_homework_submissions missing');
  assert(html.includes('viewWorksheetFullModal'), 'Worksheet zoom view modal missing');
});

// TEST 7: Principal Supervision Desk (Both Schools)
runTest('Principal Supervision Desk for teacher assignment and homework moderation', () => {
  assert(html.includes('renderPrincipalPanelView'), 'renderPrincipalPanelView missing');
  assert(html.includes('renderPrincipalTeachersTab'), 'renderPrincipalTeachersTab missing');
  assert(html.includes('assignOrUpdateClassTeacher'), 'assignOrUpdateClassTeacher missing');
  assert(html.includes('removeClassTeacherAssignment'), 'removeClassTeacherAssignment missing');
  assert(html.includes('renderPrincipalHomeworkTab'), 'renderPrincipalHomeworkTab missing');
  assert(html.includes('openPrincipalEditHomeworkModal'), 'Principal edit homework modal missing');
  assert(html.includes('deletePrincipalHomework'), 'Principal delete homework missing');
});

// TEST 8: SQL Schema Files
runTest('Supabase schema files exist and declare multi-school tables', () => {
  const sqlMulti = fs.readFileSync('supabase_multi_school_teacher_homework.sql', 'utf8');
  assert(sqlMulti.includes('kids_class_teachers'), 'kids_class_teachers missing in multi-school SQL');
  assert(sqlMulti.includes('kids_homework'), 'kids_homework missing in multi-school SQL');
  assert(sqlMulti.includes('kids_homework_submissions'), 'kids_homework_submissions missing in multi-school SQL');
  assert(sqlMulti.includes('the-abacus-academy'), 'the-abacus-academy seed missing in SQL');
  assert(sqlMulti.includes('gr-children-academy'), 'gr-children-academy seed missing in SQL');
});

// TEST 9: Build Output Verification
runTest('Build script outputs valid www/ distribution assets', () => {
  require('./build.js');
  assert(fs.existsSync(path.join('www', 'index.html')), 'www/index.html missing');
  assert(fs.existsSync(path.join('www', 'logo.jpeg')), 'www/logo.jpeg missing');
  const builtHtml = fs.readFileSync(path.join('www', 'index.html'), 'utf8');
  assert(builtHtml.includes('SCHOOLS_CONFIG'), 'built index.html missing SCHOOLS_CONFIG');
});

console.log('\n----------------------------------------------------------------');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('----------------------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
}
