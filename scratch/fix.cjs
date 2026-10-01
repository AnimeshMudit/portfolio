const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/components');
files.forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  if (code.includes('useTransform(scrollYProgress, [')) {
    code = code.replace(/import \{([^}]+)\} from 'framer-motion';/, (match, p1) => {
      const rel = file.includes('projects') ? '../../utils/motion' : '../utils/motion';
      return `import {${p1}} from 'framer-motion';\nimport { useSafeTransform } from '${rel}';`;
    });
    code = code.replace(/useTransform\(scrollYProgress, \[/g, 'useSafeTransform(scrollYProgress, [');
    fs.writeFileSync(file, code);
    console.log('Fixed', file);
  }
});
