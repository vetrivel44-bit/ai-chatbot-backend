const fs = require('fs');

const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Icon replacement
content = content.replace(
  /<span className="inline-flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: "linear-gradient\(135deg, #f59e0b, #ea580c\)", flexShrink: 0 }}>\s*<Sun size=\{20\} color="#fff" \/>\s*<\/span>/,
  `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#da7756" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/></svg>`
);

// 2. Placeholder replacement
const phStart = content.indexOf('placeholder={');
if (phStart !== -1) {
  const isDictatingIdx = content.indexOf('isDictating ? t.listening', phStart);
  if (isDictatingIdx !== -1) {
    const endBrace = content.indexOf('}', isDictatingIdx);
    if (endBrace !== -1) {
      content = content.slice(0, phStart) + 'placeholder="How can I help you today?"' + content.slice(endBrace + 1);
    }
  }
}

// 3. Input Box Banner & padding
content = content.replace(
  /<form className="claude-input-box bg-slate-800 md:bg-\[var\(--bg-elevated\)\] border border-slate-700 md:border-\[var\(--border-str\)\]" onSubmit=\{sendMessage\}>/,
  `<form className="claude-input-box bg-slate-800 md:bg-[var(--bg-elevated)] border border-slate-700 md:border-[var(--border-str)]" onSubmit={sendMessage} style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
        <div style={{ background: "var(--bg-hover)", padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>Vetro Fable 5 is currently unavailable.</span>
          <a href="#" style={{ color: "var(--ink-3)", textDecoration: "underline", fontWeight: 500 }}>Learn more</a>
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column" }}>`
);

// Closing the div we just opened inside the form
content = content.replace(
  /<\/div>\s*<\/form>/,
  `</div>\n        </div>\n      </form>`
);

// 4. Model selector text & mic
content = content.replace(
  /<div className="claude-footer-right">\s*{\/\* Mic Icon - Dictation placeholder \*\/}/,
  `<div className="claude-footer-right">
            <button type="button" className="mode-pill-btn" style={{ fontSize: "12.5px", background: "none", border: "none", color: "var(--ink-3)", display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", cursor: "pointer", marginRight: "4px" }} onClick={() => setShowModelPicker(p => !p)}>
              Opus 4.8 High <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            {/* Mic Icon - Dictation placeholder */}`
);

// 5. Send button hide when empty
content = content.replace(
  /<button \s*type="submit" \s*className={`claude-send-btn \${\(!input\.trim\(\) && !selFile\) \? "bg-slate-700 md:bg-transparent text-slate-500 md:text-\[var\(--ink-4\)\]" : "active bg-amber-500 md:bg-\[var\(--ink\)\] text-slate-900 md:text-\[var\(--bg\)\]"}`} \s*disabled=\{!input\.trim\(\) && !selFile\}\s*title="Send message"\s*>/m,
  `<button 
                type="submit" 
                className="claude-send-btn active bg-amber-500 md:bg-[var(--ink)] text-slate-900 md:text-[var(--bg)]"
                title="Send message"
                style={{ display: (!input.trim() && !selFile) ? 'none' : 'flex' }}
              >`
);

// 6. Suggestions update
content = content.replace(
  /\{suggestionOptions\.slice\(0, 5\)\.map\(\(s, idx\) => \{\s*const Icon = \[GraduationCap, Paintbrush, Terminal, Coffee, Compass\]\[idx % 5\];\s*return \(\s*<button key=\{idx\} type="button" className="claude-pill" onClick=\{.*?\}>\s*<Icon size=\{15\} \/>\s*<span className="truncate" style=\{\{ maxWidth: 220 \}\}>\{s\}<\/span>\s*<\/button>\s*\);\s*\}\)\}/s,
  `{[
                          { label: "Write", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> },
                          { label: "Learn", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
                          { label: "</> Code", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
                          { label: "Life stuff", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg> },
                          { label: "Vetro's choice", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg> },
                        ].map((s, idx) => {
                          return (
                            <button key={idx} type="button" className="claude-pill" onClick={() => sendMessage(null, "Help me with " + s.label)}>
                              {s.icon}
                              <span className="truncate" style={{ maxWidth: 220 }}>{s.label}</span>
                            </button>
                          );
                        })}`
);

fs.writeFileSync(file, content);
console.log('App.jsx modified perfectly to match image');
