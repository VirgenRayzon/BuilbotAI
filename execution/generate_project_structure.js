const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.git', '.next', 'out', 'build', 'dist', '.genkit'];

function generateTree(dir, prefix = '') {
  let output = '';
  const files = fs.readdirSync(dir);
  
  // Separate directories and files, and sort them
  const entries = files.map(file => {
    const fullPath = path.join(dir, file);
    try {
        const isDir = fs.statSync(fullPath).isDirectory();
        return { name: file, isDir, fullPath };
    } catch (e) {
        return null;
    }
  }).filter(entry => entry !== null && !IGNORE_DIRS.includes(entry.name));

  entries.sort((a, b) => {
    if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
    return a.isDir ? -1 : 1;
  });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    
    output += `${prefix}${connector}${entry.name}\n`;
    
    if (entry.isDir) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      output += generateTree(entry.fullPath, newPrefix);
    }
  });
  
  return output;
}

const rootDir = process.cwd();
const treeOutput = generateTree(rootDir);

const markdownOutput = `# Project Structure

\`\`\`text
BuilbotAI
${treeOutput}\`\`\`

_Auto-generated on git push._
`;

const outputPath = path.join(rootDir, 'docs', 'project_structure.md');

// ensure docs directory exists
if (!fs.existsSync(path.join(rootDir, 'docs'))) {
  fs.mkdirSync(path.join(rootDir, 'docs'));
}

fs.writeFileSync(outputPath, markdownOutput, 'utf-8');
console.log('Project structure updated at docs/project_structure.md');
