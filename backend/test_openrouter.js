require("dotenv").config();
const { generateStream } = require("./src/providers/openrouterAdapter");

async function run() {
  try {
    const stream = await generateStream([{ role: "user", content: "Hi" }]);
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
      console.log("CHUNK:", decoder.decode(chunk));
    }
    console.log("Success!");
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

run();
