const test = require("node:test");
const assert = require("node:assert/strict");

const { config } = require("../src/config/env");
const providerManager = require("../src/services/ProviderManager");

const providerKeys = {
  plugsky: "plugskyApiKey",
  chatgpt: "chatgptApiKey",
  fable: "fableRapidApiKey",
  groq: "groqApiKey",
  airouter: "airouterApiKey",
  gemini: "geminiApiKey",
  cohere: "cohereApiKey",
};

function configureOnly(providerName) {
  for (const configKey of Object.values(providerKeys)) config[configKey] = "";
  if (providerName) config[providerKeys[providerName]] = "test-key";
  for (const provider of Object.values(providerManager.providers)) {
    provider.isSuspended = false;
    provider.consecutiveErrors = 0;
  }
}

test("auto selection only chooses a configured provider", () => {
  configureOnly("chatgpt");
  assert.equal(providerManager.getBestProvider("normal", "Auto"), "chatgpt");
  assert.deepEqual(providerManager.getAvailableProviders(), ["chatgpt"]);
});

test("an unconfigured preferred provider falls back to a configured provider", () => {
  configureOnly("groq");
  assert.equal(providerManager.getBestProvider("normal", "Gemini"), "groq");
  assert.equal(providerManager.getFallbackProvider("gemini"), "groq");
});

test("selection fails fast when no provider is configured", () => {
  configureOnly(null);
  assert.equal(providerManager.getBestProvider("normal", "Auto"), null);
  assert.equal(providerManager.getFallbackProvider("gemini"), null);
  assert.equal(providerManager.getStats().gemini.status, "unconfigured");
});

test("the AI Router models picked by name are answered by AI Router", () => {
  configureOnly("airouter");
  for (const label of ["DeepSeek V4.1 Flash", "Ling 3.0 Flash", "VetroAI", "vetroai"]) {
    assert.equal(providerManager.getBestProvider("normal", label), "airouter", label);
  }
});
