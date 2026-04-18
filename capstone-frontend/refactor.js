import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Remove unused const { user } = useAuth();
  if (!content.includes('user.') && !content.includes('user &&') && !content.includes('user?') && content.includes('{ user }')) {
    content = content.replace(/const \{\s*user\s*\} = useAuth\(\);\s*/g, '');
    // If useAuth is no longer used, we should probably remove it too, but let's just leave the import for now or let eslint remove it.
  }
  
  // 2. Replace empty catch { } with toast error
  if (content.match(/catch\s*\{\s*\}/)) {
      if (!content.includes("from '../../../utils/toast'") && !content.includes("from '../../utils/toast'")) {
          // Add import depending on depth
          const depth = file.split(/\/|\\/).length - 2;
          const importPath = depth === 3 ? "'../../utils/toast'" : (depth === 4 ? "'../../../utils/toast'" : "'../utils/toast'");
          content = `import toast from ${importPath};\n` + content;
      }
      content = content.replace(/catch\s*\{\s*\}/g, "catch (err) { toast.error('Action failed. Please try again.'); console.error(err); }");
  }

  // 3. Replace alert(...) with toast.error or toast.success
  if (content.includes('alert(')) {
      if (!content.includes('toast from')) {
        const depth = file.split(/\/|\\/).length - 2;
        let prefix = '';
        for(let i=0; i<depth-1; i++) prefix += '../';
        if(prefix==='') prefix='./';
        content = `import toast from '${prefix}utils/toast';\n` + content;
      }
      content = content.replace(/alert\((.*?)\);/g, "toast.error($1);");
  }

  // 4. Remove unhandled navigate
  if (content.includes('const navigate = useNavigate();') && !content.includes('navigate(')) {
      content = content.replace(/const navigate = useNavigate\(\);\s*/g, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Processed', file);
  }
});
