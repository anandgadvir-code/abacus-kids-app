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
  assert(html.includes('Access Restricted:'), 'Strict access denial message missing');
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

// TEST 10: School Switcher UI Removed & Auto-Resolved School Identity
runTest('School Switcher UI is removed from header, home and principal view, auto-resolving from UDISE', () => {
  assert(html.includes('id="btn-school-switcher" class="school-pill-btn" onclick="safeAction(openSchoolSelectModal)" title="Switch Active School" style="display:none !important;"'), 'Header school switcher button not hidden');
  assert(!html.includes('renderHome() {\n      var view = document.getElementById("main-view");\n      var schoolId = getActiveSchoolId();\n      var school = getActiveSchool();\n\n      renderHeaderStatus();\n\n      var html = \'\';\n\n      // Segmented School Switcher Banner'), 'renderHome still includes school-switcher-bar');
  assert(html.includes('appSession.teacherObj.school_id'), 'getActiveSchoolId does not auto-resolve from teacher session');
  assert(html.includes('appSession.principalObj.school_id'), 'getActiveSchoolId does not auto-resolve from principal session');
});

// TEST 11: Supabase UDISE Code Authentication & Self-Set Password Flow
runTest('UDISE Code Login + Self-Set Password flow backed by Supabase', () => {
  const sqlUdise = fs.readFileSync('supabase_udise_accounts.sql', 'utf8');
  assert(sqlUdise.includes('public.udise_accounts'), 'udise_accounts missing in supabase_udise_accounts.sql');
  assert(sqlUdise.includes('is_password_set'), 'is_password_set missing in SQL schema');
  assert(html.includes('DEFAULT_UDISE_ACCOUNTS'), 'DEFAULT_UDISE_ACCOUNTS missing in index.html');
  assert(html.includes('openUdiseLoginModal'), 'openUdiseLoginModal missing');
  assert(html.includes('submitUdiseLogin'), 'submitUdiseLogin missing');
  assert(html.includes('openSetPasswordModal'), 'openSetPasswordModal missing');
  assert(html.includes('submitSetPassword'), 'submitSetPassword missing');
  assert(html.includes('saveUdisePassword'), 'saveUdisePassword missing');
  assert(html.includes('getUdiseAccount'), 'getUdiseAccount missing');
  assert(html.includes('hashPassword'), 'hashPassword helper missing');
  assert(html.includes('First-Time Setup'), 'First-Time Setup modal missing');
});

// TEST 12: Full Content Access for Principal & Teachers
runTest('Full Content Access for Principal and Teachers across all classes and modules', () => {
  assert(html.includes('switchTeacherClass'), 'switchTeacherClass function missing');
  assert(html.includes('FULL CLASS ACCESS'), 'FULL CLASS ACCESS banner missing in teacher portal');
  assert(html.includes('TEACHER ACCESS ACTIVE'), 'TEACHER ACCESS ACTIVE banner missing on Home');
  assert(html.includes('PRINCIPAL ACCESS ACTIVE'), 'PRINCIPAL ACCESS ACTIVE banner missing on Home');
  assert(html.includes('Active Class: <strong>'), 'Active Class indicator missing');
});

// TEST 13: Student / Parent Mode & Focused Homework Quiz
runTest('Student/Parent Mode click scrolls to hub and Launch Quiz opens focused quiz with Back button', () => {
  assert(html.includes('id="parent-student-hub"'), 'parent-student-hub container missing');
  assert(html.includes('focusedHomeworkQuiz'), 'focusedHomeworkQuiz property missing');
  assert(html.includes('renderFocusedHomeworkQuizHeader'), 'renderFocusedHomeworkQuizHeader missing');
  assert(html.includes('exitFocusedHomeworkQuiz'), 'exitFocusedHomeworkQuiz missing');
  assert(html.includes("← Back to Today's Homework"), "Back to Today's Homework button missing");
  assert(html.includes('ASSIGNED HOMEWORK QUIZ'), 'ASSIGNED HOMEWORK QUIZ badge missing');
});

// TEST 14: Student / Parent Login Modal & Supabase Schema
runTest('Student / Parent Login modal backed by Supabase kids_students table & clean production state', () => {
  const sqlStudent = fs.readFileSync('supabase_student_accounts.sql', 'utf8');
  assert(sqlStudent.includes('public.kids_students'), 'public.kids_students missing in supabase_student_accounts.sql');
  assert(sqlStudent.includes('login_id'), 'login_id column missing in student SQL schema');
  assert(sqlStudent.includes('student_class'), 'student_class column missing in student SQL schema');
  assert(sqlStudent.includes('points'), 'points column missing in student SQL schema');
  assert(sqlStudent.includes('badges'), 'badges column missing in student SQL schema');

  // Verify zero hardcoded demo accounts in SQL and HTML
  assert(!sqlStudent.includes('STU-AA-101'), 'STU-AA-101 demo account should not be in production SQL schema');
  assert(!sqlStudent.includes('Aarav Sharma'), 'Aarav Sharma demo account should not be in production SQL schema');
  assert(!html.includes('STU-AA-101'), 'STU-AA-101 demo account must not exist in index.html');
  assert(!html.includes('Aarav Sharma'), 'Aarav Sharma demo account must not exist in index.html');
  assert(!html.includes('Priya Patel'), 'Priya Patel demo account must not exist in index.html');
  assert(!html.includes('Aryan Verma'), 'Aryan Verma demo account must not exist in index.html');

  assert(html.includes('DEFAULT_STUDENT_ACCOUNTS'), 'DEFAULT_STUDENT_ACCOUNTS missing in index.html');
  assert(html.includes('openStudentLoginModal'), 'openStudentLoginModal function missing');
  assert(html.includes('submitStudentLogin'), 'submitStudentLogin function missing');
  assert(html.includes('getStudentAccount'), 'getStudentAccount function missing');
  assert(html.includes('handleParentModeCardClick'), 'handleParentModeCardClick function missing');
  assert(html.includes('student-login-modal'), 'student-login-modal missing');
});

// TEST 15: Single-Class Lock for Students (Teacher/Principal Multi-Class Preserved)
runTest('Single-class lock for logged-in students while teachers/principal retain all 3 classes', () => {
  assert(html.includes('isStudentLocked'), 'isStudentLocked logic missing in renderHome');
  assert(html.includes('student-profile-banner'), 'student-profile-banner missing in index.html');
  assert(html.includes('(Enrolled &amp; Locked)'), 'Enrolled & Locked indicator missing in student banner');
  assert(html.includes('class-switcher-bar'), 'class-switcher-bar class missing');
  assert(html.includes('logoutStudentSession'), 'logoutStudentSession function missing');
});

// TEST 16: Strict Homework-Only Launch (Blocks Picture World, Brain Booster & Unrelated Modules)
runTest('Strict homework-only launch suppresses Picture World, Brain Booster and other modules', () => {
  assert(html.includes('if (!appSession.focusedHomeworkQuiz)'), 'focusedHomeworkQuiz check missing for dual-grid in renderHome');
  assert(html.includes('html += \'<div class="dual-grid">\';'), 'dual-grid container missing');
  assert(html.includes('Quiz in progress! Tap \'Back to Homework\' to exit'), 'openSection does not block navigation away from focused homework quiz');
  assert(html.includes('appState.section = mod.section;'), 'renderCurrentView does not strictly enforce homework module section');
});

// TEST 17: Student Rewards, Points & Badges System with Duplicate Prevention
runTest('Student Rewards, Points & Badges system with celebration modal & duplicate prevention', () => {
  assert(html.includes('awardStudentReward'), 'awardStudentReward function missing');
  assert(html.includes('showRewardCelebrationModal'), 'showRewardCelebrationModal function missing');
  assert(html.includes('student-live-points'), 'student-live-points element missing in header/banner');
  assert(html.includes('🌟 Homework Star'), 'Homework Star badge missing');
  assert(html.includes('🏆 Quiz Champ'), 'Quiz Champ badge missing');
  assert(html.includes('🔥 Daily Achiever'), 'Daily Achiever badge missing');
  assert(html.includes('student.tasks_completed.includes(taskKey)'), 'Duplicate task farming prevention check missing in awardStudentReward');
  assert(html.includes('pointsAward: 30'), 'Homework 30 points award missing');
  assert(html.includes('pointsAward: 20'), 'Quiz 20 points award missing');
});

// TEST 18: Clean Landing Screen (Login Portals Only when Logged Out)
runTest('Clean landing screen hides hub and status bar when logged out, revealing dashboard only after login', () => {
  assert(html.includes('var isUserLoggedIn = (isStudentLoggedIn || isTeacherLoggedIn || isPrincipalLoggedIn);'), 'isUserLoggedIn check missing in renderHome');
  assert(html.includes('if (isUserLoggedIn)'), 'parent-student-hub not protected by isUserLoggedIn guard');
  assert(html.includes('if (isStudentLoggedIn)'), 'ACTIVE badge not guarded by student login');
  assert(html.includes('} else if (appSession.type === "parent" && appSession.student) {'), 'renderHeaderStatus does not check for active student login before showing parent status bar');
});

// TEST 19: UDISE Code + Mobile Number Staff Auth with Composite Unique Schema & Role Validation
runTest('UDISE Code + Mobile Number staff authentication, composite unique schema & strict role check', () => {
  const sqlUdise = fs.readFileSync('supabase_udise_accounts.sql', 'utf8');
  assert(sqlUdise.includes('mobile TEXT NOT NULL'), 'mobile column missing in supabase_udise_accounts.sql');
  assert(sqlUdise.includes('CONSTRAINT uq_udise_mobile UNIQUE (udise_code, mobile)'), 'Composite unique constraint missing');
  assert(sqlUdise.includes('08150803534'), 'The Abacus Academy official UDISE code missing in SQL schema');
  
  assert(html.includes('id="teacher-id-input"'), 'teacher-id-input missing in staff login modal');
  assert(html.includes('id="teacher-mobile-input"'), 'teacher-mobile-input missing in staff login modal');
  assert(html.includes('id="teacher-pin-input"'), 'teacher-pin-input missing in staff login modal');
  assert(html.includes('&mobile=eq.'), 'Supabase query does not filter on mobile');
  assert(html.includes('intendedRole === "principal" && account.role !== "principal"'), 'Strict principal role validation missing');
  assert(html.includes('intendedRole === "teacher" && account.role !== "teacher" && account.role !== "principal"'), 'Strict teacher role validation missing');
  assert(html.includes('submitSetPassword(udiseCode, mobile)'), 'submitSetPassword signature must accept udiseCode and mobile');
  assert(html.includes('saveUdisePassword(udiseCode, mobile, p1)'), 'saveUdisePassword must be called with (udiseCode, mobile, newPassword)');
  assert(html.includes('endpoint += "&mobile=eq." + encodeURIComponent(cleanMobile)'), 'saveUdisePassword PATCH must filter on mobile');
});

// TEST 20: Principal Supervision Desk — Manage Teachers (Add/Remove) & Homework Author Tracking
runTest('Principal Supervision Desk Manage Teachers (Add/Remove) flow and Homework Author Tracking', () => {
  assert(html.includes('openAddTeacherModal'), 'openAddTeacherModal function missing');
  assert(html.includes('submitAddTeacherForm'), 'submitAddTeacherForm function missing');
  assert(html.includes('handleRemoveTeacherPrompt'), 'handleRemoveTeacherPrompt function missing');
  assert(html.includes('Manage School Teachers'), 'Manage School Teachers section missing in Principal Desk');
  assert(html.includes('id="add-teacher-name"'), 'add-teacher-name input missing in Add Teacher modal');
  assert(html.includes('id="add-teacher-mobile"'), 'add-teacher-mobile input missing in Add Teacher modal');
  assert(html.includes('method: "POST"'), 'POST method missing in teacher addition');
  assert(html.includes('method: "DELETE"'), 'DELETE method missing in teacher removal');
  assert(html.includes('teacher.teacher_name || teacher.user_name || "Teacher"'), 'assigned_by fallback missing');
  assert(html.includes('teacher.teacher_mobile || teacher.mobile || ""'), 'teacher_mobile fallback missing in homework publishing');
});

// TEST 21: Clean Production State (No Hardcoded Demo Students or Fallback Users in index.html)
runTest('Production clean state without hardcoded demo students, teachers or quick login buttons', () => {
  assert(html.includes('var DEFAULT_UDISE_ACCOUNTS = [];'), 'DEFAULT_UDISE_ACCOUNTS must be empty array in production');
  assert(html.includes('var DEFAULT_STUDENT_ACCOUNTS = [];'), 'DEFAULT_STUDENT_ACCOUNTS must be empty array in production');
  assert(html.includes('var DEFAULT_SCHOOL_HOMEWORK = [];'), 'DEFAULT_SCHOOL_HOMEWORK must be empty array in production');
  assert(!html.includes('fillStudentDemoLogin'), 'Quick demo login fill function must be removed');
  assert(!html.includes('fillTeacherDemoLogin'), 'Quick demo teacher login function must be removed');
  assert(!html.includes('fillPrincipalDemoLogin'), 'Quick demo principal login function must be removed');
  assert(!html.includes('🧸 Nursery: Aarav'), 'Quick demo login buttons must be removed');
  assert(!html.includes('08150100101'), 'Old demo UDISE code 08150100101 must not be hardcoded in index.html');
  assert(!html.includes('08150100102'), 'Old demo UDISE code 08150100102 must not be hardcoded in index.html');
  assert(!html.includes('08150200201'), 'Old demo UDISE code 08150200201 must not be hardcoded in index.html');
  assert(!html.includes('STU-AA-101'), 'STU-AA-101 demo student account found in index.html');
  assert(!html.includes('STU-AA-102'), 'STU-AA-102 demo student account found in index.html');
  assert(!html.includes('STU-AA-103'), 'STU-AA-103 demo student account found in index.html');
  assert(!html.includes('Aarav Sharma'), 'Aarav Sharma demo student found in index.html');
  assert(!html.includes('Priya Patel'), 'Priya Patel demo student found in index.html');
  assert(!html.includes('Aryan Verma'), 'Aryan Verma demo student found in index.html');
  assert(!html.includes('Sunita Sharma'), 'Sunita Sharma demo teacher found in index.html');
  assert(!html.includes('Pooja Mehta'), 'Pooja Mehta demo teacher found in index.html');
  assert(!html.includes('Rekha Sharma'), 'Rekha Sharma demo teacher found in index.html');
  assert(html.includes('08150803534'), 'Production school 08150803534 (The Abacus Academy) missing in index.html');
});

// TEST 22: Principal Admin Full Access / Showcase Mode & Strict Student Lock
runTest('Principal unrestricted access across all classes & modules with Showcase Mode, while Students remain restricted', () => {
  assert(html.includes('openPrincipalShowcaseMode'), 'openPrincipalShowcaseMode function missing');
  assert(html.includes('📱 Preview All Classes &amp; Content (Showcase Mode)'), 'Showcase Mode button missing in HTML');
  assert(html.includes('← Back to Principal Desk'), 'Back to Principal Desk button missing in HTML');
  assert(html.includes('SHOWCASE MODE ACTIVE'), 'SHOWCASE MODE ACTIVE badge missing');
  assert(html.includes('if (appSession.type === "principal")') && html.includes('isBypassHwLock = true;'), 'openSection must bypass homework locks for Principal');
  assert(html.includes('if (appSession.focusedHomeworkQuiz && appSession.type !== "principal")'), 'renderCurrentView must not lock section for Principal');
  assert(html.includes('if (!appSession.focusedHomeworkQuiz || appSession.type === "principal")'), 'Picture World & Brain Booster must never be hidden for Principal');
  assert(html.includes('isStudentLocked'), 'isStudentLocked must remain intact for student protection');
  assert(html.includes("Quiz in progress! Tap 'Back to Homework' to exit"), 'openSection must continue blocking student navigation away from quiz');
});

// TEST 23: Attempt-Based Decimal Scoring & 10-Item Big-Picture Reward Shelf
runTest('Attempt-based decimal scoring (1.0, 0.5, 0.2, 0) and 10-item big-picture reward shelf', () => {
  const sqlStudent = fs.readFileSync('supabase_student_accounts.sql', 'utf8');
  assert(sqlStudent.includes('points NUMERIC(10,1)'), 'points NUMERIC(10,1) missing in student SQL schema');

  // Attempt scoring assertions in index.html
  assert(html.includes('questionAttempts: 0'), 'questionAttempts tracking missing in quizState');
  assert(html.includes('earned = 1.0;'), '1.0 point for 1st attempt missing');
  assert(html.includes('earned = 0.5;'), '0.5 points for 2nd attempt missing');
  assert(html.includes('earned = 0.2;'), '0.2 points for 3rd attempt missing');
  assert(html.includes('+1.0 pt 🌟'), 'Instant visual feedback +1.0 pt 🌟 missing');
  assert(html.includes('+0.5 pt 👍'), 'Instant visual feedback +0.5 pt 👍 missing');
  assert(html.includes('+0.2 pt ✨'), 'Instant visual feedback +0.2 pt ✨ missing');
  assert(html.includes('0 pt 💡'), 'Instant visual feedback 0 pt 💡 missing');
  assert(html.includes('.toFixed(1)'), 'Decimal rounding to 1 place missing');
  assert(html.includes('score-feedback-pill'), 'score-feedback-pill in completed card missing');

  // 10-item collectible rewards catalog assertions
  assert(html.includes('REWARD_SHELF_CATALOG'), 'REWARD_SHELF_CATALOG missing');
  assert(html.includes('Golden Ball'), 'Golden Ball reward missing');
  assert(html.includes('Magic Star'), 'Magic Star reward missing');
  assert(html.includes('Super Racing Car'), 'Super Racing Car reward missing');
  assert(html.includes('Rainbow Butterfly'), 'Rainbow Butterfly reward missing');
  assert(html.includes('Space Rocket'), 'Space Rocket reward missing');
  assert(html.includes('Golden Teddy'), 'Golden Teddy reward missing');
  assert(html.includes('Super Dino'), 'Super Dino reward missing');
  assert(html.includes('Magic Castle'), 'Magic Castle reward missing');
  assert(html.includes('Champion Crown'), 'Champion Crown reward missing');
  assert(html.includes('Abacus Mega Trophy'), 'Abacus Mega Trophy reward missing');

  // Large visual design, modals and progress bar
  assert(html.includes('openRewardShelfModal'), 'openRewardShelfModal function missing');
  assert(html.includes('openBigRewardPreview'), 'openBigRewardPreview function missing');
  assert(html.includes('showRewardUnlockCelebration'), 'showRewardUnlockCelebration function missing');
  assert(html.includes('renderRewardPicture'), 'renderRewardPicture function missing');
  assert(html.includes('reward-spotlight'), 'reward-spotlight frame missing');
  assert(html.includes('grid-template-columns:repeat(2, 1fr)'), '2-column grid for mobile reward shelf missing');
  assert(html.includes('next-reward-banner'), 'Next reward progress bar missing');
  assert(html.includes('🎁 My Rewards'), 'My Rewards button missing in dashboard header');
});

// TEST 24: Remote School Subscription Lock, Owner Super Admin Desk & Live Auto-Update
runTest('Remote school subscription lock, owner super admin desk & live update configuration', () => {
  // 1. Supabase SQL Schema for School Subscriptions
  assert(fs.existsSync('supabase_school_subscriptions.sql'), 'supabase_school_subscriptions.sql missing');
  const sqlSub = fs.readFileSync('supabase_school_subscriptions.sql', 'utf8');
  assert(sqlSub.includes('CREATE TABLE IF NOT EXISTS public.school_subscriptions'), 'school_subscriptions table missing in SQL');
  assert(sqlSub.includes('udise_code TEXT PRIMARY KEY'), 'udise_code primary key missing in SQL');
  assert(sqlSub.includes('is_active BOOLEAN'), 'is_active boolean missing in SQL');
  assert(sqlSub.includes('valid_until DATE'), 'valid_until date missing in SQL');
  assert(sqlSub.includes('max_students INTEGER'), 'max_students integer missing in SQL');
  assert(sqlSub.includes('08150803534'), 'Owner campus 08150803534 seed missing in SQL');
  assert(sqlSub.includes('08150803535'), 'GR Academy 08150803535 seed missing in SQL');

  // 2. Capacitor Config Live Auto-Update
  assert(fs.existsSync('capacitor.config.json'), 'capacitor.config.json missing');
  const capConfig = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8').replace(/^\uFEFF/, ''));
  assert(capConfig.server, 'Capacitor config server block missing');
  assert.strictEqual(capConfig.server.cleartext, false, 'cleartext must be false in server config');
  assert.strictEqual(capConfig.server.androidScheme, 'https', 'androidScheme must be https');

  // 3. Remote Subscription Validation & Expired Screen in index.html
  assert(html.includes('fetchSchoolSubscription'), 'fetchSchoolSubscription helper missing');
  assert(html.includes('isSubscriptionValid'), 'isSubscriptionValid validator missing');
  assert(html.includes('renderSubscriptionExpiredScreen'), 'renderSubscriptionExpiredScreen view missing');
  assert(html.includes('tamlio@ybl'), 'UPI ID tamlio@ybl missing in renewal instructions');
  assert(html.includes('copyUpiIdToClipboard'), 'copyUpiIdToClipboard function missing');
  assert(html.includes('8005829561'), 'WhatsApp renewal phone number missing');
  assert(html.includes('https://wa.me/918005829561'), 'WhatsApp payment link missing');

  // 4. Owner Super Admin Desk & Master Password Security
  assert(html.includes('openOwnerPasswordModal'), 'openOwnerPasswordModal missing');
  assert(html.includes('submitOwnerPassword'), 'submitOwnerPassword missing');
  assert(html.includes('b488c4c213af40daf535b81984d6acc7eaebd731abd3d2f9362a670068b727e2'), 'Owner master password SHA-256 hash missing');
  assert(html.includes('openOwnerSuperAdminPanel'), 'openOwnerSuperAdminPanel missing');
  assert(html.includes('renderOwnerSuperAdminPanelView'), 'renderOwnerSuperAdminPanelView missing');
  assert(html.includes('submitOwnerAddSchool'), 'submitOwnerAddSchool missing');
  assert(html.includes('toggleSchoolLock'), 'toggleSchoolLock missing');
  assert(html.includes('quickRenewSchool'), 'quickRenewSchool missing');

  // 5. UI Elements: Subtle Owner Button in Footer & Subtle Status in Principal Desk
  assert(html.includes('btn-owner-panel'), 'btn-owner-panel ID missing in HTML footer');
  assert(html.includes('⚙️ Owner'), 'Owner button text missing in landing screen footer');
  assert(html.includes('Owner Lifetime Free'), 'Owner Lifetime Free badge missing');
});

// TEST 25: Neutral Landing Screen, Dynamic Post-Login School Branding, Principal Logo Upload & Strict Cross-School Isolation
runTest('Neutral landing screen, dynamic post-login branding, principal logo upload & strict school isolation', () => {
  // 1. Clean Neutral Landing Screen (when logged out)
  assert(html.includes('id="header-school-logo" src="logo.jpeg" alt="Logo" class="logo-img" style="display:none;"'), 'Header school logo must be hidden by default on initial load');
  assert(html.includes('id="header-academy-badge" class="academy-badge" style="display:none;"'), 'Header academy badge must be hidden by default on initial load');
  assert(html.includes('id="btn-teacher-portal" class="nav-icon-btn teacher-badge-btn" onclick="safeAction(openTeacherLoginModal)" title="Teacher Portal" style="display:none;"'), 'Header teacher button must be hidden when logged out');
  assert(html.includes('id="btn-principal-desk" class="nav-icon-btn principal-badge-btn" onclick="safeAction(openPrincipalLoginModal)" title="Principal Supervision Desk" style="display:none;"'), 'Header principal button must be hidden when logged out');
  assert(html.includes('neutral-landing-hero'), 'neutral-landing-hero must be present in index.html');
  assert(html.includes('Smart Early Learning Platform'), 'Neutral tagline Smart Early Learning Platform missing');
  assert(html.includes('if (!isUserLoggedIn)'), 'renderHome must distinguish logged out vs logged in states');

  // 2. Dynamic Post-Login School Branding & Logo
  assert(html.includes('getSchoolLogo'), 'getSchoolLogo function missing in index.html');
  assert(html.includes('getActiveUdiseCode'), 'getActiveUdiseCode function missing in index.html');
  assert(html.includes('taa_school_logo_'), 'LocalStorage key for school logo caching missing');
  assert(html.includes('updateSchoolBrandingUI'), 'updateSchoolBrandingUI function missing');

  // 3. Principal "Change School Logo" Feature & Canvas Compression
  assert(html.includes('school-branding-card'), 'school-branding-card missing in Principal Desk');
  assert(html.includes('principal-logo-preview'), 'principal-logo-preview element missing');
  assert(html.includes('principal-logo-file'), 'principal-logo-file input missing');
  assert(html.includes('handlePrincipalLogoUpload'), 'handlePrincipalLogoUpload function missing');
  assert(html.includes('handlePrincipalLogoReset'), 'handlePrincipalLogoReset function missing');
  assert(html.includes('maxDim = 256'), 'Canvas 256x256 max dimension compression missing');
  assert(html.includes('toDataURL("image/png")'), 'Canvas Base64 export missing');
  assert(html.includes('PATCH'), 'PATCH request for logo update missing');

  // 4. Supabase SQL Schemas for Logo & Strict Student UDISE Isolation
  const sqlUdise = fs.readFileSync('supabase_udise_accounts.sql', 'utf8');
  assert(sqlUdise.includes('school_logo TEXT'), 'school_logo column missing in supabase_udise_accounts.sql');

  const sqlStudent = fs.readFileSync('supabase_student_accounts.sql', 'utf8');
  assert(sqlStudent.includes('udise_code TEXT'), 'udise_code column missing in supabase_student_accounts.sql');
  assert(sqlStudent.includes('idx_kids_students_udise_login'), 'idx_kids_students_udise_login index missing in supabase_student_accounts.sql');

  // 5. Strict Cross-School Isolation on Student / Parent Login
  assert(html.includes('id="student-udise-input"'), 'student-udise-input field missing in student login modal');
  assert(html.includes('Please enter your School UDISE Code!'), 'UDISE code validation prompt missing in submitStudentLogin');
  assert(html.includes('getStudentAccount(udiseCode, loginId)'), 'getStudentAccount must accept udiseCode and loginId for strict isolation');
  assert(html.includes('&udise_code=eq.'), 'Supabase query must filter by udise_code');
});

// TEST 26: Teacher Class Assignment (Nursery/LKG/UKG/ALL) in Principal Desk & Enforcement in Teacher Portal
runTest('Teacher Class Assignment (Nursery/LKG/UKG/ALL) in Principal Desk & Strict Teacher Portal Enforcement', () => {
  // 1. Supabase schema column
  const sqlUdise = fs.readFileSync('supabase_udise_accounts.sql', 'utf8');
  assert(sqlUdise.includes("assigned_class TEXT NOT NULL DEFAULT 'ALL'"), 'assigned_class column missing in supabase_udise_accounts.sql');

  // 2. Principal Supervision Desk: Add Teacher class dropdown
  assert(html.includes('id="new-teacher-class"'), 'new-teacher-class dropdown missing in Add Teacher form');
  assert(html.includes('value="Nursery"'), 'Nursery option missing in new-teacher-class');
  assert(html.includes('value="LKG"'), 'LKG option missing in new-teacher-class');
  assert(html.includes('value="UKG"'), 'UKG option missing in new-teacher-class');
  assert(html.includes('value="ALL"'), 'ALL option missing in new-teacher-class');

  // 3. Principal Supervision Desk: Inline class re-assignment and badges
  assert(html.includes('handleReassignTeacherClass'), 'handleReassignTeacherClass function missing in index.html');
  assert(html.includes('📚 All Classes'), 'All Classes badge missing in Principal Desk teachers tab');
  assert(html.includes('onchange="handleReassignTeacherClass('), 'Inline class reassign select missing in teachers list');

  // 4. Session & class lock enforcement
  assert(html.includes('assigned_class: assignedClass'), 'submitAddTeacherForm must pass assigned_class');
  assert(html.includes('appSession.teacherObj.assigned_class'), 'appSession must track assigned_class');
  assert(html.includes('ASSIGNED CLASS LOCK'), 'ASSIGNED CLASS LOCK banner missing in Teacher Portal');
  assert(html.includes('Access Restricted: You are assigned strictly to'), 'Restricted class switch alert missing in switchTeacherClass');
});

console.log('\n----------------------------------------------------------------');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('----------------------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
}
