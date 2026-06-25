require("dotenv").config();
const orchestrator = require("./src/services/AIOrchestrator");
const { generateStream } = require("./src/providers/openrouterAdapter");

async function run() {
  try {
    const stream = await generateStream([{ role: "user", content: "Hi" }]);
    
    // Create a mock response object
    const mockRes = {
      write: (str) => {
        console.log("RES.WRITE:", JSON.stringify(str));
      },
      end: () => console.log("RES.END")
    };
    
    await orchestrator.pipeStream(stream, mockRes, "openrouter");
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

run();
