const fs = require('fs');
const file = 'node_modules/next/dist/compiled/@vercel/og/index.node.js';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  // Handle both unpatched join() and previously patched new URL()
  content = content.replace(
    /fileURLToPath\((?:join|new URL)\(import\.meta\.url,\s*["'](?:\.\.\/)?([^"']+)["']\)\)/g,
    'fileURLToPath(new URL("./$1", import.meta.url))'
  );
  // Also handle new URL("...", import.meta.url) with two arguments reversed if present
  content = content.replace(
    /fileURLToPath\(new URL\(["'](?:\.\.\/)?([^"']+)["'],\s*import\.meta\.url\)\)/g,
    'fileURLToPath(new URL("./$1", import.meta.url))'
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully patched index.node.js with correct relative paths');
} else {
  console.log('File not found:', file);
}
