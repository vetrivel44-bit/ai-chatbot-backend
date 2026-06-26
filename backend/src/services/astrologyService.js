const https = require("https");
const logger = require("../utils/logger");

const ASTRO_API_KEY = "4843d1bcc5fb44b13f36d78d2127ca7448d974a922edb3eff1dea49ed40f050e";
const ASTRO_HOST = "api.freeastroapi.com";

function makeHttpsRequest(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: ASTRO_HOST,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ASTRO_API_KEY,
        "Content-Length": Buffer.byteLength(data)
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(data);
    req.end();
  });
}

/**
 * Fetches astrological data from FreeAstroAPI
 * @param {Object} details { year, month, day, hour, minute, city }
 */
async function getAstrologyData(details) {
  if (!details || !details.year || !details.month || !details.day || !details.city) {
    return null;
  }
  
  try {
    const payload = {
      year: details.year,
      month: details.month,
      day: details.day,
      hour: details.hour || 12,
      minute: details.minute || 0,
      city: details.city
    };

    // Sequential requests to avoid FreeAstroAPI's per-second rate limits
    const chartData = await makeHttpsRequest("/api/v2/vedic/chart", payload);
    let dashaData = null;
    
    try {
      // Small delay to respect rate limit
      await new Promise(r => setTimeout(r, 1000));
      dashaData = await makeHttpsRequest("/api/v2/vedic/dasha", payload);
    } catch (e) {
      logger.warn("Dasha fetch failed, but chart succeeded");
    }

    return {
      astrology_system: "Vedic (Sidereal, Lahiri Ayanamsa)",
      chart: chartData,
      dasha: dashaData
    };
  } catch (err) {
    logger.warn("Astrology service error", { error: err.message });
    return null;
  }
}

/**
 * Uses a fast LLM to quickly extract birth details from recent chat messages.
 */
async function extractBirthDetails(messages, groqClient) {
  if (!groqClient) return null;
  
  try {
    const historyText = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");
    
    const extractionPrompt = `Extract the user's birth details from the chat log. 
Return ONLY a raw JSON object with keys: year (int), month (int), day (int), hour (int, 24h), minute (int), city (string). 
If the information is completely missing, return {"missing": true}. Do NOT return markdown or explanation.

Chat Log:
${historyText}`;

    const completion = await groqClient.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      max_tokens: 100,
      messages: [{ role: "user", content: extractionPrompt }]
    });

    const content = completion.choices[0].message.content.trim();
    const jsonStr = content.replace(/^```json\s*|```\s*$/gi, '');
    const data = JSON.parse(jsonStr);
    
    if (data.missing || !data.year || !data.city) return null;
    return data;
  } catch (e) {
    return null;
  }
}

module.exports = { getAstrologyData, extractBirthDetails };
