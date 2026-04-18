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

  // Unused useAuth import
  if (content.includes('import { useAuth }') && !content.includes('useAuth()')) {
    content = content.replace(/import\s*\{\s*useAuth\s*\}\s*from\s*['"].*?['"];?\s*/g, '');
  }

  // Unused useNavigate import
  if (content.includes('import { useNavigate }') && !content.includes('useNavigate()')) {
    // Check if it's combined with something else, like import { useNavigate, Link }
    // If it's just import { useNavigate }
    content = content.replace(/import\s*\{\s*useNavigate\s*\}\s*from\s*['"]react-router-dom['"];?\s*/g, '');
  }

  // Remove `const { user } = useAuth();` if user not used.
  if (content.includes('const { user } = useAuth();') && !content.includes('user.') && !content.includes('user?') && content.split('user').length === 3) {
      content = content.replace(/const\s*\{\s*user\s*\}\s*=\s*useAuth\(\);\s*/g, '');
  }
  
  // Clean up loading, response, status, navigate
  if (content.includes('const [loading, setLoading]') && !content.includes('loading ?') && !content.includes('!loading') && !content.includes('loading &&')) {
     // content = content.replace(/const\s*\[\s*loading\s*,\s*setLoading\s*\]\s*=\s*useState\(true\);\s*/g, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Processed', file);
  }
});
