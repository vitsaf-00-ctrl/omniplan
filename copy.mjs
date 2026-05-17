import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(item => {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') {
        copyDir(s, d);
      }
    } else {
      fs.copyFileSync(s, d);
      console.log(`Copied ${s} to ${d}`);
    }
  });
}
copyDir('./omniplan', '.');
console.log('Copy complete');
