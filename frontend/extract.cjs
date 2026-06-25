const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptFile = 'C:\\Users\\Ramalingam\\.gemini\\antigravity-ide\\brain\\4e3064d5-7e73-4db6-818b-53cbff7d92b0\\.system_generated\\logs\\transcript.jsonl';

async function extract() {
    const fileStream = fs.createReadStream(transcriptFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let bestDiff = "";

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (entry.content && entry.content.includes('[diff_block_start]')) {
                bestDiff += "\\n" + entry.content;
            }
        } catch(e) {}
    }
    
    fs.writeFileSync('transcript_extracted.txt', bestDiff);
    console.log("Extracted diff blocks.");
}
extract();
