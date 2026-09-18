const logger = require("../utils/logger");
const { config } = require("../config/env");
const geminiAdapter = require("../providers/geminiAdapter");
const mistralAdapter = require("../providers/mistralAdapter");
const sambanovaAdapter = require("../providers/sambanovaAdapter");
const agnesAdapter = require("../providers/agnesAdapter");
const chatgptAdapter = require("../providers/chatgptAdapter");
const cerebrasAdapter = require("../providers/cerebrasAdapter");

class ProviderManager {
  constructor() {
    this.providers = {
      chatgpt: {
        adapter: chatgptAdapter,
        weight: 85,
        score: 85,
        latency: 0,
        successRate: 1,
        consecutiveErrors: 0,
        isSuspended: false,
        lastFailure: 0,
        cooldown: 20000,
        fallbacks: ["mistral", "agnes", "sambanova", "gemini"],
      },
      mistral: {
        adapter: mistralAdapter,
        weight: 90,
        score: 90,
        latency: 0,
        successRate: 1,
        consecutiveErrors: 0,
        isSuspended: false,
        lastFailure: 0,
        cooldown: 20000,
        fallbacks: ["chatgpt", "sambanova", "agnes", "gemini"],
      },
      agnes: {
        adapter: agnesAdapter,
        weight: 100,
        score: 100,
        latency: 0,
        successRate: 1,
        consecutiveErrors: 0,
        isSuspended: false,
        lastFailure: 0,
        cooldown: 20000,
        fallbacks: ["mistral", "chatgpt", "sambanova", "gemini"],
      },
      sambanova: {
        adapter: sambanovaAdapter,
        weight: 80,
        score: 80,
        latency: 0,
        successRate: 1,
        consecutiveErrors: 0,
        isSuspended: false,
        lastFailure: 0,
        cooldown: 20000,
        fallbacks: ["mistral", "agnes", "chatgpt", "gemini"],
      },
      gemini: {
        adapter: geminiAdapter,
        weight: 50,
        score: 50,
        latency: 0,
        successRate: 1,
        consecutiveErrors: 0,
        isSuspended: false,
        lastFailure: 0,
        cooldown: 20000,
        fallbacks: ["mistral", "agnes", "sambanova", "chatgpt"],
      },
      cerebras: {
        adapter: cerebrasAdapter,
        weight: 100,
        score: 100,
        latency: 0,
        successRate: 1,
        consecutiveErrors: 0,
        isSuspended: false,
        lastFailure: 0,
        cooldown: 20000,
        fallbacks: ["mistral", "agnes", "sambanova", "chatgpt"],
      },
    };

    if (!process.env.LAMBDA_TASK_ROOT) {
      // Unreferenced on purpose: the HTTP listener is what should keep the
      // process alive. A referenced poll here holds open anything that merely
      // requires this module — a test run never exits, and a short-lived
      // script hangs for 15 seconds at a time.
      this.healthCheckTimer = setInterval(() => this.checkHealth(), 15000);
      this.healthCheckTimer.unref?.();
    }
  }

  isConfigured(providerName) {
    const configured = {
      chatgpt: Boolean(config.chatgptApiKey),
      mistral: Boolean(config.mistralApiKey),
      agnes: Boolean(config.agnesApiKey),
      sambanova: Boolean(config.sambanovaApiKey),
      gemini: Boolean(config.geminiApiKey),
      cerebras: Boolean(config.cerebrasApiKey),
    };
    return configured[providerName] === true;
  }

  getAvailableProviders({ includeSuspended = false } = {}) {
    return Object.keys(this.providers).filter((name) => {
      if (!this.isConfigured(name)) return false;
      return includeSuspended || !this.providers[name].isSuspended;
    });
  }

  async checkHealth() {
    for (const [name, p] of Object.entries(this.providers)) {
      if (p.isSuspended && Date.now() - p.lastFailure > p.cooldown) {
        logger.info(`ProviderManager: Re-testing suspended provider ${name}`);
        p.isSuspended = false;
        p.consecutiveErrors = 0;
      }
    }
  }

  resetAllProviders() {
    logger.warn("ProviderManager: All providers suspended — resetting all to recover.");
    for (const p of Object.values(this.providers)) {
      p.isSuspended = false;
      p.consecutiveErrors = 0;
    }
  }

  getBestProvider(mode, preferredProvider) {
    if (preferredProvider && preferredProvider !== "undefined" && preferredProvider !== "auto") {
      const pref = preferredProvider.toLowerCase();
      if (this.providers[pref] && this.isConfigured(pref)) {
        const p = this.providers[pref];
        if (p.isSuspended && Date.now() - p.lastFailure > p.cooldown) {
          p.isSuspended = false;
          p.consecutiveErrors = 0;
        }
        if (!p.isSuspended) return pref;
      }
    }

    for (const [, p] of Object.entries(this.providers)) {
      if (p.isSuspended && Date.now() - p.lastFailure > p.cooldown) {
        p.isSuspended = false;
        p.consecutiveErrors = 0;
      }
    }

    let candidates = this.getAvailableProviders();
    if (candidates.length === 0) {
      const configured = this.getAvailableProviders({ includeSuspended: true });
      if (configured.length === 0) return null;
      for (const name of configured) {
        this.providers[name].isSuspended = false;
        this.providers[name].consecutiveErrors = 0;
      }
      candidates = configured;
    }

    return candidates.sort((a, b) => {
      const pA = this.providers[a];
      const pB = this.providers[b];
      let scoreA = pA.weight;
      let scoreB = pB.weight;

      if (mode === "debugger" || mode === "coding") {
        if (a === "chatgpt") scoreA += 50;
        if (b === "chatgpt") scoreB += 50;
      } else if (mode === "deep_search" || mode === "analyst") {
        if (a === "gemini") scoreA += 50;
        if (b === "gemini") scoreB += 50;
      } else if (mode === "creative") {
        if (a === "mistral") scoreA += 50;
        if (b === "mistral") scoreB += 50;
      }

      return scoreB - scoreA;
    })[0];
  }

  getFallbackProvider(failedProvider, excludedProviders = []) {
    const p = this.providers[failedProvider];
    const fallbackList = (p && p.fallbacks) ? p.fallbacks : ["gemini", "sambanova", "mistral", "agnes", "chatgpt", "cerebras"];
    const excluded = new Set([failedProvider, ...excludedProviders]);

    for (const [, prov] of Object.entries(this.providers)) {
      if (prov.isSuspended && Date.now() - prov.lastFailure > prov.cooldown) {
        prov.isSuspended = false;
        prov.consecutiveErrors = 0;
      }
    }

    for (const f of fallbackList) {
      if (this.providers[f] && this.isConfigured(f) && !this.providers[f].isSuspended && !excluded.has(f)) {
        return f;
      }
    }

    // Try any remaining configured provider before giving up.
    const remaining = this.getAvailableProviders().filter((name) => !excluded.has(name));
    if (remaining.length === 0) return null;
    return remaining.sort(
      (a, b) => this.providers[b].weight - this.providers[a].weight
    )[0];
  }

  updateMetrics(providerName, success, latency) {
    const p = this.providers[providerName];
    if (!p) return;

    if (success) {
      p.consecutiveErrors = 0;
      p.latency = p.latency === 0 ? latency : (p.latency * 0.8 + latency * 0.2);
      p.successRate = (p.successRate * 0.95 + 0.05);
    } else {
      p.consecutiveErrors++;
      p.successRate = (p.successRate * 0.9);
      if (p.consecutiveErrors >= 5) {
        logger.warn(`ProviderManager: Suspending ${providerName} after ${p.consecutiveErrors} consecutive errors`);
        p.isSuspended = true;
        p.lastFailure = Date.now();
      }
    }
  }

  suspendProvider(providerName, reason) {
    const p = this.providers[providerName];
    if (!p) return;
    logger.warn(`ProviderManager: Suspending ${providerName}. Reason: ${reason}`);
    p.isSuspended = true;
    p.lastFailure = Date.now();
  }

  getAdapter(name) {
    return this.providers[name]?.adapter;
  }

  getStats() {
    const stats = {};
    for (const [name, p] of Object.entries(this.providers)) {
      stats[name] = {
        configured: this.isConfigured(name),
        status: !this.isConfigured(name)
          ? "unconfigured"
          : (p.isSuspended ? "suspended" : (p.consecutiveErrors > 0 ? "degraded" : "healthy")),
        latency: Math.round(p.latency),
        successRate: Math.round(p.successRate * 100) / 100,
      };
    }
    return stats;
  }
}

module.exports = new ProviderManager();
