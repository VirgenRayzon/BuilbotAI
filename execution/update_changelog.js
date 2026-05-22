const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generateChangelog() {
  try {
    // Get commit logs: hash, date (YYYY-MM-DD), and subject
    const logOutput = execSync('git log --pretty=format:"%h|%ad|%s" --date=short', { encoding: 'utf-8' });
    const lines = logOutput.split('\n').filter(Boolean);

    const groups = {};

    lines.forEach(line => {
      const parts = line.split('|');
      if (parts.length < 3) return;
      
      const hash = parts[0];
      const date = parts[1];
      const subject = parts.slice(2).join('|'); // Rejoin in case subject contains '|'

      // Clean up common noise and skip ci commits
      const lowerSubject = subject.toLowerCase();
      if (
        lowerSubject.startsWith('merge ') ||
        lowerSubject.includes('update project structure') ||
        lowerSubject.includes('update changelog') ||
        lowerSubject.includes('[skip ci]')
      ) {
        return;
      }

      if (!groups[date]) {
        groups[date] = {
          feats: [],
          fixes: [],
          refactors: [],
          perfs: [],
          docs: [],
          styles: [],
          others: []
        };
      }

      // Regex to match conventional commits like: feat(scope): description or feat: description
      const match = subject.match(/^(\w+)(?:\(([^)]+)\))?\s*:\s*(.+)$/);
      if (match) {
        const type = match[1].toLowerCase();
        const scope = match[2];
        const desc = match[3];
        const entry = { hash, scope, desc, raw: subject };

        if (type === 'feat') {
          groups[date].feats.push(entry);
        } else if (type === 'fix') {
          groups[date].fixes.push(entry);
        } else if (type === 'refactor') {
          groups[date].refactors.push(entry);
        } else if (type === 'perf') {
          groups[date].perfs.push(entry);
        } else if (type === 'docs') {
          groups[date].docs.push(entry);
        } else if (type === 'style') {
          groups[date].styles.push(entry);
        } else {
          groups[date].others.push(entry);
        }
      } else {
        // Fallback for non-conventional commits
        groups[date].others.push({ hash, scope: null, desc: subject, raw: subject });
      }
    });

    // Format Markdown
    let markdown = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';

    // Sort dates descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach(date => {
      const group = groups[date];
      const hasFeats = group.feats.length > 0;
      const hasFixes = group.fixes.length > 0;
      const hasRefactors = group.refactors.length > 0;
      const hasPerfs = group.perfs.length > 0;
      const hasDocs = group.docs.length > 0;
      const hasStyles = group.styles.length > 0;
      const hasOthers = group.others.length > 0;

      if (!hasFeats && !hasFixes && !hasRefactors && !hasPerfs && !hasDocs && !hasStyles && !hasOthers) {
        return;
      }

      markdown += `## [${date}]\n\n`;

      const formatEntry = (entry) => {
        const scopeStr = entry.scope ? `**${entry.scope}**: ` : '';
        let descStr = entry.desc.trim();
        // Capitalize the first letter
        descStr = descStr.charAt(0).toUpperCase() + descStr.slice(1);
        return `- ${scopeStr}${descStr} ([${entry.hash}](https://github.com/VirgenRayzon/BuilbotAI/commit/${entry.hash}))\n`;
      };

      if (hasFeats) {
        markdown += '### Features\n';
        group.feats.forEach(entry => {
          markdown += formatEntry(entry);
        });
        markdown += '\n';
      }

      if (hasFixes) {
        markdown += '### Bug Fixes\n';
        group.fixes.forEach(entry => {
          markdown += formatEntry(entry);
        });
        markdown += '\n';
      }

      if (hasRefactors) {
        markdown += '### Refactoring\n';
        group.refactors.forEach(entry => {
          markdown += formatEntry(entry);
        });
        markdown += '\n';
      }

      if (hasPerfs) {
        markdown += '### Performance Improvements\n';
        group.perfs.forEach(entry => {
          markdown += formatEntry(entry);
        });
        markdown += '\n';
      }

      if (hasDocs) {
        markdown += '### Documentation\n';
        group.docs.forEach(entry => {
          markdown += formatEntry(entry);
        });
        markdown += '\n';
      }

      if (hasStyles) {
        markdown += '### Styling & UI/UX\n';
        group.styles.forEach(entry => {
          markdown += formatEntry(entry);
        });
        markdown += '\n';
      }

      if (hasOthers) {
        markdown += '### Miscellaneous\n';
        group.others.forEach(entry => {
          let descStr = entry.desc.trim();
          descStr = descStr.charAt(0).toUpperCase() + descStr.slice(1);
          markdown += `- ${descStr} ([${entry.hash}](https://github.com/VirgenRayzon/BuilbotAI/commit/${entry.hash}))\n`;
        });
        markdown += '\n';
      }
    });

    const outputPath = path.join(__dirname, '..', 'CHANGELOG.md');
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log('Changelog updated successfully at CHANGELOG.md');
  } catch (error) {
    console.error('Error generating changelog:', error);
    process.exit(1);
  }
}

generateChangelog();
