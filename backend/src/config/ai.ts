import dotenv from 'dotenv';

dotenv.config({ override: true });

const apiKey = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
const baseUrl = (process.env.AI_BASE_URL || '').trim();
let modelName = (process.env.AI_MODEL || '').trim();

// Detect provider from env configuration
// If AI_BASE_URL is set (e.g. NVIDIA or generic OpenAI-compatible endpoint) → use OpenAI-compatible client
// Otherwise fall back to native Gemini REST
const isOpenAICompatible = Boolean(baseUrl && baseUrl !== 'https://generativelanguage.googleapis.com');

// If user configured nvidia/llama-3.2-* for NVIDIA NIM, normalize to meta/llama-3.2-* (NVIDIA NIM's actual catalog ID)
if (isOpenAICompatible) {
  if (modelName.startsWith('nvidia/llama-3.2-')) {
    modelName = modelName.replace(/^nvidia\/llama-3\.2-/, 'meta/llama-3.2-');
  }
  // The 90B model on NVIDIA NIM free tier frequently queues and exceeds 30s timeout.
  // Map to the high-speed 11B vision model which completes within ~2-3 seconds.
  if (modelName === 'meta/llama-3.2-90b-vision-instruct' || modelName.includes('90b')) {
    modelName = 'meta/llama-3.2-11b-vision-instruct';
  }
  // Nemotron models are text-only reasoning models and do not support multimodal image input.
  // Automatically map to the high-speed vision model for media intelligence.
  if (modelName.includes('nemotron')) {
    console.warn(`[AI Config] Notice: "${modelName}" is a text-only reasoning model. For media/image vision analysis, falling back to "meta/llama-3.2-11b-vision-instruct".`);
    modelName = 'meta/llama-3.2-11b-vision-instruct';
  }
}

// Pick sensible defaults per provider
const defaultModel = isOpenAICompatible
  ? 'meta/llama-3.2-11b-vision-instruct' // NVIDIA vision model (fast & reliable)
  : 'gemini-2.5-flash';                   // Gemini default

export const aiConfig = {
  apiKey,
  geminiApiKey: apiKey,  // legacy alias kept for comparison.service compat
  modelName: modelName || defaultModel,
  temperature: 0.2,
  isOpenAICompatible,
  baseUrl: isOpenAICompatible ? baseUrl : '',
};
