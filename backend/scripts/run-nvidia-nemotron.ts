import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.AI_API_KEY || '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';
const baseURL = process.env.AI_BASE_URL || 'https://integrate.api.nvidia.com/v1';

const openai = new OpenAI({
  apiKey,
  baseURL,
});

async function main() {
  console.log('🤖 Connecting to NVIDIA NIM API...');
  console.log(`Endpoint: ${baseURL}`);
  console.log(`Model: nvidia/nemotron-3-ultra-550b-a55b\n`);

  try {
    const completion = await openai.chat.completions.create({
      model: 'nvidia/nemotron-3-ultra-550b-a55b',
      messages: [{ role: 'user', content: 'Write a limerick about the wonders of GPU computing.' }],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 1024,
      stream: true,
    });

    console.log('--- NVIDIA Nemotron Response ---');
    for await (const chunk of completion) {
      const reasoning = (chunk.choices[0]?.delta as any)?.reasoning_content;
      if (reasoning) {
        process.stdout.write(`\x1b[33m${reasoning}\x1b[0m`);
      }
      process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }
    console.log('\n\n✅ Stream completed successfully.');
  } catch (error: any) {
    console.error('❌ Request failed:', error.message || error);
  }
}

main();
