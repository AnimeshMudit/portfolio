const fs = require('fs');
const files = [
  'CraftyMindChapter', 'HuddleChapter', 'NewsIngestionChapter', 
  'PortfolioChapter', 'RaahatChapter', 'RepoGuardChapter', 'SetuChapter'
].map(n => 'src/components/projects/' + n + '.tsx').concat(['src/components/VisualSystem.tsx']);

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(/useTransform,\s*/g, '').replace(/,\s*useTransform/g, '');
  fs.writeFileSync(file, code);
});
