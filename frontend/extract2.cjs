const fs = require('fs');
const readline = require('readline');
const transcriptFile = 'C:\\Users\\Ramalingam\\.gemini\\antigravity-ide\\brain\\4e3064d5-7e73-4db6-818b-53cbff7d92b0\\.system_generated\\logs\\transcript.jsonl';

async function extract() {
    const fileStream = fs.createReadStream(transcriptFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lastFullFile = null;
    let lines = 0;

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            // check tool calls
            if (entry.tool_calls) {
                for (const tc of entry.tool_calls) {
                    if (tc.function.name === 'write_to_file' && tc.function.arguments.TargetFile && tc.function.arguments.TargetFile.endsWith('App.jsx')) {
                        lastFullFile = tc.function.arguments.CodeContent;
                        lines = lastFullFile.split('\\n').length;
                    }
                }
            }
        } catch(e) {}
    }
    
    if (lastFullFile && lines > 2000) {
        fs.writeFileSync('src/App.jsx.recovered', lastFullFile);
        console.log("Recovered from write_to_file! Lines: " + lines);
    } else {
        console.log("No full write_to_file found for App.jsx.");
    }
}
extract();
