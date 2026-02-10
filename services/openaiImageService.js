const OpenAI = require('openai').default;
const config = require('../config');

const VALID_SIZES = ['1024x1024', '1024x1792', '1792x1024'];
const VALID_QUALITY = ['standard', 'hd'];
const VALID_STYLE = ['vivid', 'natural'];
const VALID_RESPONSE_FORMAT = ['url', 'b64_json'];

let client = null;

function getClient() {
  if (!client) {
    const apiKey = config.openaiApiKey;
    if (!apiKey) {
      const err = new Error('OPENAI_API_KEY is not configured');
      err.code = 'CONFIG_ERROR';
      throw err;
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * Generate an image from a text prompt using DALL-E 3.
 * @param {Object} options
 * @param {string} options.prompt - Text description of the desired image
 * @param {string} [options.size='1024x1024'] - One of 1024x1024, 1024x1792, 1792x1024
 * @param {string} [options.quality='standard'] - 'standard' or 'hd'
 * @param {string} [options.style='vivid'] - 'vivid' or 'natural'
 * @param {string} [options.responseFormat='url'] - 'url' or 'b64_json'
 * @returns {Promise<{ url?: string, b64_json?: string, revised_prompt?: string }>}
 */
async function generateImage({ prompt, size = '1024x1024', quality = 'standard', style = 'vivid', responseFormat = 'url' }) {
  const safeSize = VALID_SIZES.includes(size) ? size : '1024x1024';
  const safeQuality = VALID_QUALITY.includes(quality) ? quality : 'standard';
  const safeStyle = VALID_STYLE.includes(style) ? style : 'vivid';
  const safeResponseFormat = VALID_RESPONSE_FORMAT.includes(responseFormat) ? responseFormat : 'url';

  const openai = getClient();
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: safeSize,
    quality: safeQuality,
    style: safeStyle,
    response_format: safeResponseFormat,
  });

  const image = response.data && response.data[0];
  if (!image) {
    const err = new Error('No image data in OpenAI response');
    err.code = 'NO_IMAGE';
    throw err;
  }

  return {
    url: image.url,
    b64_json: image.b64_json,
    revised_prompt: image.revised_prompt,
  };
}

module.exports = {
  generateImage,
};
