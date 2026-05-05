const OpenAI = require('openai');
const pool = require('../config/db');

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ur: 'Urdu',
};

function getAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.REQUESTY_API_KEY;
  if (!apiKey) {
    return null;
  }

  const looksLikeOpenAiKey = apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-');
  const useRequesty = process.env.USE_REQUESTY === 'true' || (!looksLikeOpenAiKey && process.env.REQUESTY_BASE_URL);
  const baseURL = useRequesty ? (process.env.REQUESTY_BASE_URL || 'https://router.requesty.ai/v1') : undefined;

  return {
    apiKey,
    baseURL,
    chatModel: useRequesty
      ? (process.env.REQUESTY_CHAT_MODEL || 'openai/gpt-4o-mini')
      : (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'),
    ttsModel: useRequesty
      ? (process.env.REQUESTY_TTS_MODEL || 'openai/gpt-4o-mini-tts')
      : (process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts'),
  };
}

function createAiClient() {
  const config = getAiConfig();
  if (!config) {
    return null;
  }

  const options = {
    apiKey: config.apiKey,
    defaultHeaders: {
      'HTTP-Referer': process.env.YOUR_SITE_URL || 'http://localhost:5000',
      'X-Title': process.env.YOUR_SITE_NAME || 'Urban Water Supply Conflict Resolver',
    },
  };

  if (config.baseURL) {
    options.baseURL = config.baseURL;
  }

  return { client: new OpenAI(options), config };
}

async function getWaterSystemContext() {
  const [
    users,
    areaStats,
    areas,
    demandStats,
    pendingDemand,
    supplyToday,
    recentSupply,
    allocationToday,
    recentAllocations,
    openIssues,
    recentIssues,
  ] = await Promise.all([
    pool.query(`
      SELECT role, COUNT(*) AS count
      FROM users
      WHERE is_active = TRUE
      GROUP BY role
      ORDER BY role
    `),
    pool.query(`
      SELECT area_type, COUNT(*) AS count
      FROM areas
      WHERE is_active = TRUE
      GROUP BY area_type
      ORDER BY area_type
    `),
    pool.query(`
      SELECT id, name, area_type, latitude, longitude
      FROM areas
      WHERE is_active = TRUE
      ORDER BY name
      LIMIT 25
    `),
    pool.query(`
      SELECT
        COUNT(*) AS total_requests,
        COALESCE(SUM(quantity), 0) AS total_demand,
        COALESCE(ROUND(AVG(priority), 2), 0) AS avg_priority,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) AS fulfilled,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) AS partial
      FROM demand
      WHERE DATE(timestamp) = CURRENT_DATE
    `),
    pool.query(`
      SELECT d.quantity, d.priority, d.status, d.timestamp, a.name AS area_name, a.area_type
      FROM demand d
      JOIN areas a ON d.area_id = a.id
      WHERE d.status = 'pending'
      ORDER BY d.priority DESC, d.timestamp DESC
      LIMIT 15
    `),
    pool.query(`
      SELECT
        COALESCE(SUM(total_water), 0) AS total_supply,
        COALESCE(SUM(available), 0) AS available_supply,
        COUNT(*) AS supply_records
      FROM supply
      WHERE date = CURRENT_DATE
    `),
    pool.query(`
      SELECT total_water, available, date, time_slot, source
      FROM supply
      ORDER BY date DESC, created_at DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT
        COALESCE(SUM(allocated_water), 0) AS total_allocated,
        COALESCE(SUM(demanded_water), 0) AS total_demanded,
        COALESCE(SUM(shortage), 0) AS total_shortage,
        COUNT(CASE WHEN status = 'shortage' THEN 1 END) AS shortage_areas,
        COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) AS fulfilled_areas
      FROM allocation
      WHERE DATE(timestamp) = CURRENT_DATE
    `),
    pool.query(`
      SELECT al.allocated_water, al.demanded_water, al.shortage, al.status, al.reason,
             al.timestamp, a.name AS area_name, a.area_type
      FROM allocation al
      JOIN areas a ON al.area_id = a.id
      ORDER BY al.timestamp DESC
      LIMIT 15
    `),
    pool.query(`
      SELECT status, severity, COUNT(*) AS count
      FROM issue_reports
      WHERE status IN ('open', 'in_progress')
      GROUP BY status, severity
      ORDER BY status, severity
    `),
    pool.query(`
      SELECT ir.issue_type, ir.severity, ir.status, ir.created_at, a.name AS area_name
      FROM issue_reports ir
      JOIN areas a ON ir.area_id = a.id
      ORDER BY ir.created_at DESC
      LIMIT 10
    `),
  ]);

  return `
You are a smart multilingual assistant for an Urban Water Supply Conflict Resolver dashboard.
You help admins, area managers, and users understand demand, supply, allocations, shortages, issues, and map-area status.
Use only the live database context below. If information is unavailable, say that the current system data does not contain it.
Be concise, practical, and transparent. Mention exact numbers when they are available.

CURRENT WATER SYSTEM DATA

Users by role:
${users.rows.map((r) => `- ${r.role}: ${r.count}`).join('\n') || '- No users found'}

Active areas by type:
${areaStats.rows.map((r) => `- ${r.area_type}: ${r.count}`).join('\n') || '- No active areas found'}

Map areas:
${areas.rows.map((a) => `- ${a.name} (${a.area_type}) at ${a.latitude}, ${a.longitude}`).join('\n') || '- No map areas found'}

Today demand summary:
- Requests: ${demandStats.rows[0].total_requests}
- Total demand: ${demandStats.rows[0].total_demand} KL
- Average priority: ${demandStats.rows[0].avg_priority}
- Pending: ${demandStats.rows[0].pending}
- Fulfilled: ${demandStats.rows[0].fulfilled}
- Partial: ${demandStats.rows[0].partial}

Pending demands:
${pendingDemand.rows.map((d) => `- ${d.area_name} (${d.area_type}): ${d.quantity} KL, priority ${d.priority}, status ${d.status}`).join('\n') || '- No pending demands'}

Today supply:
- Total supply: ${supplyToday.rows[0].total_supply} KL
- Available supply: ${supplyToday.rows[0].available_supply} KL
- Supply records: ${supplyToday.rows[0].supply_records}

Recent supply records:
${recentSupply.rows.map((s) => `- ${s.date} ${s.time_slot}: ${s.total_water} KL total, ${s.available} KL available, source ${s.source || 'not specified'}`).join('\n') || '- No supply records'}

Today allocation summary:
- Total allocated: ${allocationToday.rows[0].total_allocated} KL
- Total demanded in allocations: ${allocationToday.rows[0].total_demanded} KL
- Total shortage: ${allocationToday.rows[0].total_shortage} KL
- Shortage areas: ${allocationToday.rows[0].shortage_areas}
- Fulfilled areas: ${allocationToday.rows[0].fulfilled_areas}

Recent allocations:
${recentAllocations.rows.map((a) => `- ${a.area_name} (${a.area_type}): allocated ${a.allocated_water} KL of ${a.demanded_water || 'unknown'} KL, shortage ${a.shortage} KL, status ${a.status}. Reason: ${a.reason}`).join('\n') || '- No allocations yet'}

Open and in-progress issues:
${openIssues.rows.map((i) => `- ${i.status}, ${i.severity}: ${i.count}`).join('\n') || '- No open issues'}

Recent issue reports:
${recentIssues.rows.map((i) => `- ${i.area_name}: ${i.issue_type}, ${i.severity}, ${i.status}`).join('\n') || '- No issue reports'}
`;
}

async function synthesizeSpeech(client, config, text, voice) {
  const speech = await client.audio.speech.create({
    model: config.ttsModel,
    voice: voice || process.env.REQUESTY_TTS_VOICE || 'alloy',
    input: text,
    response_format: 'mp3',
  });

  const audioBuffer = Buffer.from(await speech.arrayBuffer());

  return {
    audio_base64: audioBuffer.toString('base64'),
    audio_mime_type: 'audio/mpeg',
  };
}

const chat = async (req, res, next) => {
  try {
    const { message, language = 'en', speak = false, voice } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const ai = createAiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        message: 'AI API key is missing in .env. Add OPENAI_API_KEY or REQUESTY_API_KEY.',
      });
    }

    const { client, config } = ai;
    const languageName = LANGUAGE_NAMES[language] || language || 'the user requested language';
    const systemContext = await getWaterSystemContext();

    const response = await client.chat.completions.create({
      model: config.chatModel,
      messages: [
        {
          role: 'system',
          content: `${systemContext}\nReply in ${languageName}. If the user mixes languages, match their language naturally.`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('No response from chatbot model');
    }

    const data = {
      reply,
      language,
      source: 'live_water_supply_database',
    };

    if (speak) {
      Object.assign(data, await synthesizeSpeech(client, config, reply, voice));
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { chat };
