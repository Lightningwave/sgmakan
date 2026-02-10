/**
 * SGMakan Cafe Curator v3 — 4-Stage AI Pipeline
 * ================================================
 * Discovers new, trendy cafes/brunch spots in Singapore weekly.
 *
 * Stage 1 — DISCOVER: Search trusted food blogs via Serper for recent cafe articles.
 * Stage 2 — EXTRACT:  Use AI (structured output) to pull cafe names from blog snippets.
 * Stage 3 — VERIFY:   Cross-check every candidate against Google Places (Serper Places),
 *                      run fuzzy dedup against the existing DB, and let AI judge whether
 *                      the place is truly a new, currently-open cafe/brunch spot.
 * Stage 4 — ENRICH:   Generate description + vibe + tags + MRT in a SINGLE AI call,
 *                      find a valid image, map the neighborhood, and insert into DB.
 *                      High-confidence auto-promotes to `cafes`; low-confidence goes
 *                      to `pending_cafes` for admin review.
 *
 * Rate-limit aware (provider chain: OpenRouter → Groq → Gemini):
 *   - OpenRouter free tier: ~10-20 RPM
 *   - Groq free tier: 30 RPM, 1000 RPD
 *   - Gemini AI Studio free tier: 15 RPM, 1500 RPD
 *   - Global rate limiter enforces min gap between AI calls
 *   - Articles capped at 30, search queries capped at ~24
 *   - Enrichment uses 1 AI call per cafe (not 4)
 *
 * Designed to be run weekly via GitHub Actions (see .github/workflows/).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { supabase } = require('./db-config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Config ────────────────────────────────────────────────────────────────────
const SERPER_API_KEY     = process.env.SERPER_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL   = process.env.OPENROUTER_MODEL || 'qwen/qwen3-next-80b-a3b-instruct:free';
const GROQ_API_KEY       = process.env.GROQ_API_KEY;
const GROQ_MODEL         = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_API_KEY     = process.env.GEMINI_API_KEY;
const GEMINI_MODEL       = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

// Gemini client (initialised lazily on first use)
let geminiModel = null;
function getGeminiModel() {
    if (!geminiModel && GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    }
    return geminiModel;
}

const REQUEST_TIMEOUT_MS     = 25000;
const REQUEST_RETRIES        = 2;
const SERPER_DELAY_MS        = 600;      // delay between Serper calls
const AUTO_APPROVE_THRESHOLD = 0.80;     // confidence >= 80% → straight to `cafes`
const LOOKBACK_MONTHS        = 2;        // search current + previous month
const MAX_ARTICLES           = 30;       // cap articles sent to AI extraction
const EXTRACTION_BATCH_SIZE  = 10;       // articles per AI extraction call

// ─── Rate Limiter ──────────────────────────────────────────────────────────────
// Free tier limits:
//   OpenRouter free models:     ~10-20 RPM (we use 10 as safe floor)
//   Gemini AI Studio (flash):   15 RPM, 1500 RPD
// We enforce a global minimum gap of 5s between AI calls (~12 RPM max).
const AI_MIN_GAP_MS       = 5000;    // minimum 5s between any two AI calls
const AI_MAX_RETRIES      = 3;       // retries on 429 before switching provider
const AI_RETRY_BASE_MS    = 5000;    // base delay for retry backoff: 5s, 10s, 20s

let lastAICallTime        = 0;       // timestamp of last AI call
let aiCallCount           = 0;       // total AI calls this run
let openrouterCooldownEnd = 0;       // when to retry OpenRouter after cooldown
let groqCooldownEnd       = 0;       // when to retry Groq after cooldown
let geminiCooldownEnd     = 0;       // when to retry Gemini after cooldown
let activeProvider        = null;    // tracks which provider answered last

async function rateLimitedDelay() {
    const now = Date.now();
    const elapsed = now - lastAICallTime;
    if (elapsed < AI_MIN_GAP_MS) {
        await sleep(AI_MIN_GAP_MS - elapsed);
    }
    lastAICallTime = Date.now();
    aiCallCount++;
}

// ─── Date helpers ──────────────────────────────────────────────────────────────
const NOW          = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const MONTHS_TO_SEARCH = [];
for (let i = 0; i < LOOKBACK_MONTHS; i++) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
    MONTHS_TO_SEARCH.push({
        month: d.toLocaleString('en-US', { month: 'long' }),
        year:  d.getFullYear()
    });
}

// ─── Trusted blog sources ──────────────────────────────────────────────────────
// Top-5 get site-specific queries; the rest are covered by general queries
const PRIMARY_SITES = [
    'sethlui.com',
    'danielfooddiary.com',
    'eatbook.sg',
    '8days.sg',
    'ladyironchef.com'
];

// Search intents (reduced from 4 to 2 — broader terms catch more)
const SEARCH_INTENTS = [
    'new cafe OR new brunch',
    'newly opened cafe OR best new coffee'
];

// ─── Full Singapore neighborhood list (matching schema) ────────────────────────
const NEIGHBORHOOD_KEYWORDS = {
    'Tiong Bahru':     ['tiong bahru'],
    'Joo Chiat':       ['joo chiat', 'katong', 'east coast rd', 'e coast rd', 'still rd', 'dunman'],
    'Dempsey Hill':    ['dempsey'],
    'Telok Ayer':      ['telok ayer', 'amoy st', 'cecil st'],
    'Keong Saik':      ['keong saik', 'chinatown', 'neil road'],
    'Holland Village':  ['holland village', 'holland v', 'chip bee'],
    'Jalan Besar':     ['jalan besar', 'lavender', 'tyrwhitt'],
    'Siglap':          ['siglap', 'frankel', 'upper east coast'],
    'Bras Basah':      ['bras basah', 'bugis', 'bencoolen', 'victoria st'],
    'Robertson Quay':  ['robertson quay', 'river valley', 'mohamed sultan'],
    'Everton Park':    ['everton park', 'everton rd'],
    'Orchard':         ['orchard', 'somerset', 'scotts'],
    'Kampong Glam':    ['kampong glam', 'haji lane', 'arab st', 'muscat st'],
    'Tanjong Pagar':   ['tanjong pagar', 'guoco', 'wallich'],
    'Clementi':        ['clementi', 'sunset way'],
    'Bukit Timah':     ['bukit timah', 'sixth avenue', '6th avenue', 'dunearn'],
    'Serangoon':       ['serangoon', 'nex', 'kovan', 'upper serangoon'],
    'Toa Payoh':       ['toa payoh'],
    'Ang Mo Kio':      ['ang mo kio', 'amk'],
    'Pasir Ris':       ['pasir ris'],
    'Tampines':        ['tampines'],
    'Woodlands':       ['woodlands'],
    'Jurong':          ['jurong', 'jurong east', 'jurong west'],
    // Additional neighborhoods for broader coverage
    'Changi':          ['changi', 'airport blvd', 'jewel'],
    'Thomson':         ['upper thomson', 'thomson rd', 'thomson road', 'sin ming'],
    'Paya Lebar':      ['paya lebar', 'geylang serai', 'sims ave'],
    'Bedok':           ['bedok', 'bedok north', 'bedok south'],
    'Bishan':          ['bishan', 'marymount'],
    'Novena':          ['novena', 'balestier', 'whampoa'],
    'Marine Parade':   ['marine parade', 'marine terrace'],
    'Kallang':         ['kallang', 'stadium', 'mountbatten'],
    'Sentosa':         ['sentosa', 'harbourfront'],
    'City Hall':       ['city hall', 'raffles place', 'marina bay', 'fullerton'],
};

// ─── Category / rejection filters ──────────────────────────────────────────────
const ALLOWED_CATEGORIES = [
    'cafe', 'coffee shop', 'coffee', 'bakery', 'dessert shop', 'tea house',
    'espresso bar', 'brunch', 'breakfast', 'restaurant', 'sandwich shop',
    'juice bar', 'ice cream', 'patisserie', 'bistro'
];

const REJECT_NAME_SIGNALS = [
    'steakhouse', 'seafood', 'sushi', 'ramen', 'hotpot', 'bbq',
    'buffet', 'hawker', 'fast food', 'kfc', 'mcdonald', 'subway',
    'nightclub', 'ktv', 'karaoke', 'pub', 'lounge', 'clinic',
    'salon', 'spa', 'gym', 'hotel', 'hostel', 'laundry'
];

// ════════════════════════════════════════════════════════════════════════════════
//  UTILITY HELPERS
// ════════════════════════════════════════════════════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS, retries = REQUEST_RETRIES) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);
            return res;
        } catch (err) {
            clearTimeout(timer);
            lastError = err;
            if (attempt < retries) await sleep(600 * (attempt + 1));
        }
    }
    throw lastError;
}

/** Simple normalised Levenshtein similarity 0-1 */
function similarity(a, b) {
    a = a.toLowerCase().trim();
    b = b.toLowerCase().trim();
    if (a === b) return 1;
    const longer  = a.length >= b.length ? a : b;
    const shorter = a.length >= b.length ? b : a;
    if (longer.length === 0) return 1;
    const costs = [];
    for (let i = 0; i <= longer.length; i++) {
        let lastVal = i;
        for (let j = 0; j <= shorter.length; j++) {
            if (i === 0) { costs[j] = j; continue; }
            if (j > 0) {
                let newVal = costs[j - 1];
                if (longer[i - 1] !== shorter[j - 1])
                    newVal = Math.min(newVal, lastVal, costs[j]) + 1;
                costs[j - 1] = lastVal;
                lastVal = newVal;
            }
        }
        if (i > 0) costs[shorter.length] = lastVal;
    }
    return (longer.length - costs[shorter.length]) / longer.length;
}

function normalizeCafeName(name) {
    return name
        .toLowerCase()
        .replace(/\b(cafe|café|coffee|roasters|roastery|bar|sg|singapore)\b/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function isFuzzyDuplicate(candidateName, existingNames) {
    const normCandidate = normalizeCafeName(candidateName);
    for (const existing of existingNames) {
        const normExisting = normalizeCafeName(existing);
        if (normCandidate === normExisting) return existing;
        if (similarity(candidateName, existing) >= 0.85) return existing;
        if (normCandidate.length > 3 && normExisting.length > 3) {
            if (normCandidate.includes(normExisting) || normExisting.includes(normCandidate)) return existing;
        }
    }
    return null;
}

function detectNeighborhood(address) {
    if (!address) return null;
    const lower = address.toLowerCase();
    for (const [name, keywords] of Object.entries(NEIGHBORHOOD_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) return name;
    }
    const postalMatch = address.match(/\b(\d{6})\b/);
    if (postalMatch) {
        const postalMap = {
            '01': 'City Hall', '02': 'City Hall', '03': 'Queenstown',
            '04': 'Telok Ayer', '05': 'Telok Ayer', '06': 'City Hall',
            '07': 'Bras Basah', '08': 'Bras Basah', '09': 'Orchard',
            '10': 'Orchard', '11': 'Orchard', '12': 'Toa Payoh',
            '13': 'Toa Payoh', '14': 'Jalan Besar', '15': 'Joo Chiat',
            '16': 'Siglap', '17': 'Tiong Bahru', '18': 'Tampines',
            '19': 'Serangoon', '20': 'Ang Mo Kio', '21': 'Clementi',
            '22': 'Jurong', '23': 'Bukit Timah', '24': 'Bukit Timah',
            '25': 'Woodlands', '26': 'Woodlands', '27': 'Woodlands',
            '28': 'Serangoon', '29': 'Serangoon', '30': 'Ang Mo Kio',
            '31': 'Toa Payoh', '32': 'Tampines',
            '33': 'Serangoon', '34': 'Serangoon', '35': 'Jalan Besar',
            '36': 'Jalan Besar', '37': 'Kallang', '38': 'Marine Parade',
            '39': 'Marine Parade', '40': 'Paya Lebar', '41': 'Paya Lebar',
            '42': 'Joo Chiat', '43': 'Bedok', '44': 'Bedok',
            '45': 'Bedok', '46': 'Pasir Ris', '47': 'Tampines',
            '48': 'Tampines', '49': 'Changi', '50': 'Pasir Ris',
            '51': 'Bishan', '52': 'Toa Payoh', '53': 'Serangoon',
            '54': 'Novena', '55': 'Novena', '56': 'Thomson',
            '57': 'Thomson', '58': 'Ang Mo Kio', '59': 'Ang Mo Kio',
            '60': 'Clementi', '61': 'Clementi', '62': 'Jurong',
            '63': 'Jurong', '64': 'Jurong', '65': 'Woodlands',
            '66': 'Woodlands', '67': 'Woodlands', '68': 'Woodlands',
            '69': 'Woodlands', '72': 'Woodlands', '73': 'Woodlands',
            '75': 'Woodlands', '76': 'Woodlands', '77': 'Woodlands',
            '78': 'Woodlands', '79': 'Woodlands', '80': 'Changi',
            '81': 'Changi', '82': 'Changi'
        };
        const districtStr = postalMatch[1].substring(0, 2);
        if (postalMap[districtStr]) return postalMap[districtStr];
    }
    return null;
}

// ════════════════════════════════════════════════════════════════════════════════
//  AI PROVIDER LAYER (OpenRouter primary, Gemini fallback, RPM-aware)
// ════════════════════════════════════════════════════════════════════════════════

/** Try OpenRouter. Returns content string or null on rate-limit. Throws on other errors. */
async function tryOpenRouter(messages, temperature, maxTokens) {
    if (!OPENROUTER_API_KEY) return null;
    if (Date.now() < openrouterCooldownEnd) return null;

    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
        try {
            const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://sgmakan.vercel.app',
                    'X-Title': 'SGMakan Cafe Curator'
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages,
                    temperature,
                    max_tokens: maxTokens
                })
            });

            if (res.ok) {
                activeProvider = 'openrouter';
                const data = await res.json();
                return data.choices?.[0]?.message?.content || '';
            }

            if (res.status === 429) {
                if (attempt < AI_MAX_RETRIES) {
                    const delay = AI_RETRY_BASE_MS * Math.pow(2, attempt);
                    console.log(`   [OpenRouter] 429 rate limit, retry in ${(delay / 1000).toFixed(0)}s (${attempt + 1}/${AI_MAX_RETRIES})...`);
                    await sleep(delay);
                    continue;
                }
                // Exhausted retries — cooldown for 2 minutes
                console.log('   [OpenRouter] Rate limit exhausted, cooldown 120s...');
                openrouterCooldownEnd = Date.now() + 120000;
                return null;
            }

            // Other HTTP error — don't retry, throw
            const errText = await res.text();
            throw new Error(`OpenRouter ${res.status}: ${errText.substring(0, 200)}`);
        } catch (err) {
            if (err.message?.startsWith('OpenRouter')) throw err;
            if (attempt === AI_MAX_RETRIES) return null; // network error, fall to Gemini
            await sleep(AI_RETRY_BASE_MS);
        }
    }
    return null;
}

/** Try Groq. Returns content string or null on rate-limit. OpenAI-compatible API. */
async function tryGroq(messages, temperature, maxTokens) {
    if (!GROQ_API_KEY) return null;
    if (Date.now() < groqCooldownEnd) return null;

    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
        try {
            const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages,
                    temperature,
                    max_tokens: maxTokens
                })
            });

            if (res.ok) {
                activeProvider = 'groq';
                const data = await res.json();
                return data.choices?.[0]?.message?.content || '';
            }

            if (res.status === 429) {
                // Extract retry-after header if available
                const retryAfter = res.headers?.get?.('retry-after');
                if (attempt < AI_MAX_RETRIES) {
                    const delay = retryAfter ? parseInt(retryAfter) * 1000 : AI_RETRY_BASE_MS * Math.pow(2, attempt);
                    console.log(`   [Groq] 429 rate limit, retry in ${(delay / 1000).toFixed(0)}s (${attempt + 1}/${AI_MAX_RETRIES})...`);
                    await sleep(delay);
                    continue;
                }
                console.log('   [Groq] Rate limit exhausted, cooldown 60s...');
                groqCooldownEnd = Date.now() + 60000;
                return null;
            }

            const errText = await res.text();
            throw new Error(`Groq ${res.status}: ${errText.substring(0, 200)}`);
        } catch (err) {
            if (err.message?.startsWith('Groq')) throw err;
            if (attempt === AI_MAX_RETRIES) return null;
            await sleep(AI_RETRY_BASE_MS);
        }
    }
    return null;
}

/** Try Gemini. Returns content string or throws. */
async function tryGemini(messages, temperature, maxTokens) {
    if (!GEMINI_API_KEY) return null;
    if (Date.now() < geminiCooldownEnd) return null;

    const model = getGeminiModel();
    if (!model) return null;

    const prompt = messages.map(m => m.content).join('\n\n');

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens }
        });

        activeProvider = 'gemini';
        return result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
        const errMsg = err.message || String(err);
        // Gemini 429 / quota — extract retry delay if available
        if (err.status === 429 || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
            // Try to extract retryDelay from Gemini's error details
            let cooldownMs = 60000; // default 60s
            const retryMatch = errMsg.match(/retry in ([\d.]+)s/i);
            if (retryMatch) {
                cooldownMs = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 2000; // +2s buffer
            }
            // If limit is 0, it's a daily quota — longer cooldown
            if (errMsg.includes('limit: 0')) {
                cooldownMs = 300000; // 5 minutes — daily quota likely exhausted
                console.log(`   [Gemini] Daily quota exhausted, cooldown 5min`);
            } else {
                console.log(`   [Gemini] Rate limited, cooldown ${(cooldownMs / 1000).toFixed(0)}s`);
            }
            geminiCooldownEnd = Date.now() + cooldownMs;
            return null;
        }
        // Non-rate-limit error
        console.log(`   [Gemini] Error: ${errMsg.substring(0, 150)}`);
        throw new Error(`Gemini error: ${errMsg.substring(0, 200)}`);
    }
}

/**
 * Unified AI caller with rate limiting.
 * Provider chain: OpenRouter → Groq → Gemini.
 * If all are in cooldown, WAITS for the earliest one to become available.
 */
async function callAI(messages, { temperature = 0.3, maxTokens = 2000 } = {}) {
    await rateLimitedDelay();

    // Check cooldown status for all providers
    const now = Date.now();
    const providers = [
        { name: 'OpenRouter', key: OPENROUTER_API_KEY, cooldownEnd: openrouterCooldownEnd },
        { name: 'Groq',       key: GROQ_API_KEY,       cooldownEnd: groqCooldownEnd },
        { name: 'Gemini',     key: GEMINI_API_KEY,      cooldownEnd: geminiCooldownEnd }
    ];

    const configured = providers.filter(p => p.key);
    const allCooling = configured.length > 0 && configured.every(p => p.cooldownEnd > now);

    if (allCooling) {
        const earliest = Math.min(...configured.map(p => p.cooldownEnd));
        const waitMs = earliest - now;
        console.log(`   All providers cooling down, waiting ${(waitMs / 1000).toFixed(0)}s...`);
        await sleep(waitMs + 1000);
    }

    // Try providers in order: OpenRouter → Groq → Gemini
    const orResult = await tryOpenRouter(messages, temperature, maxTokens);
    if (orResult !== null) return orResult;

    const groqResult = await tryGroq(messages, temperature, maxTokens);
    if (groqResult !== null) return groqResult;

    const gemResult = await tryGemini(messages, temperature, maxTokens);
    if (gemResult !== null) return gemResult;

    throw new Error('All AI providers failed (check API keys and quota)');
}

// ════════════════════════════════════════════════════════════════════════════════
//  STAGE 1 — DISCOVER (Serper web search, capped & efficient)
// ════════════════════════════════════════════════════════════════════════════════
function buildSearchQueries() {
    const queries = [];
    // Site-specific: top-5 blogs × 2 intents × 2 months = 20
    for (const site of PRIMARY_SITES) {
        for (const intent of SEARCH_INTENTS) {
            for (const { month, year } of MONTHS_TO_SEARCH) {
                queries.push(`site:${site} ${intent} singapore ${month} ${year}`);
            }
        }
    }
    // General search (no site): 2 intents × 2 months = 4
    for (const intent of SEARCH_INTENTS) {
        for (const { month, year } of MONTHS_TO_SEARCH) {
            queries.push(`${intent} singapore ${month} ${year}`);
        }
    }
    return queries; // ~24 total
}

async function searchSerper(query) {
    const res = await fetchWithTimeout('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'sg', num: 5 })
    });
    return res.json();
}

function isRecentResult(result) {
    const text = `${result.title || ''} ${result.snippet || ''} ${result.date || ''}`.toLowerCase();
    for (const { month, year } of MONTHS_TO_SEARCH) {
        if (text.includes(month.toLowerCase()) && text.includes(String(year))) return true;
    }
    if (text.includes('2025') || text.includes('2026')) return true;
    if (text.includes('new') && text.includes('cafe')) return true;
    return false;
}

async function stage1_discover() {
    console.log('STAGE 1: Discovering candidates from food blogs...');
    const queries = buildSearchQueries();
    console.log(`   ${queries.length} search queries across ${PRIMARY_SITES.length} primary blogs`);

    const rawResults = [];
    let searched = 0;

    for (const query of queries) {
        try {
            const data = await searchSerper(query);
            if (data.organic) {
                for (const result of data.organic) {
                    if (isRecentResult(result)) {
                        rawResults.push({
                            title: result.title,
                            snippet: result.snippet || '',
                            link: result.link,
                            date: result.date || null
                        });
                    }
                }
            }
        } catch (err) {
            // Silently skip failed queries
        }
        searched++;
        if (searched % 5 === 0) console.log(`   Searched ${searched}/${queries.length}...`);
        await sleep(SERPER_DELAY_MS);
    }

    // De-duplicate by URL, then cap at MAX_ARTICLES
    const unique = new Map();
    for (const r of rawResults) {
        if (!unique.has(r.link)) unique.set(r.link, r);
    }

    let articles = [...unique.values()];
    if (articles.length > MAX_ARTICLES) {
        console.log(`   Found ${articles.length} articles, capping at ${MAX_ARTICLES}`);
        articles = articles.slice(0, MAX_ARTICLES);
    }

    console.log(`   Using ${articles.length} unique recent articles\n`);
    return articles;
}

// ════════════════════════════════════════════════════════════════════════════════
//  STAGE 2 — EXTRACT (AI pulls cafe names from articles, large batches)
// ════════════════════════════════════════════════════════════════════════════════
async function stage2_extract(articles) {
    console.log('STAGE 2: Extracting cafe names with AI...');

    const allCandidates = new Map();
    const totalBatches = Math.ceil(articles.length / EXTRACTION_BATCH_SIZE);
    console.log(`   ${articles.length} articles in ${totalBatches} batches (${EXTRACTION_BATCH_SIZE}/batch)`);

    for (let i = 0; i < articles.length; i += EXTRACTION_BATCH_SIZE) {
        const batch = articles.slice(i, i + EXTRACTION_BATCH_SIZE);
        const batchNum = Math.floor(i / EXTRACTION_BATCH_SIZE) + 1;
        const batchText = batch.map((a, idx) =>
            `[${idx + 1}] ${a.title}\n${a.snippet}`
        ).join('\n\n');

        const prompt = `You are a Singapore cafe data extractor. Extract ONLY the names of cafes, coffee shops, or brunch spots mentioned in these article snippets.

RULES:
- Return ONLY a JSON array of strings: ["Cafe Name 1", "Cafe Name 2"]
- Extract the OFFICIAL business name (e.g. "Apartment Coffee" not "this new cafe")
- SKIP generic terms, restaurant chains, hawker stalls, bars, pubs, hotels
- SKIP neighborhood or street names that aren't businesses
- If no valid cafe names found, return []
- No markdown code blocks

Articles:
${batchText}`;

        try {
            const content = await callAI([{ role: 'user', content: prompt }]);
            const match = content.match(/\[[\s\S]*?\]/);
            if (match) {
                const names = JSON.parse(match[0]);
                for (const name of names) {
                    if (typeof name !== 'string' || name.length < 2 || name.length > 80) continue;
                    const key = name.toLowerCase().trim();
                    if (!allCandidates.has(key)) {
                        allCandidates.set(key, {
                            name: name.trim(),
                            sources: batch.map(a => ({ url: a.link, title: a.title }))
                        });
                    } else {
                        const existing = allCandidates.get(key);
                        existing.sources.push(...batch.map(a => ({ url: a.link, title: a.title })));
                    }
                }
            }
            console.log(`   Batch ${batchNum}/${totalBatches} OK [${activeProvider}]`);
        } catch (err) {
            console.log(`   Batch ${batchNum}/${totalBatches} FAILED: ${err.message.substring(0, 80)}`);
        }
    }

    console.log(`   Extracted ${allCandidates.size} unique cafe names (${aiCallCount} AI calls so far)\n`);
    return allCandidates;
}

// ════════════════════════════════════════════════════════════════════════════════
//  STAGE 3 — VERIFY (Google Places + fuzzy dedup + AI judge)
// ════════════════════════════════════════════════════════════════════════════════
async function lookupPlace(name) {
    const res = await fetchWithTimeout('https://google.serper.dev/places', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `${name} cafe Singapore`, gl: 'sg' })
    });
    return res.json();
}

async function aiJudge(candidateName, placeData, sourceSnippets) {
    const prompt = `You are a strict cafe reviewer for a Singapore cafe discovery app.

CANDIDATE: "${candidateName}"
GOOGLE PLACES DATA:
  Name: ${placeData.title} | Address: ${placeData.address || 'Unknown'} | Category: ${placeData.category || 'Unknown'} | Rating: ${placeData.rating || 'N/A'} (${placeData.reviews || 0} reviews)

SOURCE CONTEXT: ${sourceSnippets.substring(0, 300)}

Is this (1) a real cafe/coffee shop/brunch spot, (2) in Singapore, (3) currently open, (4) name matches candidate?

Return ONLY JSON (no markdown): {"is_cafe":true/false,"is_singapore":true/false,"is_open":true/false,"name_match":true/false,"confidence":0.0-1.0,"reason":"brief"}`;

    try {
        const content = await callAI([{ role: 'user', content: prompt }], { temperature: 0.1, maxTokens: 200 });
        const match = content.match(/\{[\s\S]*?\}/);
        if (match) return JSON.parse(match[0]);
    } catch (err) {
        console.log(`   AI judge error: ${err.message.substring(0, 60)}`);
    }
    return null;
}

async function stage3_verify(candidates, existingTitles) {
    console.log('STAGE 3: Verifying candidates...');
    const verified = [];
    const stats = { total: candidates.size, passed: 0, duplicate: 0, rejected: 0 };

    for (const [, candidate] of candidates) {
        const { name, sources } = candidate;

        // 3a. Fuzzy duplicate check (no API call needed)
        const dupMatch = isFuzzyDuplicate(name, existingTitles);
        if (dupMatch) {
            console.log(`   SKIP (dup of "${dupMatch}"): ${name}`);
            stats.duplicate++;
            continue;
        }

        // 3b. Google Places lookup (Serper, not AI)
        let placeData;
        try {
            const data = await lookupPlace(name);
            if (!data.places || data.places.length === 0) {
                console.log(`   REJECT (no Places result): ${name}`);
                stats.rejected++;
                await sleep(SERPER_DELAY_MS);
                continue;
            }
            placeData = data.places[0];
        } catch (err) {
            console.log(`   REJECT (Places failed): ${name}`);
            stats.rejected++;
            continue;
        }

        // 3c. Quick filters (no AI call needed)
        const lowerTitle = placeData.title.toLowerCase();

        if (lowerTitle.includes('permanently closed') || lowerTitle.includes('temporarily closed')) {
            console.log(`   REJECT (closed): ${placeData.title}`);
            stats.rejected++;
            await sleep(SERPER_DELAY_MS);
            continue;
        }

        const category = (placeData.category || '').toLowerCase();
        const isAllowedCategory = ALLOWED_CATEGORIES.some(c => category.includes(c));
        const hasRejectSignal = REJECT_NAME_SIGNALS.some(s => lowerTitle.includes(s));

        if (!isAllowedCategory && !lowerTitle.includes('cafe') && !lowerTitle.includes('coffee') && !lowerTitle.includes('brunch')) {
            console.log(`   REJECT (category "${placeData.category}"): ${name}`);
            stats.rejected++;
            await sleep(SERPER_DELAY_MS);
            continue;
        }

        if (hasRejectSignal) {
            console.log(`   REJECT (name signal): ${name}`);
            stats.rejected++;
            await sleep(SERPER_DELAY_MS);
            continue;
        }

        if (!placeData.address || placeData.address.length < 5) {
            console.log(`   REJECT (no address): ${name}`);
            stats.rejected++;
            await sleep(SERPER_DELAY_MS);
            continue;
        }

        // 3d. AI judge (1 AI call)
        const sourceSnippets = sources.map(s => s.title).join(' | ');
        const judgement = await aiJudge(name, placeData, sourceSnippets);

        let confidence = 0.5; // default if AI judge fails
        if (judgement) {
            if (!judgement.is_cafe || !judgement.is_singapore || !judgement.is_open || !judgement.name_match) {
                console.log(`   REJECT (AI: ${judgement.reason}): ${name}`);
                stats.rejected++;
                continue;
            }
            confidence = judgement.confidence || 0.5;
        }

        // Boost for multi-source mentions
        const uniqueSources = new Set(sources.map(s => s.url)).size;
        if (uniqueSources >= 3) confidence = Math.min(1.0, confidence + 0.1);
        if (uniqueSources >= 5) confidence = Math.min(1.0, confidence + 0.05);
        if (placeData.reviews && placeData.reviews > 100) confidence = Math.min(1.0, confidence + 0.05);

        console.log(`   PASS (${(confidence * 100).toFixed(0)}%) [${activeProvider}]: ${placeData.title}`);
        stats.passed++;

        verified.push({
            name: placeData.title,
            address: placeData.address,
            rating: placeData.rating || null,
            reviews: placeData.reviews || 0,
            price: placeData.price || '$$',
            category: placeData.category || 'Cafe',
            confidence,
            sourceUrls: [...new Set(sources.map(s => s.url))].slice(0, 3),
            sourceTitles: [...new Set(sources.map(s => s.title))].slice(0, 3)
        });

        existingTitles.add(placeData.title.toLowerCase());
        await sleep(SERPER_DELAY_MS);
    }

    console.log(`\n   Verification: ${stats.passed} passed, ${stats.duplicate} dups, ${stats.rejected} rejected (of ${stats.total}) | ${aiCallCount} AI calls so far\n`);
    return { verified, stats };
}

// ════════════════════════════════════════════════════════════════════════════════
//  STAGE 4 — ENRICH & STORE (1 combined AI call per cafe + 1 image search)
// ════════════════════════════════════════════════════════════════════════════════

/** Single AI call that returns description + vibe + tags + MRT for one cafe */
async function enrichWithAI(cafe) {
    const prompt = `You are enriching a cafe listing for a Singapore cafe discovery app.

CAFE: "${cafe.name}"
ADDRESS: ${cafe.address}
CATEGORY: ${cafe.category}
RATING: ${cafe.rating || 'N/A'}/5

Return ONLY a JSON object (no markdown, no code blocks):
{
  "description": "2-3 sentence description of this cafe. Focus on vibe and what makes it special. Be factual, no emojis.",
  "vibe": "exactly ONE word from: cozy, industrial, minimalist, artsy, rustic, zen, chic, bustling, romantic, vintage, modern, tropical",
  "tags": ["2-3 tags from: specialty coffee, brunch, bakery, roaster, aesthetic, halal-friendly, pet-friendly, workspace, desserts, matcha, pastries, sourdough"],
  "mrt": "Nearest MRT station in format: Station Name (LINE_CODE) e.g. Tiong Bahru (EW17). If unsure, use null"
}`;

    try {
        const content = await callAI([{ role: 'user', content: prompt }], { temperature: 0.4, maxTokens: 500 });
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            const validVibes = ['cozy', 'industrial', 'minimalist', 'artsy', 'rustic', 'zen', 'chic', 'bustling', 'romantic', 'vintage', 'modern', 'tropical'];
            return {
                description: parsed.description || `A cafe in Singapore at ${cafe.address}.`,
                vibe: validVibes.includes(parsed.vibe?.toLowerCase()) ? parsed.vibe.toLowerCase() : 'cozy',
                tags: Array.isArray(parsed.tags) ? parsed.tags : ['new'],
                mrt: (parsed.mrt && parsed.mrt !== 'null' && parsed.mrt.length < 60) ? parsed.mrt : null
            };
        }
    } catch (err) {
        console.log(`   Enrichment AI error: ${err.message.substring(0, 60)}`);
    }

    return {
        description: `A cafe in Singapore located at ${cafe.address}.`,
        vibe: 'cozy',
        tags: ['new'],
        mrt: null
    };
}

// Domains that serve expiring/broken/auth-gated images
const BLOCKED_IMAGE_DOMAINS = [
    'lookaside.fbsbx.com',
    'lookaside.instagram.com',
    'scontent.cdninstagram.com',
    'scontent-',               // Facebook CDN variants (scontent-sin6-1.xx.fbcdn.net)
    'fbcdn.net',
    'platform-lookaside',
    'graph.facebook.com',
    'pbs.twimg.com',           // Twitter/X (often auth-gated)
    'encrypted-tbn',           // Google thumbnail proxies (low-res)
];

function isValidImageUrl(url) {
    if (!url || !url.startsWith('https://')) return false;
    const lower = url.toLowerCase();
    if (BLOCKED_IMAGE_DOMAINS.some(d => lower.includes(d))) return false;
    if (lower.includes('placeholder') || lower.includes('no-image') || lower.includes('default-avatar')) return false;
    // Must end with a common image extension or be from a known CDN
    const hasImageExt = /\.(jpg|jpeg|png|webp|gif|avif)/i.test(lower);
    const isKnownCDN = lower.includes('wp-content') || lower.includes('cloudinary') || lower.includes('imgix') || lower.includes('supabase');
    return hasImageExt || isKnownCDN;
}

async function searchCafeImage(cafeName) {
    try {
        const res = await fetchWithTimeout('https://google.serper.dev/images', {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: `${cafeName} cafe Singapore interior`, gl: 'sg', num: 5 })
        });
        const data = await res.json();
        if (data.images) {
            for (const img of data.images) {
                if (isValidImageUrl(img.imageUrl)) return img.imageUrl;
            }
        }
    } catch {}
    return null;
}

async function stage4_enrich_and_store(verifiedCafes) {
    console.log('STAGE 4: Enriching and storing...');
    const results = { auto_approved: 0, pending_review: 0, errors: 0 };

    for (const cafe of verifiedCafes) {
        try {
            // 1 AI call for description + vibe + tags + MRT (sequential, rate-limited)
            const enrichment = await enrichWithAI(cafe);

            // 1 Serper call for image (not an AI call, no rate limit needed)
            const imageUrl = await searchCafeImage(cafe.name);
            await sleep(SERPER_DELAY_MS);

            const neighborhood = detectNeighborhood(cafe.address);
            const neighborhoodId = neighborhood ? await getOrCreateNeighborhood(neighborhood) : null;
            const finalTags = [...new Set([...(enrichment.tags), 'new', 'verified'])];

            if (cafe.confidence >= AUTO_APPROVE_THRESHOLD) {
                const { error } = await supabase.from('cafes').insert({
                    title: cafe.name,
                    neighborhood_id: neighborhoodId,
                    location: cafe.address,
                    rating: cafe.rating,
                    price: cafe.price,
                    mrt: enrichment.mrt,
                    vibe: enrichment.vibe,
                    tags: finalTags,
                    description: enrichment.description,
                    image_url: imageUrl,
                    source: 'ai',
                    is_active: true
                });
                if (error) throw error;
                console.log(`   AUTO-APPROVED (${(cafe.confidence * 100).toFixed(0)}%) [${activeProvider}]: ${cafe.name}`);
                results.auto_approved++;
            } else {
                const { error } = await supabase.from('pending_cafes').insert({
                    title: cafe.name,
                    neighborhood_id: neighborhoodId,
                    location: cafe.address,
                    rating: cafe.rating,
                    price: cafe.price,
                    mrt: enrichment.mrt,
                    vibe: enrichment.vibe,
                    tags: finalTags,
                    description: enrichment.description,
                    image_url: imageUrl,
                    ai_confidence: cafe.confidence,
                    status: 'pending'
                });
                if (error) throw error;
                console.log(`   PENDING (${(cafe.confidence * 100).toFixed(0)}%) [${activeProvider}]: ${cafe.name}`);
                results.pending_review++;
            }
        } catch (err) {
            console.log(`   ERROR: ${cafe.name} — ${err.message}`);
            results.errors++;
        }
    }

    console.log(`\n   Storage: ${results.auto_approved} auto-approved, ${results.pending_review} pending, ${results.errors} errors\n`);
    return results;
}

// ════════════════════════════════════════════════════════════════════════════════
//  DATABASE HELPERS
// ════════════════════════════════════════════════════════════════════════════════
async function getExistingCafeTitles() {
    const titles = new Set();
    const [cafesRes, pendingRes] = await Promise.all([
        supabase.from('cafes').select('title'),
        supabase.from('pending_cafes').select('title').eq('status', 'pending')
    ]);
    for (const c of (cafesRes.data || [])) titles.add(c.title.toLowerCase());
    for (const p of (pendingRes.data || [])) titles.add(p.title.toLowerCase());
    return titles;
}

async function getOrCreateNeighborhood(name) {
    const { data } = await supabase.from('neighborhoods').select('neighborhood_id').eq('name', name).single();
    if (data) return data.neighborhood_id;
    const { data: created } = await supabase.from('neighborhoods').insert({ name }).select('neighborhood_id').single();
    return created?.neighborhood_id || null;
}

async function logPipelineStart() {
    try {
        const { data } = await supabase.from('ai_pipeline_log').insert({
            pipeline_type: 'discovery',
            status: 'running',
            started_at: new Date().toISOString()
        }).select('log_id').single();
        return data?.log_id;
    } catch { return null; }
}

async function logPipelineEnd(logId, status, stats) {
    if (!logId) return;
    try {
        const detailsObj = {
            ...stats,
            ai_calls: aiCallCount,
            console_log: getConsoleLog()
        };
        await supabase.from('ai_pipeline_log').update({
            status,
            cafes_found: stats.discovered || 0,
            cafes_verified: (stats.auto_approved || 0) + (stats.pending_review || 0),
            cafes_failed: stats.rejected || 0,
            completed_at: new Date().toISOString(),
            error_message: stats.error || null,
            details: JSON.stringify(detailsObj)
        }).eq('log_id', logId);
    } catch {}
}

// ════════════════════════════════════════════════════════════════════════════════
//  CONSOLE CAPTURE — stores all output so it can be saved to the pipeline log
// ════════════════════════════════════════════════════════════════════════════════
const _consoleBuffer = [];
const _origLog = console.log.bind(console);
const _origErr = console.error.bind(console);
const _origWarn = console.warn.bind(console);

function captureConsole() {
    console.log = (...args) => {
        const line = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        _consoleBuffer.push(line);
        _origLog(...args);
    };
    console.error = (...args) => {
        const line = '[ERROR] ' + args.map(a => typeof a === 'string' ? a : (a?.stack || JSON.stringify(a))).join(' ');
        _consoleBuffer.push(line);
        _origErr(...args);
    };
    console.warn = (...args) => {
        const line = '[WARN] ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        _consoleBuffer.push(line);
        _origWarn(...args);
    };
}

function getConsoleLog() {
    // Cap at ~50KB to avoid oversized DB writes
    const full = _consoleBuffer.join('\n');
    return full.length > 50000 ? full.slice(-50000) : full;
}

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════════
async function main() {
    captureConsole();
    console.log('='.repeat(60));
    console.log('  SGMakan Cafe Curator v3');
    console.log('  4-Stage AI Pipeline (rate-limit aware)');
    console.log('='.repeat(60));
    console.log(`  Date:      ${NOW.toISOString()}`);
    console.log(`  OpenRouter: ${OPENROUTER_API_KEY ? OPENROUTER_MODEL : 'not configured'}`);
    console.log(`  Groq:      ${GROQ_API_KEY ? `${GROQ_MODEL} (30 RPM, 1K RPD)` : 'not configured'}`);
    console.log(`  Gemini:    ${GEMINI_API_KEY ? `${GEMINI_MODEL}` : 'not configured'}`);
    console.log(`  Search:    ${MONTHS_TO_SEARCH.map(m => `${m.month} ${m.year}`).join(', ')}`);
    console.log(`  Limits:    ${MAX_ARTICLES} max articles, ${AI_MIN_GAP_MS / 1000}s between AI calls`);
    console.log('='.repeat(60) + '\n');

    if (!SERPER_API_KEY) throw new Error('Missing SERPER_API_KEY');
    if (!OPENROUTER_API_KEY && !GROQ_API_KEY && !GEMINI_API_KEY) throw new Error('Need at least one AI provider: set OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY');

    const logId = await logPipelineStart();
    const pipelineStats = {};

    try {
        // STAGE 1 — Discover
        const articles = await stage1_discover();
        pipelineStats.articles_found = articles.length;

        // STAGE 2 — Extract
        const candidates = await stage2_extract(articles);
        pipelineStats.discovered = candidates.size;

        // STAGE 3 — Verify
        const existingTitles = await getExistingCafeTitles();
        console.log(`   ${existingTitles.size} existing cafes loaded for dedup\n`);
        const { verified, stats: verifyStats } = await stage3_verify(candidates, existingTitles);
        Object.assign(pipelineStats, verifyStats);

        // STAGE 4 — Enrich & Store
        const storeResults = await stage4_enrich_and_store(verified);
        Object.assign(pipelineStats, storeResults);

        // Log success
        await logPipelineEnd(logId, 'completed', pipelineStats);

        // Final summary
        console.log('='.repeat(60));
        console.log('  Pipeline Complete');
        console.log('='.repeat(60));
        console.log(`  Articles scraped:     ${pipelineStats.articles_found}`);
        console.log(`  Candidates extracted: ${pipelineStats.discovered}`);
        console.log(`  Duplicates skipped:   ${pipelineStats.duplicate || 0}`);
        console.log(`  Rejected:             ${pipelineStats.rejected || 0}`);
        console.log(`  Auto-approved:        ${pipelineStats.auto_approved || 0}`);
        console.log(`  Pending review:       ${pipelineStats.pending_review || 0}`);
        console.log(`  Errors:               ${pipelineStats.errors || 0}`);
        console.log(`  Total AI calls:       ${aiCallCount}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\nPipeline failed:', error.message);
        await logPipelineEnd(logId, 'failed', { ...pipelineStats, error: error.message });
        throw error;
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
