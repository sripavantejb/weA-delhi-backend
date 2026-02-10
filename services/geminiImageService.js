const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

const IMAGE_MODEL = 'gemini-2.5-flash-image';

let client = null;

function getClient() {
  if (!client) {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      const err = new Error('GEMINI_API_KEY is not configured');
      err.code = 'CONFIG_ERROR';
      throw err;
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Generate an image from a text prompt using Gemini (free tier).
 * Returns base64 image data only (Gemini does not return URLs).
 * @param {Object} options
 * @param {string} options.prompt - Text description of the desired image
 * @returns {Promise<{ b64_json: string }>}
 */
async function generateImage({ prompt }) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    const err = new Error(response.promptFeedback?.blockReasonMessage || 'No image generated');
    err.code = 'NO_IMAGE';
    throw err;
  }

  const parts = candidates[0].content?.parts;
  if (!parts || !parts.length) {
    const err = new Error('No image data in Gemini response');
    err.code = 'NO_IMAGE';
    throw err;
  }

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return { b64_json: part.inlineData.data };
    }
  }

  const err = new Error('No image data in Gemini response');
  err.code = 'NO_IMAGE';
  throw err;
}

module.exports = {
  generateImage,
};
