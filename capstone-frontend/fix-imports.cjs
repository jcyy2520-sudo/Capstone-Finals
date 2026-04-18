const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const ROLES_DIR = path.join(SRC_DIR, 'roles');

function fixImports(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let modified = false;

      // Fix Sidebar Icon
      if (content.includes(`from '../../shared/components/Icon'`)) {
        content = content.replace(`from '../../shared/components/Icon'`, `from '../../../shared/components/Icon'`);
        modified = true;
      }
      
      // Fix Pages api & useAuth
      if (fullPath.includes(path.join('roles')) && fullPath.includes(path.join('pages'))) {
        if (content.includes(`from '../services/`)) {
          content = content.replace(/from '\.\.\/services\//g, `from '../../../services/`);
          modified = true;
        }
        if (content.includes(`from '../contexts/`)) {
          content = content.replace(/from '\.\.\/contexts\//g, `from '../../../contexts/`);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
      }
    }
  });
}

fixImports(ROLES_DIR);
console.log("Imports fixed successfully.");
