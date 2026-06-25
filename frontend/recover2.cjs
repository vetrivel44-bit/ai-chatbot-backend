const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
let candidates = [];

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            walk(p);
        } else if (stat.isFile() && f !== 'entries.json') {
            const content = fs.readFileSync(p, 'utf8');
            if (content.includes('export default function App') && content.includes('import React')) {
                candidates.push({ p, mtime: stat.mtimeMs, lines: content.split('\\n').length });
            }
        }
    }
}

walk(historyDir);

candidates.sort((a, b) => b.mtime - a.mtime);

console.log("Top 10 recent App.jsx backups:");
candidates.slice(0, 10).forEach(c => {
    console.log(`- ${new Date(c.mtime).toLocaleString()} | Lines: ${c.lines} | ${c.p}`);
});
