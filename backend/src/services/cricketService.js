const logger = require("../utils/logger");

const BASE = "https://cricbuzz-live.vercel.app/v1";

// ── In-memory cache (30s TTL) ────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 30_000;

function cached(key, fetcher) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data);
  return fetcher().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

async function safeFetch(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "VetroAI/1.0" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Cricbuzz upstream ${res.status}`);
  return res.json();
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseScoreString(scoreStr) {
  if (!scoreStr) return { runs: null, wickets: null, overs: null, raw: "" };
  const m = scoreStr.match(/(\d+)(?:\/(\d+))?\s*(?:\(([^)]+)\))?/);
  return {
    runs: m ? Number(m[1]) : null,
    wickets: m && m[2] ? Number(m[2]) : null,
    overs: m && m[3] ? m[3].trim() : null,
    raw: scoreStr.trim(),
  };
}

function detectFormat(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("t20") || t.includes("twenty20") || t.includes("ipl") || t.includes("bbl") || t.includes("bpl") || t.includes("psl") || t.includes("cpl") || t.includes("ilt20") || t.includes("sa20")) return "T20";
  if (t.includes("odi") || t.includes("one day") || t.includes("one-day")) return "ODI";
  if (t.includes("test")) return "Test";
  return "Limited Overs";
}

function parseTeamFromLiveMatch(teamObj) {
  if (!teamObj) return { name: "", shortName: "", score: null, wickets: null, overs: null, scoreRaw: "" };
  const name = (teamObj.team || "").replace(/\.\./g, "").trim();
  const parsed = parseScoreString(teamObj.run || "");
  return {
    name,
    shortName: name,
    score: parsed.runs,
    wickets: parsed.wickets,
    overs: parsed.overs,
    scoreRaw: parsed.raw || teamObj.run || "",
  };
}

// ── Public API ───────────────────────────────────────────────────────

async function getLiveMatches() {
  return cached("live", async () => {
    const types = ["international", "league", "domestic", "women"];
    const results = await Promise.allSettled(
      types.map((type) => safeFetch(`${BASE}/matches/live?type=${type}`))
    );

    const allMatches = [];
    const seenIds = new Set();

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const matches = result.value?.data?.matches || [];
      for (const m of matches) {
        if (seenIds.has(m.id)) continue;
        seenIds.add(m.id);

        const teams = m.teams || [];
        const t1 = parseTeamFromLiveMatch(teams[0]);
        const t2 = parseTeamFromLiveMatch(teams[1]);
        const venue = m.timeAndPlace?.place?.replace(/^at\s+/i, "") || "";

        allMatches.push({
          id: m.id,
          title: (m.title || "").replace(/,\s*$/, "").trim(),
          format: detectFormat(m.title || ""),
          status: m.overview || "",
          venue,
          date: m.timeAndPlace?.date || "",
          team1: t1,
          team2: t2,
          toss: null,
          series: "",
          startTime: m.timeAndPlace?.time || null,
        });
      }
    }

    return allMatches;
  });
}

async function getMatchDetails(matchId) {
  return cached(`match:${matchId}`, async () => {
    const raw = await safeFetch(`${BASE}/score/${matchId}`);
    const d = raw.data || {};

    const liveScore = parseScoreString(d.liveScore);

    return {
      id: matchId,
      title: d.title || "",
      format: detectFormat(d.title || ""),
      status: d.update || "",
      liveScore: d.liveScore || "",
      runRate: d.runRate || null,
      batsmen: [
        {
          name: d.batsmanOne || "",
          runs: d.batsmanOneRun || "0",
          balls: (d.batsmanOneBall || "").replace(/[()]/g, ""),
          strikeRate: d.batsmanOneSR || "0",
        },
        {
          name: d.batsmanTwo || "",
          runs: d.batsmanTwoRun || "0",
          balls: (d.batsmanTwoBall || "").replace(/[()]/g, ""),
          strikeRate: d.batsmanTwoSR || "0",
        },
      ],
      bowlers: [
        {
          name: d.bowlerOne || "",
          overs: d.bowlerOneOver || "",
          runs: d.bowlerOneRun || "",
          wickets: d.bowlerOneWickets || "",
          economy: d.bowlerOneEconomy || "",
        },
        {
          name: d.bowlerTwo || "",
          overs: d.bowlerTwoOver || "",
          runs: d.bowlerTwoRun || "",
          wickets: d.bowlerTwoWicket || "",
          economy: d.bowlerTwoEconomy || "",
        },
      ],
      currentRunRate: liveScore.overs ? null : null,
      requiredRunRate: null,
      matchSummary: d.update || "",
    };
  });
}

async function getCommentary(matchId) {
  return cached(`commentary:${matchId}`, () =>
    Promise.resolve({ matchId, commentary: [], note: "Ball-by-ball commentary not available from this API source" })
  );
}

async function getPlayerInfo(playerId) {
  return cached(`player:${playerId}`, () =>
    Promise.resolve({ id: playerId, note: "Player details not available from this API source" })
  );
}

module.exports = {
  getLiveMatches,
  getMatchDetails,
  getCommentary,
  getPlayerInfo,
};
