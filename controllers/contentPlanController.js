const OpenAI = require('openai');
const { Post } = require('../models');
const { success, error } = require('../views/response');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function parseIdeasFromResponse(text) {
  const trimmed = text.trim();
  let jsonStr = trimmed;
  const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) jsonStr = match[0];
  const parsed = JSON.parse(jsonStr);
  const arr = Array.isArray(parsed) ? parsed : parsed.ideas || parsed.items || [];
  return arr.map((item) => ({
    date: item.date || item.day,
    type: ['Video', 'Image', 'Text'].includes(item.type) ? item.type : 'Text',
    caption: item.caption || item.text || item.content || '',
    platforms: Array.isArray(item.platforms) ? item.platforms : ['Instagram', 'LinkedIn'],
  }));
}

async function generate(req, res) {
  try {
    if (!openai) {
      return error(res, 'AI service not configured. Set OPENAI_API_KEY.', 503);
    }
    const { goal, duration = 30, platforms = [], niche, startDate } = req.body;
    const start = startDate ? new Date(startDate) : new Date();
    const dates = [];
    for (let i = 0; i < Math.min(Number(duration) || 30, 30); i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const platformList = Array.isArray(platforms) && platforms.length ? platforms.join(', ') : 'Instagram, LinkedIn, Twitter';
    const systemPrompt = `You are a content strategist. Generate a ${dates.length}-day social media content plan. Return ONLY a valid JSON array of objects. Each object must have: "date" (YYYY-MM-DD string), "type" (one of "Video", "Image", "Text"), "caption" (short engaging social caption, 1-2 sentences), "platforms" (array of strings, e.g. ["Instagram", "LinkedIn"]). No other text.`;
    const userPrompt = `Goal: ${goal || 'Branding'}. Niche: ${niche || 'General'}. Platforms: ${platformList}. Start date: ${dates[0]}. Generate exactly ${dates.length} content ideas, one per day. Use these dates in order: ${dates.join(', ')}. Return the JSON array only.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });
    const content = completion.choices?.[0]?.message?.content;
    if (!content) return error(res, 'No response from AI', 503);
    const ideas = parseIdeasFromResponse(content);
    const withDates = ideas.map((idea, i) => ({
      ...idea,
      date: idea.date || dates[i] || dates[0],
      type: idea.type || 'Text',
      caption: idea.caption || `Content for day ${i + 1}`,
      platforms: idea.platforms && idea.platforms.length ? idea.platforms : [platformList.split(',')[0].trim()],
    }));
    return success(res, { ideas: withDates });
  } catch (err) {
    console.error('Content plan generate error:', err);
    return error(res, err.message || 'Failed to generate content plan', 500);
  }
}

async function insert(req, res) {
  try {
    const { ideas } = req.body;
    if (!Array.isArray(ideas) || ideas.length === 0) {
      return error(res, 'ideas array is required', 400);
    }
    const userId = req.user._id;
    const docs = ideas.map((idea) => ({
      user: userId,
      type: ['Video', 'Image', 'Text'].includes(idea.type) ? idea.type : 'Text',
      caption: String(idea.caption || ''),
      date: String(idea.date || new Date().toISOString().slice(0, 10)),
      time: '09:00',
      platforms: Array.isArray(idea.platforms) ? idea.platforms : ['Instagram'],
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
    }));
    const created = await Post.insertMany(docs);
    return success(res, { inserted: created.length });
  } catch (err) {
    console.error('Content plan insert error:', err);
    return error(res, err.message || 'Failed to insert into calendar', 400);
  }
}

async function polishCaption(req, res) {
  try {
    let description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!description || description.length < 5) {
      return error(res, 'Description must be at least 5 characters', 400);
    }
    description = description.slice(0, 200);
    if (!openai) {
      return error(res, 'AI service not configured. Set OPENAI_API_KEY.', 503);
    }
    const systemPrompt = 'You are a social media copywriter. The user will give a short description of a post in about 20 words. Return only one polished, engaging social media caption (1-3 sentences) suitable for Instagram, LinkedIn, or Twitter. No other text, no quotes, no explanation.';
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
      temperature: 0.7,
    });
    const content = completion.choices?.[0]?.message?.content;
    if (!content) return error(res, 'No response from AI', 503);
    const caption = content.trim();
    return success(res, { caption });
  } catch (err) {
    console.error('Polish caption error:', err);
    return error(res, err.message || 'Failed to polish caption', 500);
  }
}

module.exports = { generate, insert, polishCaption };
