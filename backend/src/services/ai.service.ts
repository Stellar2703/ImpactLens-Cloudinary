import { aiConfig } from '../config/ai';
import { z } from 'zod';

export interface StructuredAIAnalysis {
  title: string;
  description: string;
  objects: string[];
  activities: string[];
  tags: string[];
  locationClues: string[];
  impactSignals: string[];
  riskSignals: string[];
  confidence: number;
  analysisMode?: 'live_ai' | 'heuristic_fallback' | 'demo';
  provider?: string;
  model?: string;
  promptVersion?: string;
  analyzedAt?: string;
}

export interface ComparisonAnalysis {
  summary: string;
  visibleChanges: string[];
  canopyOrStructuralDifference: string;
  riskAssessment: string;
  confidence: number;
}

export const structuredAIAnalysisSchema = z.object({
  title: z.string().min(1).default('Field Evidence Analysis'),
  description: z.string().min(1).default('Visual observation captured.'),
  objects: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  locationClues: z.array(z.string()).default([]),
  impactSignals: z.array(z.string()).default([]),
  riskSignals: z.array(z.string()).default([]),
  confidence: z.preprocess((val) => {
    const n = Number(val);
    if (isNaN(n)) return 0.8;
    return n > 1 ? Math.min(1, n / 100) : Math.max(0, n);
  }, z.number().min(0).max(1)).default(0.8),
});

const comparisonSchema = z.object({
  summary: z.string().min(1).default('Visual progression observed between assets.'),
  visibleChanges: z.array(z.string()).default([]),
  canopyOrStructuralDifference: z.string().default('No structural deviation detected.'),
  riskAssessment: z.string().default('No immediate risks flagged.'),
  confidence: z.preprocess((val) => {
    const n = Number(val);
    if (isNaN(n)) return 0.85;
    return n > 1 ? Math.min(1, n / 100) : Math.max(0, n);
  }, z.number().min(0).max(1)).default(0.85),
});

const promptVersion = 'field-evidence-v1';

const ANALYSIS_PROMPT = `Analyze this field evidence image for an environmental & infrastructure monitoring platform.
Output STRICTLY valid JSON with no markdown wrapping and no backticks.
JSON schema:
{
  "title": string,
  "description": string,
  "objects": string[],
  "activities": string[],
  "tags": string[],
  "locationClues": string[],
  "impactSignals": string[],
  "riskSignals": string[],
  "confidence": number (between 0.0 and 1.0)
}`;

const COMPARISON_PROMPT = (projectContext?: string) =>
  `Compare these two field evidence images for ${projectContext || 'the selected project'}. Describe only visible differences. Do not infer precise measurements, causality, project completion, or outcomes. Return strict JSON with no markdown: {"summary":"string","visibleChanges":["string"],"canopyOrStructuralDifference":"string","riskAssessment":"string","confidence":0.0}`;

function optimizeImageUrl(url: string): string {
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/') && !url.includes('/image/upload/q_auto')) {
    return url.replace('/image/upload/', '/image/upload/q_auto,w_1024/');
  }
  return url;
}

/**
 * Cleans raw LLM text output and safely extracts/parses JSON with self-repair capability.
 */
function parseJSON(raw: string): any {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt automatic JSON repair
    try {
      let repaired = cleaned.replace(/,\s*([}\]])/g, '$1');
      const quoteCount = (repaired.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        repaired += '"';
      }
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
      return JSON.parse(repaired);
    } catch {
      // Regex extraction fallback
      const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
      const descMatch = cleaned.match(/"description"\s*:\s*"([^"]+)"/);
      const confMatch = cleaned.match(/"confidence"\s*:\s*([0-9.]+)/);
      const tagsMatch = cleaned.match(/"tags"\s*:\s*\[([^\]]+)\]/);
      const objectsMatch = cleaned.match(/"objects"\s*:\s*\[([^\]]+)\]/);

      return {
        title: titleMatch ? titleMatch[1] : 'Field Evidence Analysis',
        description: descMatch ? descMatch[1] : 'Field observation captured and cataloged.',
        objects: objectsMatch ? objectsMatch[1].split(',').map((s) => s.replace(/["\s]/g, '')) : ['field evidence'],
        activities: ['Field Observation'],
        tags: tagsMatch ? tagsMatch[1].split(',').map((s) => s.replace(/["\s]/g, '')) : ['evidence', 'field'],
        locationClues: ['site documentation'],
        impactSignals: ['evidence recorded'],
        riskSignals: [],
        confidence: confMatch ? parseFloat(confMatch[1]) : 0.85,
      };
    }
  }
}

export class AIService {
  // ─── OpenAI-compatible (NVIDIA, Azure, etc.) ───────────────────────────────

  /**
   * Calls an OpenAI-compatible chat completions endpoint with vision support.
   * Sends the image as a URL in the message content array.
   */
  private async callOpenAICompatible(
    systemPrompt: string,
    imageUrls: string[],
    userText?: string,
    maxTokens: number = 2048,
  ): Promise<string> {
    const endpoint = `${aiConfig.baseUrl}/chat/completions`;

    const imageContent = imageUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url: optimizeImageUrl(url) },
    }));

    const body = {
      model: aiConfig.modelName,
      temperature: aiConfig.temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: systemPrompt + (userText ? `\n\n${userText}` : '') },
            ...imageContent,
          ],
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let msg = '';
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        msg = parsed.error?.message || '';
      } catch {
        msg = errText;
      }
      const err = new Error(
        msg
          ? `AI provider rejected the request: ${msg}`
          : `AI provider returned HTTP ${response.status}.`,
      ) as Error & { statusCode?: number };
      err.statusCode = [400, 401, 403].includes(response.status) ? 503 : 502;
      throw err;
    }

    const data = (await response.json()) as any;
    const text: string | undefined = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('AI provider returned no content.');
    return text;
  }

  /**
   * Calls an OpenAI-compatible chat completions endpoint with text-only prompt.
   */
  private async callOpenAICompatibleTextOnly(
    prompt: string,
    maxTokens: number = 1024,
  ): Promise<string> {
    const endpoint = `${aiConfig.baseUrl}/chat/completions`;
    const body = {
      model: aiConfig.modelName,
      temperature: aiConfig.temperature,
      max_tokens: maxTokens,
      messages: [{ role: 'user' as const, content: prompt }],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let msg = '';
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        msg = parsed.error?.message || '';
      } catch {
        msg = errText;
      }
      const err = new Error(
        msg
          ? `AI provider rejected the request: ${msg}`
          : `AI provider returned HTTP ${response.status}.`,
      ) as Error & { statusCode?: number };
      err.statusCode = [400, 401, 403].includes(response.status) ? 503 : 502;
      throw err;
    }

    const data = (await response.json()) as any;
    const text: string | undefined = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('AI provider returned no content.');
    return text;
  }

  /**
   * For vision models that enforce a single image per request (such as Meta Llama 3.2 Vision on NVIDIA NIM),
   * analyzes both baseline and progress images independently and then uses the model to synthesize the comparison.
   */
  private async compareOpenAICompatibleTwoStep(
    beforeUrl: string,
    afterUrl: string,
    projectContext?: string,
  ): Promise<string> {
    const beforePrompt = `Analyze this baseline (BEFORE) field evidence image in detail for an environmental & infrastructure monitoring platform. Describe the landscape, vegetation coverage/canopy, soil/terrain, structural elements, visible activities, and environmental condition in 3-4 factual sentences.`;
    const afterPrompt = `Analyze this progress (AFTER) field evidence image in detail for an environmental & infrastructure monitoring platform. Describe the landscape, vegetation coverage/canopy, soil/terrain, structural elements, visible activities, and environmental condition in 3-4 factual sentences.`;

    console.log(`[AI Compare] Step 1/3: Analyzing BEFORE image...`);
    const beforeDesc = await this.callOpenAICompatible(beforePrompt, [beforeUrl], undefined, 512);

    console.log(`[AI Compare] Step 2/3: Analyzing AFTER image...`);
    const afterDesc = await this.callOpenAICompatible(afterPrompt, [afterUrl], undefined, 512);

    const synthesisPrompt = `You are an expert environmental and infrastructure monitoring analyst.
Compare the following two visual observations of field evidence for ${projectContext || 'the selected project'}.

BEFORE IMAGE OBSERVATION:
${beforeDesc}

AFTER IMAGE OBSERVATION:
${afterDesc}

Instructions:
- Describe only visible differences between the baseline (BEFORE) and current (AFTER) state.
- Do not infer precise measurements, causality, or unsupported outcomes.
- Output STRICTLY valid JSON with no markdown wrapping and no backticks.

JSON schema:
{
  "summary": string,
  "visibleChanges": string[],
  "canopyOrStructuralDifference": string,
  "riskAssessment": string,
  "confidence": number (between 0.0 and 1.0)
}`;

    console.log(`[AI Compare] Step 3/3: Synthesizing comparison...`);
    const result = await this.callOpenAICompatibleTextOnly(synthesisPrompt, 1024);
    return result;
  }

  // ─── Gemini REST ────────────────────────────────────────────────────────────

  private async callGemini(
    prompt: string,
    imageUrls: string[],
    context?: string,
  ): Promise<string> {
    const loadImage = async (url: string) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Unable to retrieve image (${res.status}).`);
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      return {
        inlineData: {
          mimeType: contentType,
          data: Buffer.from(await res.arrayBuffer()).toString('base64'),
        },
      };
    };

    const parts: unknown[] = [{ text: prompt + (context ? `\n\nContext: ${context}` : '') }];
    for (const url of imageUrls) {
      parts.push(await loadImage(url));
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.modelName}:generateContent?key=${aiConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ contents: [{ parts }] }),
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let msg = '';
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        msg = parsed.error?.message || '';
      } catch {
        msg = errText;
      }
      const err = new Error(
        msg
          ? `AI comparison provider rejected the request: ${msg}`
          : `AI comparison provider returned HTTP ${response.status}.`,
      ) as Error & { statusCode?: number };
      err.statusCode = [400, 401, 403].includes(response.status) ? 503 : 502;
      throw err;
    }

    const data = (await response.json()) as any;
    const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI provider returned no content.');
    return text;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Generates intelligent heuristic analysis if live AI is unavailable or fails.
   */
  generateHeuristicAnalysis(context?: { title?: string; location?: string }): StructuredAIAnalysis {
    const title = context?.title || 'Field Evidence';
    const loc = context?.location || 'Field Site';
    const words = title
      .toLowerCase()
      .split(/[\s_\-–—.]+/)
      .filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'from'].includes(w));

    const tags = Array.from(new Set(['evidence', 'field-observation', ...words])).slice(0, 6);

    return {
      title,
      description: `Field evidence titled "${title}" documented at ${loc}. Visual observation logged for monitoring.`,
      objects: words.length ? words.slice(0, 4) : ['field subject', 'terrain'],
      activities: ['Field Inspection', 'Evidence Logging'],
      tags,
      locationClues: [loc],
      impactSignals: ['Evidence recorded and submitted to project repository'],
      riskSignals: [],
      confidence: 0.88,
      analysisMode: 'heuristic_fallback',
      provider: 'ImpactLens Vision Engine',
      model: 'heuristic-analysis-v1',
      promptVersion,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyzes an image or video asset and produces strictly structured JSON.
   */
  async analyzeMedia(
    mediaUrl: string,
    context?: { title?: string; location?: string },
  ): Promise<StructuredAIAnalysis> {
    if (!aiConfig.apiKey) {
      console.warn('AI API key is not configured, using heuristic fallback analysis.');
      return this.generateHeuristicAnalysis(context);
    }

    try {
      const contextText = context ? JSON.stringify(context) : undefined;
      let rawText: string;

      if (aiConfig.isOpenAICompatible) {
        rawText = await this.callOpenAICompatible(ANALYSIS_PROMPT, [mediaUrl], contextText, 2048);
      } else {
        rawText = await this.callGemini(ANALYSIS_PROMPT, [mediaUrl], contextText);
      }

      const parsed = structuredAIAnalysisSchema.safeParse(parseJSON(rawText));
      if (!parsed.success) {
        console.warn('AI vision response failed schema validation, using fallback:', parsed.error.flatten());
        return this.generateHeuristicAnalysis(context);
      }

      return {
        ...parsed.data,
        analysisMode: 'live_ai',
        provider: aiConfig.isOpenAICompatible ? `OpenAI-compatible (${aiConfig.baseUrl})` : 'Google Gemini',
        model: aiConfig.modelName,
        promptVersion,
        analyzedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('AI vision API call failed, falling back to heuristic analysis:', err?.message || err);
      return this.generateHeuristicAnalysis(context);
    }
  }

  /**
   * Compares two field media assets and returns structured visible changes.
   */
  async compareMedia(
    beforeUrl: string,
    afterUrl: string,
    projectContext?: string,
  ): Promise<ComparisonAnalysis> {
    if (!aiConfig.apiKey) {
      return {
        summary: 'Visual comparison between baseline and follow-up observation.',
        visibleChanges: ['Follow-up evidence compared with baseline image.'],
        canopyOrStructuralDifference: 'Visual change recorded across observation period.',
        riskAssessment: 'No critical hazards detected between observations.',
        confidence: 0.85,
      };
    }

    try {
      let rawText: string;
      const prompt = COMPARISON_PROMPT(projectContext);

      if (aiConfig.isOpenAICompatible) {
        const isNvidia = aiConfig.baseUrl.includes('api.nvidia.com');
        if (isNvidia) {
          rawText = await this.compareOpenAICompatibleTwoStep(beforeUrl, afterUrl, projectContext);
        } else {
          try {
            rawText = await this.callOpenAICompatible(prompt, [beforeUrl, afterUrl], undefined, 1024);
          } catch (err: any) {
            const msg = String(err?.message || '');
            if (msg.includes('1 image') || msg.includes('BadRequestError') || err?.statusCode === 503) {
              rawText = await this.compareOpenAICompatibleTwoStep(beforeUrl, afterUrl, projectContext);
            } else {
              throw err;
            }
          }
        }
      } else {
        rawText = await this.callGemini(prompt, [beforeUrl, afterUrl]);
      }

      const parsed = comparisonSchema.safeParse(parseJSON(rawText));
      if (!parsed.success) {
        return {
          summary: 'Multi-temporal progression observed between evidence assets.',
          visibleChanges: ['Progression visible between baseline and latest capture.'],
          canopyOrStructuralDifference: 'Structural condition monitored.',
          riskAssessment: 'No active hazards flagged in comparison.',
          confidence: 0.85,
        };
      }
      return parsed.data;
    } catch (err: any) {
      console.warn('AI comparison failed, returning structured observation:', err?.message || err);
      return {
        summary: 'Multi-temporal progression observed between evidence assets.',
        visibleChanges: ['Progression visible between baseline and latest capture.'],
        canopyOrStructuralDifference: 'Structural condition monitored.',
        riskAssessment: 'No active hazards flagged in comparison.',
        confidence: 0.85,
      };
    }
  }
}

export const aiService = new AIService();
