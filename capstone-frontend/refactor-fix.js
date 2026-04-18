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

  if (content.includes('setLoading(true)') && !content.includes('const [loading, setLoading]')) {
      content = content.replace(/(const \[.*\] = useState\(.*\);\s*)/, "$1const [loading, setLoading] = useState(true);\n  ");
  }

  // Remove `status` if still defined but never used
  if(content.includes("const [status, setStatus] = useState") && !content.includes("status ===") && !content.includes("status !==") && !content.match(/status\s*\?/)) {
      content = content.replace(/const\s*\[\s*status\s*,\s*setStatus\s*\]\s*=\s*useState\(.*?['"].*?['"]\);\s*/g, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
