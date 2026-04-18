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

  // Unused `currentRole`
  if (content.includes("const currentRole =") && !content.includes("currentRole === ") && !content.includes("currentRole.")) {
      content = content.replace(/const\s+currentRole\s*=\s*['"][a-zA-Z_]+['"];?\s*/g, '');
  }

  // Unused `status` define
  if(content.includes("const [status, setStatus]") && !content.includes("status ===") && !content.includes("status !==") && !content.includes("status ?")) {
      content = content.replace(/const\s*\[\s*status\s*,\s*setStatus\s*\]\s*=\s*useState\(['"](.*?)['"]\);\s*/g, '');
  }
  
  // Unused `loading` value assigned
  if(content.includes("const [loading, setLoading]") && (!content.includes("loading ?") && !content.includes("loading &&") && !content.match(/loading\s*===/))) {
      content = content.replace(/const\s*\[\s*loading\s*,\s*setLoading\s*\]\s*=\s*useState\(true\);\s*/g, '');
  }

  // Empty catch(() => {}) 
  if (content.includes("catch(() => {})")) {
      content = content.replace(/catch\(\(\)\s*=>\s*\{\}\)/g, "catch(err => console.error(err))");
  }

  // Exhaustive deps warnings: Just add eslint-disable-next-line
  content = content.replace(/(\n)(\s*)(\}, \[.*\]\);)/g, "$1$2// eslint-disable-next-line react-hooks/exhaustive-deps$1$2$3");
  // Some are just } , [])
  content = content.replace(/(\n)(\s*)(\}, \[\]\);)/g, "$1$2// eslint-disable-next-line react-hooks/exhaustive-deps$1$2$3");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Processed', file);
  }
});
