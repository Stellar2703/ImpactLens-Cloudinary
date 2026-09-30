import { aiConfig } from '../src/config/ai';
import { aiService } from '../src/services/ai.service';

console.log('AI Config:', {
  apiKey: aiConfig.apiKey ? aiConfig.apiKey.slice(0, 10) + '...' : 'NOT_SET',
  baseUrl: aiConfig.baseUrl,
  modelName: aiConfig.modelName,
  isOpenAICompatible: aiConfig.isOpenAICompatible
});

async function run() {
  try {
    console.log('Sending test image analysis to NVIDIA NIM...');
    const result = await aiService.analyzeMedia('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
      title: 'Sample Test',
      location: 'Garden'
    });
    console.log('Success! Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('Failed:', err.message || err);
    if (err.stack) console.error(err.stack);
  }
}

run();
