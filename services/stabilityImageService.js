const config = require('../config');

const STABILITY_API_BASE = 'https://api.stability.ai';
const ENGINE_ID = 'stable-diffusion-xl-1024-v1-0';

/**
 * Generate an image from a text prompt using Stability AI (Stable Diffusion XL).
 * Returns base64 image data. Free trial credits available at platform.stability.ai
 * @param {Object} options
 * @param {string} options.prompt - Text description of the desired image
 * @returns {Promise<{ b64_json: string }>}
 */
async function generateImage({ prompt }) {
  const apiKey = config.stabilityApiKey;
  if (!apiKey) {
    const err = new Error('STABILITY_API_KEY is not configured');
    err.code = 'CONFIG_ERROR';
    throw err;
  }

  const url = `${STABILITY_API_BASE}/v1/generation/${ENGINE_ID}/text-to-image`;
  const body = {
    text_prompts: [{ text: prompt, weight: 1 }],
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    samples: 1,
    steps: 30,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data.message || (typeof data.error === 'string' ? data.error : data.error?.message) || `Stability API error: ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    err.code = response.status === 429 ? 'RATE_LIMIT' : 'API_ERROR';
    throw err;
  }

  const artifacts = data.artifacts;
  if (!artifacts || artifacts.length === 0) {
    const err = new Error('No image in Stability response');
    err.code = 'NO_IMAGE';
    throw err;
  }

  const first = artifacts[0];
  if (!first.base64) {
    const err = new Error(first.finishReason === 'CONTENT_FILTERED' ? 'Prompt was filtered' : 'No image data');
    err.code = 'NO_IMAGE';
    throw err;
  }

  return { b64_json: first.base64 };
}

module.exports = {
  generateImage,
};
