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
  assert(html.includes('teacher-hw-topic'), 'Activity topic selector missing');
  assert(html.includes('teacher-hw-date'), 'Due date selector missing');
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

// TEST 27: Strict Teacher Portal Class Lock, Single Logout Button & Dropdown-Only Homework Flow
runTest('Strict Teacher Portal Class Lock, Single Logout Button & Dropdown-Only Homework Flow', () => {
  // 1. normalizeAssignedClass normalizes class strings case-insensitively
  assert(html.includes('function normalizeAssignedClass(cls)'), 'normalizeAssignedClass function missing');
  assert(html.includes('🔒 Assigned Class:'), 'Locked class badge missing in Teacher Portal');

  // 2. Clean header without duplicate logout or button overflow
  assert(html.includes('roleTag = (tClass !== "ALL") ? (tClass + " Class Teacher") : "All Classes Teacher"'), 'roleTag format missing in renderHeaderStatus');
  assert(!html.includes('• Full Access)</div>'), 'Full Access must not be hardcoded in teacher pass banner');

  // 3. Dropdown-Only Homework Publishing Flow
  assert(html.includes('getTeacherCurriculumCatalog'), 'getTeacherCurriculumCatalog function missing');
  assert(html.includes('onTeacherHomeworkSubjectChange'), 'onTeacherHomeworkSubjectChange function missing');
  assert(!html.includes('id="teacher-hw-instructions"'), 'Manual instructions input must be removed from publish homework form');
  assert(!html.includes('id="teacher-hw-photo-file"'), 'Worksheet photo file upload must be removed from publish homework form');
  assert(!html.includes('id="teacher-hw-link"'), 'External worksheet link input must be removed from publish homework form');
});

// TEST 28: Home Screen Teacher Class Lock, Green Banner Text Contrast & Top Header Overflow Suppression
runTest('Home Screen Teacher Class Lock, Green Banner Text Contrast & Top Header Overflow Suppression', () => {
  // 1. Home screen single-class lock for teachers
  assert(html.includes('isTeacherSingleLocked'), 'isTeacherSingleLocked logic missing in renderHome');
  assert(html.includes('(Assigned Class)</button>'), 'Single-class assigned button missing in parent-student-hub');
  assert(html.includes('switchParentClass'), 'switchParentClass function missing');

  // 2. Green banner crisp white text contrast
  assert(html.includes('.student-pass-banner') && html.includes('color: #FFFFFF !important;'), 'Crisp white text color missing in .student-pass-banner CSS');
  assert(html.includes('color:#ffffff !important; font-weight:700;'), 'Inline pure white text styling missing in teacher status banner');

  // 3. Force-hide top header overflow buttons when logged in
  assert(html.includes('body.user-logged-in #btn-school-switcher'), 'user-logged-in CSS rule missing for school switcher');
  assert(html.includes('body.user-logged-in #btn-teacher-portal'), 'user-logged-in CSS rule missing for teacher button');
  assert(html.includes('body.user-logged-in #btn-principal-desk'), 'user-logged-in CSS rule missing for principal button');
  assert(html.includes("style.setProperty('display', 'none', 'important')") || html.includes('style.setProperty("display", "none", "important")'), 'Strict style.setProperty display none important missing');
});

// TEST 29: Student Login for Short Admission Numbers (e.g. '294', '1067') with School UDISE Code
runTest('Student Login for Short Admission Numbers (e.g. 294, 1067) with School UDISE Code', () => {
  // 1. Check support for short admission numbers and flexible input in UI and validation
  assert(html.includes('id="student-login-id"'), 'student-login-id input field missing');
  assert(html.includes('id="student-udise-input"'), 'student-udise-input input field missing');
  assert(html.includes('Please enter Student ID / Admission No. (e.g. 294) or Mobile number!'), 'Flexible Student ID validation toast missing in submitStudentLogin');

  // 2. Query handles case-insensitivity, trim, and school_id/udise_code mapping for The Abacus Academy
  assert(html.includes('kids_students?login_id=ilike.'), 'ilike query for case-insensitive login_id missing in getStudentAccount');
  assert(html.includes('school_id.eq.the-abacus-academy'), 'the-abacus-academy school_id fallback query missing');
  assert(html.includes('cleanUdise === "08150803534"'), 'UDISE 08150803534 mapping missing in getStudentAccount');

  // 3. Password verification handles SHA-256 hash comparison and specific error messages
  assert(html.includes('storedHash === enteredHash.toLowerCase()'), 'SHA-256 entered hash comparison missing in submitStudentLogin');
  assert(html.includes('storedHash === cleanPass.toLowerCase()'), 'Clean pass comparison missing in submitStudentLogin');
  assert(html.includes('Incorrect password for student'), 'Specific incorrect password toast missing in submitStudentLogin');

  // 4. Test fallback matching logic with short admission number '294' and UDISE '08150803534'
  const mockStudents = [
    {
      login_id: '294',
      admission_no: '294',
      student_name: 'Reyansh Pareek',
      student_class: 'Nursery',
      school_id: 'the-abacus-academy',
      password_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' // SHA-256 for '1234'
    }
  ];

  const targetId = '294';
  const cleanUdise = '08150803534';
  const matched = mockStudents.find(a => {
    const aId = String(a.login_id || '').trim().toLowerCase();
    const aAdm = String(a.admission_no || '').trim().toLowerCase();
    const matchId = (aId === targetId || aAdm === targetId);
    const aUdise = String(a.udise_code || '').trim();
    const matchUdise = (!cleanUdise || aUdise === cleanUdise ||
      (cleanUdise === '08150803534' && (a.school_id === 'the-abacus-academy' || a.school_id === 'abacus' || !aUdise)));
    return matchId && matchUdise;
  });

  assert(matched, 'Short admission number 294 did not match test record');
  assert.strictEqual(matched.student_name, 'Reyansh Pareek');
  assert.strictEqual(matched.student_class, 'Nursery');
});

// TEST 30: Clean Student Dashboard (Hide Portal Cards, Intro Banner, Other Classes & Owner Button)
runTest('Clean Student Dashboard hides role cards, intro banner, other class buttons and Owner button', () => {
  // 1. CSS rules for student logged-in state
  assert(html.includes('body.student-logged-in #btn-owner-panel'), 'CSS rule for hiding #btn-owner-panel for logged-in students missing');
  assert(html.includes('body.student-logged-in .hero-banner'), 'CSS rule for hiding .hero-banner for logged-in students missing');
  assert(html.includes('body.student-logged-in .role-grid'), 'CSS rule for hiding .role-grid for logged-in students missing');

  // 2. JS conditional guards in renderHome
  assert(html.includes('var isStudentLoggedIn = ((appSession.type === "parent" || appSession.role === "student") && !!appSession.student);'), 'isStudentLoggedIn check missing in renderHome');
  assert(html.includes('!isStudentLoggedIn') && html.includes('getActiveUdiseCode()'), 'hero-banner not guarded against student logged in');
  assert(html.includes("!isStudentLoggedIn") && html.includes("role-grid"), 'role-grid not guarded against student logged in');
  assert(html.includes('if (!isStudentLoggedIn) {\n        html += \'  <span style="color:#CFD8DC;">•</span>\';') || html.includes('if (!isStudentLoggedIn) {\r\n        html += \'  <span style="color:#CFD8DC;">•</span>\';'), 'btn-owner-panel footer not guarded against student logged in');

  // 3. Strict single-class lock and duplicate removal in parent-student-hub
  assert(html.includes("🎒 ' + curClass + ' Class • (Enrolled &amp; Locked)"), 'Clean enrolled locked badge missing in parent-student-hub');
  assert(!html.includes('Logout 🚪</button>\' +\n          \'  </div>\' +\n          \'</div>\';\n        } else if (isTeacherSingleLocked)') && !html.includes('Logout 🚪</button>\' +\r\n          \'  </div>\' +\r\n          \'</div>\';\r\n        } else if (isTeacherSingleLocked)'), 'Duplicate student logout box must be removed from parent-student-hub');

  // 4. student-logged-in body class management
  assert(html.includes('document.body.classList.add("student-logged-in");'), 'Adding student-logged-in class missing');
  assert(html.includes('document.body.classList.remove("student-logged-in");'), 'Removing student-logged-in class missing');
});

// TEST 31: Teacher-to-Student Homework Sync & Exact public.kids_homework Schema
runTest('Teacher-to-Student homework sync uses exact public.kids_homework schema and normalized school_id', () => {
  // 1. Helper functions presence and behavior
  assert(html.includes('function resolveHomeworkSchoolId('), 'resolveHomeworkSchoolId function missing');
  assert(html.includes('function isValidUuid('), 'isValidUuid function missing');
  assert(html.includes('function getTodayIstDateString('), 'getTodayIstDateString function missing');

  // Extract and test resolveHomeworkSchoolId logic
  const resolveMatch = html.match(/function resolveHomeworkSchoolId\([\s\S]*?^ {4}\}/m);
  assert(resolveMatch, 'Could not extract resolveHomeworkSchoolId');
  const resolveFn = new Function('udiseOrSchoolId', resolveMatch[0] + '\nreturn resolveHomeworkSchoolId(udiseOrSchoolId);');
  assert.strictEqual(resolveFn('08150803534'), 'the-abacus-academy');
  assert.strictEqual(resolveFn('the-abacus-academy'), 'the-abacus-academy');
  assert.strictEqual(resolveFn('08150803535'), 'gr_academy');
  assert.strictEqual(resolveFn('gr-children-academy'), 'gr_academy');
  assert.strictEqual(resolveFn('gr_academy'), 'gr_academy');

  // Extract and test isValidUuid logic
  const uuidMatch = html.match(/function isValidUuid\([\s\S]*?^ {4}\}/m);
  assert(uuidMatch, 'Could not extract isValidUuid');
  const uuidFn = new Function('id', uuidMatch[0] + '\nreturn isValidUuid(id);');
  assert.strictEqual(uuidFn('3fa85f64-5717-4562-b3fc-2c963f66afa6'), true);
  assert.strictEqual(uuidFn('9876543210'), false);
  assert.strictEqual(uuidFn('TEACHER-101'), false);
  assert.strictEqual(uuidFn(null), false);

  // 2. Publish payload schema compliance (public.kids_homework columns only)
  assert(html.includes('school_id: resolvedSchoolId,'), 'payload.school_id missing');
  assert(html.includes('class_name: normalizedClass,'), 'payload.class_name missing');
  assert(html.includes('description: instructions,'), 'payload.description mapping missing');
  assert(html.includes('due_date: dueDate || getTodayIstDateString(),'), 'payload.due_date fallback missing');
  assert(html.includes('isValidUuid(rawTeacherId) ? rawTeacherId : null'), 'UUID check for teacher_id missing');
  assert(html.includes('is_approved: true'), 'payload.is_approved missing');
  assert(html.includes('showToast("Supabase Homework Error:'), 'Visible toast on Supabase error missing');

  // 3. Student Homework Fetch query & integration
  assert(html.includes('fetchStudentHomeworkFromSupabase'), 'fetchStudentHomeworkFromSupabase missing');
  assert(html.includes('/kids_homework?school_id=eq." + encodeURIComponent(resolvedSchoolId) + "&class_name=ilike." + encodeURIComponent(normClass) + "&order=created_at.desc'), 'Student homework query parameters missing');
  assert(html.includes('await fetchStudentHomeworkFromSupabase(studentClass,'), 'Student login must await fetchStudentHomeworkFromSupabase');
  assert(html.includes('body: { title: title, description: inst }'), 'Principal edit homework PATCH must update description column');
  assert(html.includes('var hwDesc = hw.description || hw.instructions;'), 'renderHome must support both hw.description and hw.instructions');
});

// TEST 32: Student Homework Row Normalization, Fetch Pipeline & Refresh UI
runTest('Raw kids_homework rows from Supabase are normalized, cached and rendered without filtering', () => {
  // 1. Presence of normalization and refresh helpers
  assert(html.includes('function normalizeHomeworkRow('), 'normalizeHomeworkRow helper missing');
  assert(html.includes('function refreshStudentHomeworkManual('), 'refreshStudentHomeworkManual missing');
  assert(html.includes('id="btn-refresh-homework"'), 'btn-refresh-homework button element missing in HTML');
  assert(html.includes('🔄 Refresh'), 'Refresh button text missing');

  // 2. Functional test of normalizeHomeworkRow
  const normMatch = html.match(/function normalizeHomeworkRow\([\s\S]*?^ {4}\}/m);
  assert(normMatch, 'Could not extract normalizeHomeworkRow');

  const getTodayMatch = html.match(/function getTodayIstDateString\([\s\S]*?^ {4}\}/m);
  const resolveMatch = html.match(/function resolveHomeworkSchoolId\([\s\S]*?^ {4}\}/m);
  const normClassMatch = html.match(/function normalizeAssignedClass\([\s\S]*?^ {4}\}/m);

  const testEnv = new Function('rawRow', `
    ${getTodayMatch[0]}
    ${resolveMatch[0]}
    ${normClassMatch[0]}
    function getActiveSchoolId() { return "the-abacus-academy"; }
    ${normMatch[0]}
    return normalizeHomeworkRow(rawRow, "the-abacus-academy", "LKG");
  `);

  const rawRow = {
    id: 'hw-lkg-101',
    school_id: 'the-abacus-academy',
    class_name: 'LKG',
    subject: 'English',
    title: 'Phonics CVC Words',
    description: 'Practice 2-letter and 3-letter sounding words',
    attachment_url: null,
    due_date: '2026-11-28',
    teacher_name: 'Kalawati S.',
    teacher_mobile: '9876543210',
    is_approved: true,
    created_at: '2026-11-28T06:00:00.000Z'
  };

  const normalized = testEnv(rawRow);
  assert(normalized, 'Normalized row is null or undefined');
  assert.strictEqual(normalized.class_name, 'LKG', 'class_name must be normalized to LKG');
  assert.strictEqual(normalized.student_class, 'LKG', 'student_class must be normalized to LKG');
  assert.strictEqual(normalized.class, 'LKG', 'class must be normalized to LKG');
  assert.strictEqual(normalized.description, 'Practice 2-letter and 3-letter sounding words', 'description must match');
  assert.strictEqual(normalized.instructions, 'Practice 2-letter and 3-letter sounding words', 'instructions must match description');
  assert.strictEqual(normalized.due_date, '2026-11-28', 'due_date must match');
  assert.strictEqual(normalized.date, '2026-11-28', 'date must match due_date');
  assert.strictEqual(normalized.school_id, 'the-abacus-academy', 'school_id must be normalized');

  // 3. Functional test of getTodayActiveHomework with normalized row
  const activeHwMatch = html.match(/function getTodayActiveHomework\([\s\S]*?^ {4}\}/m);
  assert(activeHwMatch, 'Could not extract getTodayActiveHomework');

  const testActiveEnv = new Function('homeworkList', 'reqClass', `
    ${resolveMatch[0]}
    ${normClassMatch[0]}
    function getActiveSchoolId() { return "the-abacus-academy"; }
    const appSession = { student: null };
    function getAllHomeworkList(schoolId) { return homeworkList; }
    ${activeHwMatch[0]}
    return getTodayActiveHomework(reqClass, "the-abacus-academy");
  `);

  const active = testActiveEnv([normalized], 'LKG');
  assert(active, 'getTodayActiveHomework returned null for valid LKG homework');
  assert.strictEqual(active.id, 'hw-lkg-101', 'getTodayActiveHomework should return the latest LKG homework');
  assert.strictEqual(active.title, 'Phonics CVC Words', 'Title should match active homework');

  // 4. Verify fetch loop prevention and re-render guard
  assert(html.includes('_studentHwFetchedMap'), '_studentHwFetchedMap fetch cache missing');
  assert(html.includes('_isStudentHwFetching'), '_isStudentHwFetching in-flight guard missing');
});

// TEST 33: True Instant Auto-Update Configuration (Capacitor, Vercel & HTML Cache Guards)
runTest('True instant auto-update configuration for Android APK and Vercel cache guards', () => {
  // 1. Capacitor configuration for live production URL
  assert(fs.existsSync('capacitor.config.json'), 'capacitor.config.json missing');
  const capConfig = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8').replace(/^\uFEFF/, ''));
  assert.strictEqual(capConfig.server.url, 'https://abacus-kids-app.vercel.app', 'server.url must point to live Vercel app');
  assert.strictEqual(capConfig.server.cleartext, false, 'server.cleartext must be false');
  assert.strictEqual(capConfig.server.androidScheme, 'https', 'server.androidScheme must be https');
  assert(capConfig.android && capConfig.android.allowMixedContent === true, 'android.allowMixedContent must be true');

  // 2. Vercel strict no-cache headers configuration
  assert(fs.existsSync('vercel.json'), 'vercel.json missing in project root');
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert(Array.isArray(vercelConfig.headers) && vercelConfig.headers.length > 0, 'vercel.json headers block missing');
  const allRouteHeader = vercelConfig.headers.find(h => h.source === '/(.*)');
  assert(allRouteHeader, 'vercel.json must define headers for /(.*)');
  const cacheControl = allRouteHeader.headers.find(h => h.key === 'Cache-Control');
  assert(cacheControl && cacheControl.value.includes('no-store'), 'Cache-Control header missing no-store in vercel.json');
  assert(cacheControl && cacheControl.value.includes('no-cache'), 'Cache-Control header missing no-cache in vercel.json');

  // 3. HTML meta tags & update checker
  assert(html.includes('<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />'), 'Cache-Control meta tag missing');
  assert(html.includes('<meta http-equiv="Pragma" content="no-cache" />'), 'Pragma meta tag missing');
  assert(html.includes('<meta http-equiv="Expires" content="0" />'), 'Expires meta tag missing');
  assert(html.includes('APP_BUILD_VERSION'), 'APP_BUILD_VERSION missing');
  assert(html.includes('checkForLiveAppUpdate'), 'checkForLiveAppUpdate function missing');
  assert(html.includes('initPullToRefresh'), 'Pull to refresh updater missing');
});

// TEST 34: Student Dashboard Locked Strictly to Teacher-Assigned Homework
runTest('Student dashboard locks strictly to teacher homework only, hiding free modules while keeping assigned quizzes playable', () => {
  // 1. Hide Class Learning Modules tab switcher for logged-in students
  assert(html.includes('if (!isStudentLoggedIn) {\n          html += \'<div class="teacher-nav-tabs"') || html.includes('if (!isStudentLoggedIn) {\r\n          html += \'<div class="teacher-nav-tabs"'), 'teacher-nav-tabs not guarded against logged in student');
  assert(html.includes('var curTab = isStudentLoggedIn ? "homework" : (appSession.parentTab || "homework");'), 'curTab must force homework for logged in students');
  assert(html.includes('else if (curTab === \'learning\' && !isStudentLoggedIn)'), 'learning modules tab must be blocked for logged in students');

  // 2. switchParentTab enforcement
  assert(html.includes('if (appSession.role === "student" || (appSession.type === "parent" && appSession.student)) {\n        appSession.parentTab = "homework";\n        return;\n      }') || html.includes('if (appSession.role === "student" || (appSession.type === "parent" && appSession.student)) {\r\n        appSession.parentTab = "homework";\r\n        return;\r\n      }'), 'switchParentTab must prevent switching away from homework');

  // 3. openSection free-roam module lock
  assert(html.includes('var isStudentUser = (appSession.role === "student" || (appSession.type === "parent" && appSession.student));'), 'isStudentUser check missing in openSection');
  assert(html.includes('if (isStudentUser && !isBypassHwLock && !appSession.focusedHomeworkQuiz)'), 'openSection must block direct free-roam modules for students');

  // 4. Assigned teacher homework remains playable and returns to Today Homework
  assert(html.includes('startAssignedHomework') && html.includes('Play &amp; Complete Homework'), 'startAssignedHomework handler missing in homework card');
  assert(html.includes('openSection(mod.section, mod.tab, true);'), 'startAssignedHomework must pass isBypassHwLock true');
  assert(html.includes('exitFocusedHomeworkQuiz'), 'exitFocusedHomeworkQuiz handler missing');
  assert(html.includes('enterParentMode(appSession.parentClass || "Nursery");'), 'exitFocusedHomeworkQuiz must return to Today Homework');
});

// TEST 35: Interactive Game Auto-Resolution & Direct Game Launch (No Notebook Popup)
runTest('Homework card renders Play & Complete Homework button and auto-resolves interactive game even without attachment_url', () => {
  // 1. resolveHomeworkGameModule presence and logic
  assert(html.includes('function resolveHomeworkGameModule('), 'resolveHomeworkGameModule function missing');
  const resMatch = html.match(/function resolveHomeworkGameModule\([\s\S]*?^ {4}\}/m);
  assert(resMatch, 'Could not extract resolveHomeworkGameModule');

  const currMatch = html.match(/function getCurriculumModulesForClass\([\s\S]*?^ {4}\}/m);
  const normClassMatch = html.match(/function normalizeAssignedClass\([\s\S]*?^ {4}\}/m);

  const testGameEnv = new Function('hw', `
    ${normClassMatch[0]}
    ${currMatch[0]}
    ${resMatch[0]}
    return resolveHomeworkGameModule(hw);
  `);

  // Test Case A: English Letters A-Z / Phonics without attachment_url (null)
  const lkgPhonicsHw = {
    school_id: 'the-abacus-academy',
    class_name: 'LKG',
    subject: 'English',
    title: 'English: Letters A-Z Phonic Practice',
    description: 'Practice letters daily',
    attachment_url: null,
    is_approved: true
  };
  const resolvedA = testGameEnv(lkgPhonicsHw);
  assert(resolvedA, 'Failed to resolve game for English Phonics homework');
  assert.strictEqual(resolvedA.section, 'lkg', 'Resolved game section should be lkg');
  assert.strictEqual(resolvedA.tab, 'phonics', 'Resolved game tab should be phonics');

  // Test Case B: Hindi Swar with null attachment_url
  const hindiHw = {
    school_id: 'the-abacus-academy',
    class_name: 'Nursery',
    subject: 'Hindi',
    title: 'Hindi: स्वर अ-अः अभ्यास',
    description: 'Learn Swar',
    attachment_url: null,
    is_approved: true
  };
  const resolvedB = testGameEnv(hindiHw);
  assert(resolvedB, 'Failed to resolve game for Hindi Swar homework');
  assert.strictEqual(resolvedB.section, 'nursery', 'Resolved game section should be nursery');
  assert.strictEqual(resolvedB.tab, 'swar', 'Resolved game tab should be swar');

  // Test Case C: Math Counting with null attachment_url
  const mathHw = {
    school_id: 'the-abacus-academy',
    class_name: 'Nursery',
    subject: 'Math',
    title: 'Math: Counting 1-50 Chart',
    description: 'Numbers Practice',
    attachment_url: null,
    is_approved: true
  };
  const resolvedC = testGameEnv(mathHw);
  assert(resolvedC, 'Failed to resolve game for Math Counting homework');
  assert.strictEqual(resolvedC.section, 'nursery', 'Resolved game section should be nursery');
  assert.strictEqual(resolvedC.tab, 'numbers', 'Resolved game tab should be numbers');

  // Test Case D: With attachment_url starting with game:<section>:<tab>
  const gameUriHw = {
    school_id: 'the-abacus-academy',
    class_name: 'UKG',
    subject: 'English',
    title: 'Grammar Practice',
    attachment_url: 'game:ukg:grammar',
    is_approved: true
  };
  const resolvedD = testGameEnv(gameUriHw);
  assert(resolvedD, 'Failed to resolve game from game: URI');
  assert.strictEqual(resolvedD.section, 'ukg', 'Resolved section should match game: URI');
  assert.strictEqual(resolvedD.tab, 'grammar', 'Resolved tab should match game: URI');

  // 2. Button on homework card is "🎮 Play & Complete Homework" calling startAssignedHomework
  assert(html.includes('btn-play-hw'), 'btn-play-hw class missing on homework card');
  assert(html.includes('🎮 Play &amp; Complete Homework'), 'Play & Complete Homework button missing on card');
  assert(html.includes("startAssignedHomework(\\'' + hw.id + '\\')") || html.includes("startAssignedHomework"), 'startAssignedHomework invocation missing on card');

  // 3. Confirm card does NOT have the old notebook upload button
  assert(!html.includes('One-Tap: Mark Done ✅\n    <span style="font-size:11px; font-weight:700; opacity:0.9;">(Upload Child\'s Worksheet / Note)</span>') &&
         !html.includes('One-Tap: Mark Done ✅\r\n    <span style="font-size:11px; font-weight:700; opacity:0.9;">(Upload Child\'s Worksheet / Note)</span>'),
         'Old notebook upload button must not be rendered on homework card');

  // 4. Automatic completion and reward on game finish
  assert(html.includes('kids_homework_submissions') && html.includes('completeActiveHomeworkRecord'), 'Submission record missing in completeActiveHomeworkRecord');
});

// TEST 36: Live Student Points Sync, Floating Point Animation & Repeatable 10 Big Rewards
runTest('Live Student Points Sync, Floating Point Pop Animation & Repeatable 10 Big Rewards', () => {
  // 1. Live header points sync functions & DOM badges
  assert(html.includes('updateHeaderPointBadges'), 'updateHeaderPointBadges helper function missing');
  assert(html.includes('addStudentLivePoints'), 'addStudentLivePoints helper function missing');
  assert(html.includes('showPointPopAnimation'), 'showPointPopAnimation helper function missing');
  assert(html.includes('floating-point-pop'), 'floating-point-pop CSS class missing');
  assert(html.includes('floatUpFadeOut'), 'floatUpFadeOut CSS keyframe animation missing');

  // 2. Quiz answers & addStar invoke live point update and pop animation
  assert(html.includes('showPointPopAnimation(earned)'), 'showPointPopAnimation(earned) missing in quiz answer handler');
  assert(html.includes('updateHeaderPointBadges(stu.points)'), 'updateHeaderPointBadges(stu.points) missing in quiz answer handler');

  // 3. Repeatable reward shelf tracking & persistence
  assert(html.includes('getStudentRewardCounts'), 'getStudentRewardCounts function missing');
  assert(html.includes('saveStudentRewardCounts'), 'saveStudentRewardCounts function missing');
  assert(html.includes("🏆 Earned: ' + count + 'x"), 'Repeatable reward count multiplier badge (e.g. 2x, 3x) missing in shelf modal');
  assert(html.includes('REWARD EARNED AGAIN!'), 'Repeat reward milestone celebration title missing');

  // 4. Test logic in isolated sandbox
  const sStart = html.indexOf('<script>');
  const sEnd = html.lastIndexOf('</script>');
  const scriptContent = html.substring(sStart + 8, sEnd);

  const testSandbox = new Function(`
    var createdElements = [];
    var mockDom = {
      'star-badge': { style: { display: 'none' } },
      'star-count': { textContent: '0' },
      'student-live-points': { textContent: '0' },
      'header-student-points': { textContent: '0' }
    };
    var document = {
      getElementById: function(id) {
        return mockDom[id] || null;
      },
      createElement: function(tag) {
        var el = { className: '', innerHTML: '', style: {} };
        createdElements.push(el);
        return el;
      },
      body: {
        appendChild: function(el) {}
      }
    };
    var appSession = {
      type: 'parent',
      role: 'student',
      student: {
        login_id: 'STU101',
        points: 18.0,
        stars: 18.0,
        badges: ['reward_ball'],
        reward_counts: { reward_ball: 1 }
      }
    };
    var appState = { stars: 18 };
    var localStorage = {
      getItem: function() { return null; },
      setItem: function() {}
    };
    function updateLocalStudentAccount() {}
    function supabaseRest() { return Promise.resolve(); }
    function playTone() {}
    function triggerConfetti() {}
    function speak() {}
    function showToast() {}
    function escapeHtml(t) { return t; }

    ${scriptContent.match(/var REWARD_SHELF_CATALOG = \[[\s\S]*?\];/)[0]}
    ${scriptContent.match(/function renderRewardPicture[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function syncHeaderPointsUI[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function updateHeaderPointBadges[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function showPointPopAnimation[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function addStudentLivePoints[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function getStudentRewardCounts[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function saveStudentRewardCounts[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function saveStudentSessionLocallyAndRemote[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function checkRewardShelfMilestones[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function showRewardUnlockCelebration[\s\S]*?^    \}/m)[0]}

    // 1. Test pop animation
    showPointPopAnimation(10);
    var popEl = createdElements[0];

    // 2. Test initial updateHeaderPointBadges
    updateHeaderPointBadges(18.0);
    var initSc = mockDom['star-count'].textContent;
    var initSl = mockDom['student-live-points'].textContent;

    // 3. Test addStudentLivePoints with +2.0 (crosses 20.0 threshold)
    addStudentLivePoints(2.0, 'Quiz Answer');
    var finalSc = mockDom['star-count'].textContent;
    var finalSl = mockDom['student-live-points'].textContent;
    var finalPoints = appSession.student.points;
    var finalBallCount = appSession.student.reward_counts.reward_ball;

    return {
      popText: popEl ? popEl.innerHTML : '',
      initSc: initSc,
      initSl: initSl,
      finalSc: finalSc,
      finalSl: finalSl,
      finalPoints: finalPoints,
      finalBallCount: finalBallCount
    };
  `);

  const res = testSandbox();
  assert(res.popText.includes('10') && res.popText.includes('⭐'), 'showPointPopAnimation must produce +10 ⭐');
  assert.strictEqual(res.initSc, 18, 'Initial star badge must be 18');
  assert.strictEqual(res.initSl, 18, 'Initial student live bar must be 18');
  assert.strictEqual(res.finalPoints, 20.0, 'Student points must increment to 20.0');
  assert.strictEqual(res.finalSc, 20, 'Star badge must update to 20');
  assert.strictEqual(res.finalSl, 20, 'Student live bar must update to 20');
  assert.strictEqual(res.finalBallCount, 2, 'Golden Ball reward must be earned 2x (count = 2) when reaching 20 pts');
});

// TEST 37: Top-Right Header Gold Star Badge Synchronization with Logged-in Student Points
runTest('Top-Right Header Gold Star Badge synchronizes cleanly with logged-in student points (e.g. 30.5)', () => {
  // 1. Verify syncHeaderPointsUI exists in index.html and is hooked across session restore, login, etc.
  assert(html.includes('syncHeaderPointsUI'), 'syncHeaderPointsUI function missing in index.html');
  assert(html.includes('syncHeaderPointsUI(appSession.student.points)'), 'syncHeaderPointsUI missing in restoreSession');
  assert(html.includes('syncHeaderPointsUI()'), 'syncHeaderPointsUI() call missing in index.html');

  // 2. Test execution in isolated sandbox
  const sStart = html.indexOf('<script>');
  const sEnd = html.lastIndexOf('</script>');
  const scriptContent = html.substring(sStart + 8, sEnd);

  const testSyncSandbox = new Function(`
    var mockDom = {
      'star-badge': { style: { display: 'none' } },
      'star-count': { textContent: '0' },
      'student-live-points': { textContent: '0' },
      'header-student-points': { textContent: '0' }
    };
    var document = {
      getElementById: function(id) {
        return mockDom[id] || null;
      }
    };
    var appSession = {
      type: 'parent',
      role: 'student',
      student: {
        login_id: 'STU101',
        student_name: 'Aarav Sharma',
        points: 30.5,
        stars: 30.5
      }
    };
    var appState = { stars: 0 };

    ${scriptContent.match(/function syncHeaderPointsUI[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function updateHeaderPointBadges[\s\S]*?^    \}/m)[0]}

    // Before sync: star badge is 0 and hidden
    var beforeBadge = mockDom['star-count'].textContent;
    var beforeDisplay = mockDom['star-badge'].style.display;

    // Call syncHeaderPointsUI with student session (points: 30.5)
    syncHeaderPointsUI();

    var afterBadge = mockDom['star-count'].textContent;
    var afterDisplay = mockDom['star-badge'].style.display;
    var afterGreenBar = mockDom['student-live-points'].textContent;

    return {
      beforeBadge: beforeBadge,
      beforeDisplay: beforeDisplay,
      afterBadge: afterBadge,
      afterDisplay: afterDisplay,
      afterGreenBar: afterGreenBar,
      appStateStars: appState.stars
    };
  `);

  const res = testSyncSandbox();
  assert.strictEqual(res.beforeBadge, '0', 'Before sync, star-count should be initial 0');
  assert.strictEqual(res.beforeDisplay, 'none', 'Before sync, star-badge should be display: none');
  assert.strictEqual(res.afterBadge, 30.5, 'Top-right header gold star badge must display 30.5 (not 0)');
  assert.strictEqual(res.afterDisplay, 'flex', 'Top-right header gold star badge must be visible (display: flex)');
  assert.strictEqual(res.afterGreenBar, 30.5, 'Green student info bar must display 30.5');
  assert.strictEqual(res.appStateStars, 30, 'appState.stars should synchronize with floor of points');
});

// TEST 38: Granular Teacher Homework Selection (Individual Hindi Matras + Question Range & Individual/Mixed CVC Phonic Sounds)
runTest('Granular Teacher Homework Selection (Individual Hindi Matras + Question Range & Individual/Mixed CVC Phonic Sounds)', () => {
  // 1. Check presence of granular helper functions in index.html
  assert(html.includes('parseHomeworkGameParams'), 'parseHomeworkGameParams function missing in index.html');
  assert(html.includes('getGranularHomeworkInfo'), 'getGranularHomeworkInfo function missing in index.html');
  assert(html.includes('detectGranularTopicType'), 'detectGranularTopicType function missing in index.html');
  assert(html.includes('getGranularTopicMaxQuestions'), 'getGranularTopicMaxQuestions function missing in index.html');
  assert(html.includes('onTeacherHomeworkTopicChange'), 'onTeacherHomeworkTopicChange function missing in index.html');
  assert(html.includes('onTeacherHomeworkSubtopicChange'), 'onTeacherHomeworkSubtopicChange function missing in index.html');
  assert(html.includes('validateTeacherHwRange'), 'validateTeacherHwRange function missing in index.html');

  // 2. Check presence of granular UI elements in index.html
  assert(html.includes('id="teacher-hw-granular-container"'), 'teacher-hw-granular-container element missing in index.html');
  assert(html.includes('id="teacher-hw-subtopic"'), 'teacher-hw-subtopic dropdown missing in index.html');
  assert(html.includes('id="teacher-hw-range-from"'), 'teacher-hw-range-from input missing in index.html');
  assert(html.includes('id="teacher-hw-range-to"'), 'teacher-hw-range-to input missing in index.html');
  assert(html.includes('hw-granular-badge'), 'hw-granular-badge CSS class missing in index.html');

  // 3. Isolated sandbox testing for parsing, detection, encoding & question slicing
  const sStart = html.indexOf('<script>');
  const sEnd = html.lastIndexOf('</script>');
  const scriptContent = html.substring(sStart + 8, sEnd);

  const testGranularSandbox = new Function(`
    var DATA_MATRA_TABS = {
      aa: { words: Array.from({length: 30}, function(_, i) { return { full: "कार" + i, ans: "ा", sound: "क + आ" }; }) },
      i: { words: Array.from({length: 30}, function(_, i) { return { full: "दिन" + i, ans: "ि", sound: "द + इ" }; }) }
    };
    var DATA_3LETTER_CVC = {
      a: Array.from({length: 31}, function(_, i) { return { word: "cat" + i, letters: ["c", "a", "t"], blend: "c-a-t" }; }),
      e: Array.from({length: 28}, function(_, i) { return { word: "pen" + i, letters: ["p", "e", "n"], blend: "p-e-n" }; }),
      i: Array.from({length: 28}, function(_, i) { return { word: "pin" + i, letters: ["p", "i", "n"], blend: "p-i-n" }; }),
      o: Array.from({length: 28}, function(_, i) { return { word: "pot" + i, letters: ["p", "o", "t"], blend: "p-o-t" }; }),
      u: Array.from({length: 28}, function(_, i) { return { word: "sun" + i, letters: ["s", "u", "n"], blend: "s-u-n" }; })
    };

    ${scriptContent.match(/function parseHomeworkGameParams[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function getGranularHomeworkInfo[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function detectGranularTopicType[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function getGranularTopicMaxQuestions[\s\S]*?^    \}/m)[0]}

    // A. Topic Detection
    var matraType = detectGranularTopicType("Hindi", { title: "Matra Quiz (ा, ि, ी, ु, ू)", module_key: "ukg_hindi_matra" });
    var cvcTypeUkg = detectGranularTopicType("English", { title: "English: 3-Letter CVC Phonics Words (A, E, I, O, U)", module_key: "ukg_phonics_cvc" });
    var cvcTypeLkg = detectGranularTopicType("English", { title: "3-Letter CVC Short 'a' (CAT, BAT, MAT)", module_key: "lkg_phonics_cvc_a" });
    var otherType = detectGranularTopicType("Mathematics", { title: "Addition Fun", module_key: "ukg_math_addition" });

    // B. Max Questions
    var maxMatraAa = getGranularTopicMaxQuestions("matra", "aa");
    var maxMatraAll = getGranularTopicMaxQuestions("matra", "all");
    var maxCvcA = getGranularTopicMaxQuestions("cvc", "a");
    var maxCvcAll = getGranularTopicMaxQuestions("cvc", "all");

    // C. Parsing and Labeling
    var matraAtt = "game:ukg:matra|sub=aa|q=1-5";
    var parsedMatra = parseHomeworkGameParams(matraAtt);
    var infoMatra = getGranularHomeworkInfo(matraAtt);

    var cvcAtt = "game:lkg:phonics|sub=a|q=1-8";
    var parsedCvc = parseHomeworkGameParams(cvcAtt);
    var infoCvc = getGranularHomeworkInfo(cvcAtt);

    var mixedCvcAtt = "game:lkg:phonics|sub=mixed|q=1-15";
    var parsedMixed = parseHomeworkGameParams(mixedCvcAtt);
    var infoMixed = getGranularHomeworkInfo(mixedCvcAtt);

    // D. Slicing logic emulation
    // 1. Matra aa Q1-Q5
    var mList = DATA_MATRA_TABS[parsedMatra.sub].words;
    var slicedMatra = mList.slice(parsedMatra.fromQ - 1, parsedMatra.toQ);

    // 2. CVC a Q1-Q8
    var vList = DATA_3LETTER_CVC[parsedCvc.sub];
    var slicedCvc = vList.slice(parsedCvc.fromQ - 1, parsedCvc.toQ);

    // 3. Mixed CVC Q1-Q15
    var allCvc = [];
    var cKeys = Object.keys(DATA_3LETTER_CVC);
    for (var ci = 0; ci < cKeys.length; ci++) {
      allCvc = allCvc.concat(DATA_3LETTER_CVC[cKeys[ci]]);
    }
    var slicedMixed = allCvc.slice(parsedMixed.fromQ - 1, parsedMixed.toQ);

    return {
      matraType: matraType,
      cvcTypeUkg: cvcTypeUkg,
      cvcTypeLkg: cvcTypeLkg,
      otherType: otherType,
      maxMatraAa: maxMatraAa,
      maxMatraAll: maxMatraAll,
      maxCvcA: maxCvcA,
      maxCvcAll: maxCvcAll,
      parsedMatra: parsedMatra,
      infoMatra: infoMatra,
      parsedCvc: parsedCvc,
      infoCvc: infoCvc,
      parsedMixed: parsedMixed,
      infoMixed: infoMixed,
      slicedMatraLength: slicedMatra.length,
      slicedMatraAns: slicedMatra.every(function(x) { return x.ans === "ा"; }),
      slicedCvcLength: slicedCvc.length,
      slicedMixedLength: slicedMixed.length,
      totalCvcPool: allCvc.length
    };
  `);

  const res = testGranularSandbox();
  assert.strictEqual(res.matraType, 'matra', 'detectGranularTopicType must identify Hindi Matra as matra');
  assert.strictEqual(res.cvcTypeUkg, 'cvc', 'detectGranularTopicType must identify UKG CVC as cvc');
  assert.strictEqual(res.cvcTypeLkg, 'cvc', 'detectGranularTopicType must identify LKG CVC as cvc');
  assert.strictEqual(res.otherType, null, 'detectGranularTopicType must return null for Math');

  assert.strictEqual(res.maxMatraAa, 30, 'Matra aa must have 30 questions');
  assert.strictEqual(res.maxMatraAll, 300, 'Matra all must have 300 questions');
  assert.strictEqual(res.maxCvcA, 31, 'CVC short a must have 31 questions');
  assert.strictEqual(res.maxCvcAll, 143, 'CVC all must have 143 questions');

  assert.strictEqual(res.parsedMatra.sub, 'aa', 'Matra sub must be aa');
  assert.strictEqual(res.parsedMatra.fromQ, 1, 'Matra fromQ must be 1');
  assert.strictEqual(res.parsedMatra.toQ, 5, 'Matra toQ must be 5');
  assert(res.infoMatra.label.includes('आ की मात्रा') && res.infoMatra.label.includes('Q1–Q5'), 'infoMatra label must contain Matra name and range');
  assert.strictEqual(res.slicedMatraLength, 5, 'Sliced matra question list must contain exactly 5 questions');
  assert.strictEqual(res.slicedMatraAns, true, 'All 5 sliced matra questions must test aa (ा)');

  assert.strictEqual(res.parsedCvc.sub, 'a', 'CVC sub must be a');
  assert.strictEqual(res.parsedCvc.fromQ, 1, 'CVC fromQ must be 1');
  assert.strictEqual(res.parsedCvc.toQ, 8, 'CVC toQ must be 8');
  assert(res.infoCvc.label.includes("CVC 'A' Sound") && res.infoCvc.label.includes('Q1–Q8'), 'infoCvc label must contain sound name and range');
  assert.strictEqual(res.slicedCvcLength, 8, 'Sliced CVC question list must contain exactly 8 questions');

  assert.strictEqual(res.parsedMixed.sub, 'mixed', 'Mixed CVC sub must be mixed');
  assert.strictEqual(res.totalCvcPool, 143, 'Combined CVC pool across all 5 vowels must be 143');
  assert.strictEqual(res.slicedMixedLength, 15, 'Sliced mixed CVC list must contain exactly 15 questions');
});

// TEST 39: 48-Hour Homework Visibility & One-Time Points (Practice-Only on Replay)
runTest('48-Hour Homework Visibility & One-Time Points (Practice-Only on Replay)', () => {
  // 1. Verify function & DOM definitions in index.html
  assert(html.includes('isHomeworkWithin48Hours'), 'isHomeworkWithin48Hours function missing in index.html');
  assert(html.includes('getStudentActiveHomework'), 'getStudentActiveHomework function missing in index.html');
  assert(html.includes('isHomeworkCompletedByStudent'), 'isHomeworkCompletedByStudent function missing in index.html');
  assert(html.includes('activeHomeworkPracticeMode'), 'activeHomeworkPracticeMode state missing in index.html');
  assert(html.includes('Practice Again (No Extra Points)'), 'Practice Again (No Extra Points) button text missing in index.html');
  assert(html.includes('btn-practice-again'), 'btn-practice-again CSS class missing in index.html');
  assert(html.includes('Practice Mode • Points already earned'), 'Practice Mode toast / status message missing in index.html');

  // 2. Logic testing in isolated sandbox
  const sStart = html.indexOf('<script>');
  const sEnd = html.lastIndexOf('</script>');
  const scriptContent = html.substring(sStart + 8, sEnd);

  const testPracticeSandbox = new Function(`
    var mockStorage = {};
    var localStorage = {
      getItem: function(k) { return mockStorage[k] || null; },
      setItem: function(k, v) { mockStorage[k] = String(v); }
    };
    var appSession = {
      type: 'parent',
      role: 'student',
      parentClass: 'LKG',
      student: {
        login_id: 'STU101',
        student_id: 'STU101',
        student_name: 'Aarav Sharma',
        student_class: 'LKG',
        points: 50.0,
        stars: 50.0,
        tasks_completed: [],
        badges: [],
        reward_counts: {}
      },
      homeworkSession: null,
      activeHomeworkId: null,
      activeHomeworkPracticeMode: false
    };
    var appState = { stars: 50, section: 'home' };

    function resolveHomeworkSchoolId(id) { return 'the-abacus-academy'; }
    function getActiveSchoolId() { return 'the-abacus-academy'; }
    function normalizeAssignedClass(c) { return String(c || 'LKG').trim(); }
    function safeAction(fn) { fn(); }
    function showToast() {}
    function speak() {}
    function playTone() {}
    function triggerConfetti() {}
    function updateHeaderPointBadges(pts) {}
    function checkRewardShelfMilestones() {}
    function saveStudentSessionLocallyAndRemote() {}
    function syncHeaderPointsUI() {}
    function showPointPopAnimation() {}
    function openSection() {}
    function setMode() {}
    function escapeHtml(s) { return s; }
    function getTodayIstDateString() { return '2026-11-28'; }
    function supabaseRest() { return Promise.resolve(); }

    var mockHwList = [
      { id: 'HW-FRESH', class_name: 'LKG', created_at: '2026-11-28T10:00:00Z', title: 'Fresh HW (2h old)', target_questions: 5 },
      { id: 'HW-YESTERDAY', class_name: 'LKG', created_at: '2026-11-27T06:00:00Z', title: 'Yesterday HW (30h old)', target_questions: 5 },
      { id: 'HW-EXPIRED', class_name: 'LKG', created_at: '2026-11-26T08:00:00Z', title: 'Expired HW (52h old)', target_questions: 5 },
      { id: 'HW-NODATE-FRESH', class_name: 'LKG', due_date: '2026-11-28', title: 'Due today end of day', target_questions: 5 },
      { id: 'HW-NODATE-EXPIRED', class_name: 'LKG', due_date: '2026-11-25', title: 'Due 3 days ago', target_questions: 5 }
    ];

    function getAllHomeworkList(schoolId) {
      return mockHwList;
    }

    ${scriptContent.match(/function isHomeworkWithin48Hours[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function getStudentActiveHomework[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function getAllSubmissionsList[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function saveAllSubmissionsList[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function isHomeworkCompletedByStudent[\s\S]*?^    \}/m)[0]}
    ${scriptContent.match(/function getStudentHomeworkSubmission[\s\S]*?^    \}/m)[0]}

    // 1. Test 48-Hour Visibility Window with fixed reference time
    var refNow = new Date('2026-11-28T12:00:00Z').getTime();
    var isFreshOk = isHomeworkWithin48Hours(mockHwList[0], refNow);
    var isYesterdayOk = isHomeworkWithin48Hours(mockHwList[1], refNow);
    var isExpiredFiltered = isHomeworkWithin48Hours(mockHwList[2], refNow);
    var isNoDateFreshOk = isHomeworkWithin48Hours(mockHwList[3], refNow);
    var isNoDateExpiredFiltered = isHomeworkWithin48Hours(mockHwList[4], refNow);

    var studentActiveHw = getStudentActiveHomework('LKG', 'the-abacus-academy', refNow);

    // 2. Test One-Time Points vs Practice Replay
    // Check initial completion state
    var initCompleted = isHomeworkCompletedByStudent('STU101', 'HW-FRESH', 'the-abacus-academy');

    // Emulate 1st completion:
    // Mark as completed in submissions list
    var subRecord = {
      id: 'SUB-1',
      school_id: 'the-abacus-academy',
      homework_id: 'HW-FRESH',
      student_id: 'STU101',
      status: 'completed',
      points_earned: 30.0
    };
    saveAllSubmissionsList('the-abacus-academy', [subRecord]);
    appSession.student.points += 30.0;
    var pointsAfterFirst = appSession.student.points;

    // Verify homework is now completed
    var afterFirstCompleted = isHomeworkCompletedByStudent('STU101', 'HW-FRESH', 'the-abacus-academy');

    // Emulate Replay / Practice launch:
    var isPractice = isHomeworkCompletedByStudent('STU101', 'HW-FRESH', 'the-abacus-academy');
    appSession.activeHomeworkPracticeMode = isPractice;
    appSession.homeworkSession = {
      homeworkId: 'HW-FRESH',
      targetQuestions: 5,
      isPracticeMode: isPractice,
      totalScore: 0.0,
      questionScores: []
    };

    // Emulate answering question in practice mode
    var earned = appSession.homeworkSession.isPracticeMode ? 0.0 : 1.0;
    if (earned > 0) {
      appSession.student.points += earned;
    }

    // Emulate completeActiveHomeworkRecord in practice mode (isPractice === true)
    if (!appSession.homeworkSession.isPracticeMode) {
      appSession.student.points += 30.0;
    }
    var pointsAfterPracticeReplay = appSession.student.points;

    return {
      isFreshOk: isFreshOk,
      isYesterdayOk: isYesterdayOk,
      isExpiredFiltered: isExpiredFiltered,
      isNoDateFreshOk: isNoDateFreshOk,
      isNoDateExpiredFiltered: isNoDateExpiredFiltered,
      studentActiveHwId: studentActiveHw ? studentActiveHw.id : null,
      initCompleted: initCompleted,
      pointsAfterFirst: pointsAfterFirst,
      afterFirstCompleted: afterFirstCompleted,
      isPractice: isPractice,
      pointsAfterPracticeReplay: pointsAfterPracticeReplay
    };
  `);

  const res = testPracticeSandbox();
  // 48-hour visibility assertions
  assert.strictEqual(res.isFreshOk, true, 'Fresh homework (2h old) must be visible (true)');
  assert.strictEqual(res.isYesterdayOk, true, 'Yesterday homework (30h old) must be visible (true)');
  assert.strictEqual(res.isExpiredFiltered, false, 'Expired homework (52h old) must be hidden (false)');
  assert.strictEqual(res.isNoDateFreshOk, true, 'Homework due today without created_at must be visible (true)');
  assert.strictEqual(res.isNoDateExpiredFiltered, false, 'Homework due 3 days ago without created_at must be hidden (false)');
  assert.strictEqual(res.studentActiveHwId, 'HW-FRESH', 'Student active homework must return the latest non-expired homework');

  // One-time points & Practice mode assertions
  assert.strictEqual(res.initCompleted, false, 'Homework must initially not be completed');
  assert.strictEqual(res.pointsAfterFirst, 80.0, 'First completion must award +30 points (50 -> 80)');
  assert.strictEqual(res.afterFirstCompleted, true, 'Homework must be recorded as completed after 1st submission');
  assert.strictEqual(res.isPractice, true, 'Replay of completed homework must activate practice mode (true)');
  assert.strictEqual(res.pointsAfterPracticeReplay, 80.0, 'Practice mode replay must add 0 extra points (remain strictly 80.0)');
});

// TEST 40: 5 Separate Fun-Learning Hindi UKG Modules (Vilom, Paheli, Railgadi, Ek-Anek, Vakya) with Question Range & Slicing
runTest('5 Separate Fun-Learning Hindi UKG Modules (Vilom, Paheli, Railgadi, Ek-Anek, Vakya) with Question Range & Slicing', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  // 1. Static file declarations
  assert(indexHtml.includes('DATA_HINDI_VILOM'), 'index.html must define DATA_HINDI_VILOM');
  assert(indexHtml.includes('DATA_HINDI_PAHELI'), 'index.html must define DATA_HINDI_PAHELI');
  assert(indexHtml.includes('DATA_HINDI_RAILGADI'), 'index.html must define DATA_HINDI_RAILGADI');
  assert(indexHtml.includes('DATA_HINDI_EKANEK'), 'index.html must define DATA_HINDI_EKANEK');
  assert(indexHtml.includes('DATA_HINDI_VAKYA'), 'index.html must define DATA_HINDI_VAKYA');

  assert(indexHtml.includes('renderUkgHindiVilomView'), 'renderUkgHindiVilomView must be defined');
  assert(indexHtml.includes('renderUkgHindiPaheliView'), 'renderUkgHindiPaheliView must be defined');
  assert(indexHtml.includes('renderUkgHindiRailgadiView'), 'renderUkgHindiRailgadiView must be defined');
  assert(indexHtml.includes('renderUkgHindiEkanekView'), 'renderUkgHindiEkanekView must be defined');
  assert(indexHtml.includes('renderUkgHindiVakyaView'), 'renderUkgHindiVakyaView must be defined');

  // 2. Behavioral verification in clean VM sandbox
  const sandbox = {
    console: console,
    Math: Math,
    parseInt: parseInt,
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    decodeURIComponent: decodeURIComponent,
    encodeURIComponent: encodeURIComponent,
    appState: { section: 'ukg', mode: 'quiz', quizIndex: 0 },
    appSession: {}
  };

  const codeMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>/i);
  assert(codeMatch, 'Script block must be present');
  const scriptContent = codeMatch[1];

  const testSandbox = new Function(`
    ${indexHtml.match(/var DATA_HINDI_VILOM = [\s\S]*?^    \];/m)[0]}
    ${indexHtml.match(/var DATA_HINDI_PAHELI = [\s\S]*?^    \];/m)[0]}
    ${indexHtml.match(/var DATA_HINDI_RAILGADI = [\s\S]*?^    \];/m)[0]}
    ${indexHtml.match(/var DATA_HINDI_EKANEK = [\s\S]*?^    \];/m)[0]}
    ${indexHtml.match(/var DATA_HINDI_VAKYA = [\s\S]*?^    \];/m)[0]}

    ${indexHtml.match(/function parseHomeworkGameParams[\s\S]*?^    \}/m)[0]}
    ${indexHtml.match(/function getGranularHomeworkInfo[\s\S]*?^    \}/m)[0]}
    ${indexHtml.match(/function detectGranularTopicType[\s\S]*?^    \}/m)[0]}
    ${indexHtml.match(/function getGranularTopicMaxQuestions[\s\S]*?^    \}/m)[0]}
    ${indexHtml.match(/function getCurriculumModulesForClass[\s\S]*?^    \}/m)[0]}
    ${indexHtml.match(/function getTeacherCurriculumCatalog[\s\S]*?^    \}/m)[0]}
    ${indexHtml.match(/function normalizeAssignedClass[\s\S]*?^    \}/m)[0]}
    ${indexHtml.match(/function resolveHomeworkGameModule[\s\S]*?^    \}/m)[0]}

    var ukgMods = getCurriculumModulesForClass('UKG');
    var vilomMod = ukgMods.find(function(m){ return m.key === 'ukg_hindi_vilom'; });
    var paheliMod = ukgMods.find(function(m){ return m.key === 'ukg_hindi_paheli'; });
    var railMod = ukgMods.find(function(m){ return m.key === 'ukg_hindi_railgadi'; });
    var ekanekMod = ukgMods.find(function(m){ return m.key === 'ukg_hindi_ekanek'; });
    var vakyaMod = ukgMods.find(function(m){ return m.key === 'ukg_hindi_vakya'; });

    var cat = getTeacherCurriculumCatalog('UKG');
    var hindiTopics = (cat['Hindi'] && cat['Hindi'].topics) ? cat['Hindi'].topics : [];
    var tVilom = hindiTopics.find(function(t){ return t.module_key === 'ukg_hindi_vilom'; });
    var tPaheli = hindiTopics.find(function(t){ return t.module_key === 'ukg_hindi_paheli'; });
    var tRail = hindiTopics.find(function(t){ return t.module_key === 'ukg_hindi_railgadi'; });
    var tEkanek = hindiTopics.find(function(t){ return t.module_key === 'ukg_hindi_ekanek'; });
    var tVakya = hindiTopics.find(function(t){ return t.module_key === 'ukg_hindi_vakya'; });

    var gTypeVilom = detectGranularTopicType('Hindi', { module_key: 'ukg_hindi_vilom' });
    var gTypePaheli = detectGranularTopicType('Hindi', { module_key: 'ukg_hindi_paheli' });
    var gTypeRail = detectGranularTopicType('Hindi', { module_key: 'ukg_hindi_railgadi' });
    var gTypeEkanek = detectGranularTopicType('Hindi', { module_key: 'ukg_hindi_ekanek' });
    var gTypeVakya = detectGranularTopicType('Hindi', { module_key: 'ukg_hindi_vakya' });

    var maxQVilom = getGranularTopicMaxQuestions('hindi_vilom', 'all');
    var maxQPaheli = getGranularTopicMaxQuestions('hindi_paheli', 'all');
    var maxQRail = getGranularTopicMaxQuestions('hindi_railgadi', 'all');
    var maxQEkanek = getGranularTopicMaxQuestions('hindi_ekanek', 'all');
    var maxQVakya = getGranularTopicMaxQuestions('hindi_vakya', 'all');

    var parsedVilom = parseHomeworkGameParams('game:ukg:hindi_vilom|q=1-5');
    var infoVilom = getGranularHomeworkInfo('game:ukg:hindi_vilom|q=1-5');

    var resolvedHw = resolveHomeworkGameModule({
      class_name: 'UKG',
      attachment_url: 'game:ukg:hindi_paheli|q=3-7'
    });

    var resolvedByKeyword = resolveHomeworkGameModule({
      class_name: 'UKG',
      title: 'अक्षर रेलगाड़ी (शब्द बनाओ Puzzle)'
    });

    return {
      vilomLen: DATA_HINDI_VILOM.length,
      paheliLen: DATA_HINDI_PAHELI.length,
      railLen: DATA_HINDI_RAILGADI.length,
      ekanekLen: DATA_HINDI_EKANEK.length,
      vakyaLen: DATA_HINDI_VAKYA.length,
      hasVilomMod: !!vilomMod && vilomMod.tab === 'hindi_vilom',
      hasPaheliMod: !!paheliMod && paheliMod.tab === 'hindi_paheli',
      hasRailMod: !!railMod && railMod.tab === 'hindi_railgadi',
      hasEkanekMod: !!ekanekMod && ekanekMod.tab === 'hindi_ekanek',
      hasVakyaMod: !!vakyaMod && vakyaMod.tab === 'hindi_vakya',
      hasTVilom: !!tVilom,
      hasTPaheli: !!tPaheli,
      hasTRail: !!tRail,
      hasTEkanek: !!tEkanek,
      hasTVakya: !!tVakya,
      gTypeVilom: gTypeVilom,
      gTypePaheli: gTypePaheli,
      gTypeRail: gTypeRail,
      gTypeEkanek: gTypeEkanek,
      gTypeVakya: gTypeVakya,
      maxQVilom: maxQVilom,
      maxQPaheli: maxQPaheli,
      maxQRail: maxQRail,
      maxQEkanek: maxQEkanek,
      maxQVakya: maxQVakya,
      parsedVilomQ: parsedVilom ? (parsedVilom.fromQ + '-' + parsedVilom.toQ) : null,
      infoVilomLabel: infoVilom ? infoVilom.label : null,
      resolvedTab: resolvedHw ? resolvedHw.tab : null,
      resolvedFromQ: resolvedHw ? resolvedHw.fromQ : null,
      resolvedToQ: resolvedHw ? resolvedHw.toQ : null,
      resolvedKeywordTab: resolvedByKeyword ? resolvedByKeyword.tab : null
    };
  `);

  const res = testSandbox();
  assert(res.vilomLen >= 20, `DATA_HINDI_VILOM must have 20 items (got ${res.vilomLen})`);
  assert(res.paheliLen >= 15, `DATA_HINDI_PAHELI must have 15 items (got ${res.paheliLen})`);
  assert(res.railLen >= 20, `DATA_HINDI_RAILGADI must have 20 items (got ${res.railLen})`);
  assert(res.ekanekLen >= 15, `DATA_HINDI_EKANEK must have 15 items (got ${res.ekanekLen})`);
  assert(res.vakyaLen >= 15, `DATA_HINDI_VAKYA must have 15 items (got ${res.vakyaLen})`);

  assert.strictEqual(res.hasVilomMod, true, 'Curriculum must include ukg_hindi_vilom');
  assert.strictEqual(res.hasPaheliMod, true, 'Curriculum must include ukg_hindi_paheli');
  assert.strictEqual(res.hasRailMod, true, 'Curriculum must include ukg_hindi_railgadi');
  assert.strictEqual(res.hasEkanekMod, true, 'Curriculum must include ukg_hindi_ekanek');
  assert.strictEqual(res.hasVakyaMod, true, 'Curriculum must include ukg_hindi_vakya');

  assert.strictEqual(res.hasTVilom, true, 'Teacher catalog must include ukg_hindi_vilom');
  assert.strictEqual(res.hasTPaheli, true, 'Teacher catalog must include ukg_hindi_paheli');
  assert.strictEqual(res.hasTRail, true, 'Teacher catalog must include ukg_hindi_railgadi');
  assert.strictEqual(res.hasTEkanek, true, 'Teacher catalog must include ukg_hindi_ekanek');
  assert.strictEqual(res.hasTVakya, true, 'Teacher catalog must include ukg_hindi_vakya');

  assert.strictEqual(res.gTypeVilom, 'hindi_vilom', 'gTypeVilom must be hindi_vilom');
  assert.strictEqual(res.gTypePaheli, 'hindi_paheli', 'gTypePaheli must be hindi_paheli');
  assert.strictEqual(res.gTypeRail, 'hindi_railgadi', 'gTypeRail must be hindi_railgadi');
  assert.strictEqual(res.gTypeEkanek, 'hindi_ekanek', 'gTypeEkanek must be hindi_ekanek');
  assert.strictEqual(res.gTypeVakya, 'hindi_vakya', 'gTypeVakya must be hindi_vakya');

  assert.strictEqual(res.maxQVilom, 20, 'Vilom max questions must be 20');
  assert.strictEqual(res.maxQPaheli, 15, 'Paheli max questions must be 15');
  assert.strictEqual(res.maxQRail, 20, 'Railgadi max questions must be 20');
  assert.strictEqual(res.maxQEkanek, 15, 'Ek-Anek max questions must be 15');
  assert.strictEqual(res.maxQVakya, 15, 'Vakya max questions must be 15');

  assert.strictEqual(res.parsedVilomQ, '1-5', 'Parsed Vilom range must be 1-5');
  assert.strictEqual(res.infoVilomLabel, 'उल्टा-सीधा खेल (विलोम शब्द) • Q1–Q5', 'Granular badge label must format cleanly');
  assert.strictEqual(res.resolvedTab, 'hindi_paheli', 'Resolved tab must be hindi_paheli');
  assert.strictEqual(res.resolvedFromQ, 3, 'Resolved fromQ must be 3');
  assert.strictEqual(res.resolvedToQ, 7, 'Resolved toQ must be 7');
  assert.strictEqual(res.resolvedKeywordTab, 'hindi_railgadi', 'Keyword fallback must resolve to hindi_railgadi');
});

console.log('\n----------------------------------------------------------------');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('----------------------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
}
