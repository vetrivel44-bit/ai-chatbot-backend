const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
let bestFile = null;
let bestTime = 0;

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            walk(p);
        } else if (stat.isFile() && f !== 'entries.json') {
            // Check file content for the user's recent changes
            const content = fs.readFileSync(p, 'utf8');
            if (content.includes('sidebarCollapsed') && content.includes('getDynamicGreeting')) {
                if (stat.mtimeMs > bestTime) {
                    bestTime = stat.mtimeMs;
                    bestFile = p;
                }
            }
        }
    }
}

walk(historyDir);

if (bestFile) {
    console.log("Found backup at: " + bestFile);
    console.log("Last modified: " + new Date(bestTime).toLocaleString());
    const content = fs.readFileSync(bestFile, 'utf8');
    fs.writeFileSync('src/App.jsx.bak', content);
    console.log("Copied to src/App.jsx.bak! Lines: " + content.split('\n').length);
} else {
    console.log("No backup found!");
}
