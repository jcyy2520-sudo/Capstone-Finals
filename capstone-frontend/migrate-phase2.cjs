const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const ROLES_DIR = path.join(SRC_DIR, 'roles');
const PAGES_DIR = path.join(SRC_DIR, 'pages');

function migratePage(sourceName, targetRoles, replacements = []) {
  if (!fs.existsSync(path.join(PAGES_DIR, sourceName))) return;
  const content = fs.readFileSync(path.join(PAGES_DIR, sourceName), 'utf-8');
  const baseContent = content.replace(/user\?\.role\?\.name/g, 'currentRole');

  targetRoles.forEach(role => {
    let roleContent = baseContent.replace('const { user } = useAuth();', `const { user } = useAuth();\n  const currentRole = '${role}';`);
    
    // Apply specific replacements if provided
    replacements.forEach(rep => {
      if (rep.roles.includes(role) || rep.roles.includes('all')) {
         roleContent = roleContent.replace(rep.search, rep.replace);
      }
    });

    const targetDir = path.join(ROLES_DIR, role, 'pages');
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    fs.writeFileSync(path.join(targetDir, sourceName), roleContent);
  });
}

// Invitations (Secretariat, Chairperson, Admin)
migratePage('InvitationsPage.jsx', ['bac_secretariat', 'bac_chairperson', 'system_admin'], [
  {
    roles: ['bac_chairperson'],
    search: /\{currentRole === 'bac_secretariat'[\s\S]*?\{currentRole === 'bac_chairperson'/g,
    replace: `{currentRole === 'bac_chairperson'`
  }
]);

// Bid Openings (Secretariat, BAC Member, Chairperson, Admin)
migratePage('BidOpeningsPage.jsx', ['bac_secretariat', 'bac_member', 'bac_chairperson', 'system_admin'], [
  {
    roles: ['bac_member', 'bac_chairperson'],
    search: /\{\(currentRole === 'bac_secretariat' \|\| currentRole === 'system_admin'\) && \([\s\S]*?Start New Session\n\s*<\/button>\n\s*\)\}/,
    replace: ''
  }
]);

// Evaluations (TWG, Secretariat, BAC Member, Admin)
migratePage('EvaluationsPage.jsx', ['twg_member', 'bac_secretariat', 'bac_member', 'bac_chairperson', 'system_admin'], [
  {
    roles: ['bac_secretariat', 'bac_member', 'bac_chairperson'], 
    // Usually these just view, so we prune TWG specific action buttons
    search: /\{\(currentRole === 'twg_member' \|\| currentRole === 'system_admin'\) && \([\s\S]*?Evaluate Bid\n\s*<\/button>\n\s*\)\}/,
    replace: ''
  }
]);

// Post Qualification (Secretariat, BAC, TWG, Admin)
migratePage('PostQualificationPage.jsx', ['bac_secretariat', 'bac_member', 'bac_chairperson', 'twg_member', 'system_admin'], [
  // Keeping as is structurally but locked to role since logic allows multiple buttons natively mapped to specific roles
]);

// Awards (Secretariat, HOPE, Admin)
migratePage('AwardsPage.jsx', ['bac_secretariat', 'hope', 'system_admin'], []);

// Contracts (Secretariat, HOPE, Admin)
migratePage('ContractsPage.jsx', ['bac_secretariat', 'hope', 'system_admin'], []);

console.log("Phase 2 Migration Complete");
