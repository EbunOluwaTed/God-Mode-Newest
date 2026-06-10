export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not set in Vercel environment variables.',
      fix: 'Go to Vercel Dashboard → Your Project → Settings → Environment Variables → Add GEMINI_API_KEY'
    });
  }

  const { text, today } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  const todayStr = today || new Date().toISOString().split('T')[0];

  const prompt = `You are a task extraction assistant. Today's date is ${todayStr}.

The user has written the following brain dump. Extract ALL actionable tasks from it. For each task, return a JSON array.

Rules:
- "title": short action-oriented title (max 8 words)
- "sub": optional subtitle or note (1 sentence max, can be empty string)
- "area": one of Work, Academics, Personal, Health, Finance, Creative, Ministry, Projects (pick the most relevant)
- "status": "fire" (urgent/due today or tomorrow), "prog" (in progress/ongoing), or "wait" (waiting/later)
- "due": date in YYYY-MM-DD format. Infer from context (e.g. "tomorrow" = next day, "Friday" = nearest Friday). If unknown, use null.

User text:
"""
${text}
"""

Respond ONLY with a valid JSON array. No explanation, no markdown, no extra text. Example:
[{"title":"Call lecturer","sub":"Check assignment deadline","area":"Academics","status":"fire","due":"${todayStr}"}]`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      return res.status(geminiRes.status).json({
        error: `Gemini API error: HTTP ${geminiRes.status}`,
        detail: errBody,
        fix: geminiRes.status === 400
          ? 'Bad request to Gemini. Check your API key format.'
          : geminiRes.status === 403
          ? 'API key is invalid or lacks permissions. Check it in Google AI Studio.'
          : geminiRes.status === 429
          ? 'Quota exceeded. Check your Gemini plan in Google AI Studio (aistudio.google.com).'
          : 'Check Google AI Studio for quota and key issues.'
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let tasks;
    try {
      tasks = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(500).json({
        error: 'Gemini returned non-JSON output.',
        raw: rawText,
        detail: parseErr.message
      });
    }

    if (!Array.isArray(tasks)) {
      return res.status(500).json({ error: 'Gemini output was not a JSON array.', raw: rawText });
    }

    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({
      error: 'Network error calling Gemini API.',
      detail: err.message
    });
  }
}
