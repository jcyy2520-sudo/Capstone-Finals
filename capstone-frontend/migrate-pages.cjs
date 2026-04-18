const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const ROLES_DIR = path.join(SRC_DIR, 'roles');
const PAGES_DIR = path.join(SRC_DIR, 'pages');

function processAppEntries() {
  const content = fs.readFileSync(path.join(PAGES_DIR, 'AppEntriesPage.jsx'), 'utf-8');
  
  // Base logic that all AppEntries share
  const baseContent = content.replace(/user\?\.role\?\.name/g, 'currentRole');

  // department_requester
  let requesterContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'department_requester';`)
    .replace(/user\?\.role\?\.permissions\?\.app\?\.create([^>]*>)[^\/]*New Entry\n\s*<\/button>/s, `<button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>New Entry</button>`)
    .replace(/const getActions = \(entry\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (entry) => {
    const actions = [];
    if (entry.status === 'draft') {
      actions.push({ label: 'Submit', action: 'submit', color: 'blue' });
      actions.push({ label: 'Delete', action: 'delete', color: 'red' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'department_requester', 'pages', 'AppEntriesPage.jsx'), requesterContent);

  // bac_secretariat
  let secretariatContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'bac_secretariat';`)
    .replace(/\{user\?\.role\?\.permissions\?\.app\?\.create && \([\s\S]*?New Entry\n\s*<\/button>\n\s*\)\}/, '')
    .replace(/\{showForm && \([\s\S]*?\)\}/, '') // Strip creation form entirely
    .replace(/const getActions = \(entry\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (entry) => {
    const actions = [];
    if (entry.status === 'submitted') {
      actions.push({ label: 'Accept', action: 'accept', color: 'green' });
      actions.push({ label: 'Return', action: 'return', color: 'red' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'bac_secretariat', 'pages', 'AppEntriesPage.jsx'), secretariatContent);

  // hope
  let hopeContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'hope';`)
    .replace(/\{user\?\.role\?\.permissions\?\.app\?\.create && \([\s\S]*?New Entry\n\s*<\/button>\n\s*\)\}/, '')
    .replace(/\{showForm && \([\s\S]*?\)\}/, '')
    .replace(/const getActions = \(entry\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (entry) => {
    const actions = [];
    if (entry.status === 'pending_hope_approval') {
      actions.push({ label: 'Approve', action: 'approve', color: 'green' });
      actions.push({ label: 'Return', action: 'return', color: 'red' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'hope', 'pages', 'AppEntriesPage.jsx'), hopeContent);

  // budget_officer
  let budgetContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'budget_officer';`)
    .replace(/\{user\?\.role\?\.permissions\?\.app\?\.create && \([\s\S]*?New Entry\n\s*<\/button>\n\s*\)\}/, '')
    .replace(/\{showForm && \([\s\S]*?\)\}/, '')
    .replace(/const getActions = \(entry\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (entry) => {
    const actions = [];
    if (entry.status === 'pending_budget_certification') {
      actions.push({ label: 'Certify Budget', action: 'certify-budget', color: 'green' });
      actions.push({ label: 'Return', action: 'return', color: 'red' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'budget_officer', 'pages', 'AppEntriesPage.jsx'), budgetContent);
  
  // system_admin (kitchen sink)
  fs.writeFileSync(path.join(ROLES_DIR, 'system_admin', 'pages', 'AppEntriesPage.jsx'), content);
}

function processPRs() {
  const content = fs.readFileSync(path.join(PAGES_DIR, 'PurchaseRequisitionsPage.jsx'), 'utf-8');
  const baseContent = content.replace(/user\?\.role\?\.name/g, 'currentRole');

  const extractRegex = /\{user\?\.role\?\.permissions\?\.pr\?\.create[^\}]+?\}/;
  
  // department_requester
  let reqContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'department_requester';`)
    .replace(/const getActions = \(pr\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (pr) => {
    const actions = [];
    if (pr.status === 'draft') {
      actions.push({ label: 'Submit', action: 'submit', color: 'blue' });
      actions.push({ label: 'Delete', action: 'delete', color: 'red' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'department_requester', 'pages', 'PurchaseRequisitionsPage.jsx'), reqContent);

  // hope
  let hopeContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'hope';`)
    .replace(/\{showForm && \([\s\S]*?\}\)}/, '') // Prune form render
    .replace(/const getActions = \(pr\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (pr) => {
    const actions = [];
    if (pr.status === 'pending_hope_approval') {
      actions.push({ label: 'Approve PR', action: 'approve', color: 'green' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'hope', 'pages', 'PurchaseRequisitionsPage.jsx'), hopeContent);

  // budget_officer
  let budgetContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'budget_officer';`)
    .replace(/\{showForm && \([\s\S]*?\}\)}/, '') 
    .replace(/const getActions = \(pr\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (pr) => {
    const actions = [];
    if (pr.status === 'pending_budget_certification') {
      actions.push({ label: 'Certify Budget', action: 'certify-budget', color: 'green' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'budget_officer', 'pages', 'PurchaseRequisitionsPage.jsx'), budgetContent);

  // bac_secretariat
  let secContent = baseContent
    .replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = 'bac_secretariat';`)
    .replace(/\{showForm && \([\s\S]*?\}\)}/, '') 
    .replace(/const getActions = \(pr\) => \{[\s\S]*?return actions;\n\s*\};/, `const getActions = (pr) => {
    const actions = [];
    if (pr.status === 'submitted') {
      actions.push({ label: 'Accept & Number PR', action: 'accept', color: 'green' });
      actions.push({ label: 'Return', action: 'return', color: 'red' });
    }
    return actions;
  };`);
  fs.writeFileSync(path.join(ROLES_DIR, 'bac_secretariat', 'pages', 'PurchaseRequisitionsPage.jsx'), secContent);

  // system_admin
  fs.writeFileSync(path.join(ROLES_DIR, 'system_admin', 'pages', 'PurchaseRequisitionsPage.jsx'), content);
}

processAppEntries();
processPRs();
console.log("Pages AppEntries and PRs processed correctly.");
