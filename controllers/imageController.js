const { success, error } = require('../views/response');
const openaiImageService = require('../services/openaiImageService');
const geminiImageService = require('../services/geminiImageService');
const stabilityImageService = require('../services/stabilityImageService');
const config = require('../config');

const MAX_PROMPT_LENGTH = 4000;
const VALID_PROVIDERS = ['openai', 'gemini', 'stability'];

function resolveProvider(provider) {
  if (provider && VALID_PROVIDERS.includes(provider)) return provider;
  if (config.stabilityApiKey) return 'stability';
  if (config.geminiApiKey) return 'gemini';
  if (config.openaiApiKey) return 'openai';
  return null;
}

/**
 * POST /api/images/generate
 * Body: { prompt, provider?: 'openai'|'gemini'|'stability', size?, quality?, style?, response_format? }
 * provider: optional; defaults to stability if STABILITY_API_KEY set, else gemini, else openai.
 */
async function generate(req, res) {
  try {
    const prompt = req.body.prompt;
    if (prompt == null || typeof prompt !== 'string') {
      return error(res, 'Prompt is required', 400);
    }
    const trimmed = prompt.trim();
    if (!trimmed) {
      return error(res, 'Prompt cannot be empty', 400);
    }
    if (trimmed.length > MAX_PROMPT_LENGTH) {
      return error(res, `Prompt must be at most ${MAX_PROMPT_LENGTH} characters`, 400);
    }

    const provider = resolveProvider(req.body.provider);
    if (!provider) {
      return error(res, 'No image provider configured. Set STABILITY_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in .env', 503);
    }

    let result;

    if (provider === 'gemini') {
      result = await geminiImageService.generateImage({ prompt: trimmed });
    } else if (provider === 'stability') {
      result = await stabilityImageService.generateImage({ prompt: trimmed });
    } else {
      const size = req.body.size;
      const quality = req.body.quality;
      const style = req.body.style;
      const responseFormat = req.body.response_format;
      result = await openaiImageService.generateImage({
        prompt: trimmed,
        size,
        quality,
        style,
        responseFormat,
      });
    }

    const image = result.url ?? result.b64_json ?? null;
    if (!image) {
      return error(res, 'Image generation did not return data', 502);
    }

    return success(res, {
      image,
      revisedPrompt: result.revised_prompt ?? undefined,
      provider,
    });
  } catch (err) {
    if (err.code === 'CONFIG_ERROR') {
      return error(res, 'Image generation is not configured', 503);
    }
    if (err.code === 'NO_IMAGE') {
      return error(res, err.message || 'Image generation did not return data', 502);
    }
    let message = err.message || 'Image generation failed';
    if (err.status === 429) {
      message = 'Rate limit or quota exceeded. Wait a minute and retry. See platform.stability.ai or ai.google.dev for limits.';
      return error(res, message, 429);
    }
    if (err.status && err.status >= 400 && err.status < 500) {
      return error(res, message, err.status);
    }
    if (err.status) {
      return error(res, message, 502);
    }
    return error(res, message, 500);
  }
}

module.exports = {
  generate,
};
