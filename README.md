# weA-delhi-backend

Express backend for weA Delhi. Includes a prompt-to-image API using Stability AI, Google Gemini, or OpenAI DALL-E.

---

## Setup

```bash
npm install
cp .env.example .env
```

Add at least one image-provider key to `.env`:

- `STABILITY_API_KEY` — [platform.stability.ai](https://platform.stability.ai/account/keys) (free tier available)
- `GEMINI_API_KEY` — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com/api-keys)

```bash
npm run dev
```

Server runs at `http://localhost:3000` (or `PORT` in `.env`).

---

## Image generation API

### Endpoint the backend exposes

| Method | URL | Description |
|--------|-----|-------------|
| **POST** | **`/api/images/generate`** | Generate an image from a text prompt |

**Base URL:** `http://localhost:3000` (or your deployed host).

**Full URL:** `http://localhost:3000/api/images/generate`

---

### What the backend expects (request)

**Headers:**

- `Content-Type: application/json`

**Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | **Yes** | Text description of the image (max 4000 characters). |
| `provider` | string | No | `"stability"` \| `"gemini"` \| `"openai"`. If omitted, backend picks one based on which API keys are set (prefers Stability → Gemini → OpenAI). |
| `size` | string | No | **OpenAI only.** `"1024x1024"` \| `"1024x1792"` \| `"1792x1024"`. |
| `quality` | string | No | **OpenAI only.** `"standard"` \| `"hd"`. |
| `style` | string | No | **OpenAI only.** `"vivid"` \| `"natural"`. |
| `response_format` | string | No | **OpenAI only.** `"url"` \| `"b64_json"`. |

**Example request body:**

```json
{
  "prompt": "a red apple on a wooden table"
}
```

---

### What the backend sends (response)

All responses are JSON.

**Success (HTTP 200):**

```json
{
  "success": true,
  "data": {
    "image": "<url string OR base64 string>",
    "revisedPrompt": "<string or undefined, OpenAI DALL-E 3 only>",
    "provider": "stability"
  },
  "timestamp": "2026-02-10T18:43:49.389Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data.image` | string | **Either** a temporary image URL (OpenAI) **or** a base64-encoded image string (Stability, Gemini, or OpenAI with `response_format: "b64_json"`). |
| `data.revisedPrompt` | string \| undefined | Present only for OpenAI DALL-E 3; may be omitted. |
| `data.provider` | string | Which provider was used: `"stability"` \| `"gemini"` \| `"openai"`. |

**Error (4xx/5xx):**

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2026-02-10T18:43:49.389Z"
}
```

Common status codes: `400` (bad request), `429` (rate limit), `502` (upstream error), `503` (no provider configured).

---

### What you're seeing in a success response

A typical success response looks like:

- **`success`**: `true`
- **`data.provider`**: e.g. `"stability"` (which service generated the image)
- **`data.image`**: A very long string (e.g. `"NBBV5xPSMUAEMCEh..."`) — this is the image as **base64**
- **`timestamp`**: ISO 8601 time, e.g. `"2026-02-10T18:43:49.389Z"`

The response body can be large because the image is embedded as base64.

---

### Why the response is so long

Base64 encoding makes the image about **33% larger** than the raw bytes. A 1024×1024 PNG becomes a long string in the JSON. **This is normal.** Stability and Gemini return base64 by default; OpenAI can return either a temporary URL or base64 depending on `response_format`.

---

### How to use the image

**In HTML (browser):**

Use a data URL so the browser can display the base64 image:

```html
<img src="data:image/png;base64,<paste the base64 string here>" />
```

In code, use the value from the API: `data:image/png;base64,${data.image}`.

**Save to file (Node.js):**

Decode base64 and write to a PNG file:

```javascript
const fs = require('fs');
const base64String = json.data.image; // from API response
const buffer = Buffer.from(base64String, 'base64');
fs.writeFileSync('generated.png', buffer);
```

**In an app (frontend or backend):**

Use the `data.image` value from the JSON: set it as the `src` for an `<img>` (with the `data:image/png;base64,` prefix when it’s base64), or send it to the front end and do the same there.

---

### How the frontend should accept and use the response

1. **Call the API**
   - `POST` to `{BASE_URL}/api/images/generate`
   - Body: `JSON.stringify({ prompt: "your prompt" })`
   - Headers: `{ "Content-Type": "application/json" }`

2. **Parse the JSON**
   - Read the response body as JSON (e.g. `response.json()`).

3. **Check `success`**
   - If `success === false`: show `error` to the user and handle status code (e.g. 429 = “try again later”).
   - If `success === true`: use `data.image` and optionally `data.provider` / `data.revisedPrompt`.

4. **Display the image**
   - If `data.image` is a **URL** (starts with `http`): use it directly as the image source.
     - Example: `<img src={data.image} alt="Generated" />`
   - If `data.image` is **base64** (long string, no `http`): use a data URL.
     - Example: `<img src={`data:image/png;base64,${data.image}`} alt="Generated" />`
   - You can detect format by: `data.image.startsWith('http')` → URL; otherwise treat as base64.

5. **Optional**
   - Use `data.provider` for labels or analytics.
   - Use `data.revisedPrompt` (when present) for accessibility or tooltips.

**Minimal frontend example (fetch):**

```javascript
const response = await fetch('http://localhost:3000/api/images/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a red apple on a wooden table' }),
});
const json = await response.json();

if (!json.success) {
  console.error(json.error);
  return;
}

const imageSrc = json.data.image.startsWith('http')
  ? json.data.image
  : `data:image/png;base64,${json.data.image}`;
// Use imageSrc in <img src={imageSrc} /> or similar
```

---

## Summary for this branch

- **Backend sends:** `POST /api/images/generate` with JSON `{ prompt }` (and optional `provider`, etc.).
- **Backend returns:** JSON with `success`, `data.image` (URL or base64), `data.provider`, and optionally `data.revisedPrompt`; or `success: false` and `error`.
- **Frontend accepts:** Parse JSON → if `success` use `data.image` as URL or `data:image/png;base64,${data.image}` for display.
