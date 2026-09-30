import { aiService } from './src/services/ai.service';

const u1 = 'https://res.cloudinary.com/jvlb23cw/image/upload/v1790777226/impactlens/projects/proj-004/evidence/m_10348/txdtcciuq7jodvk1wu2b.jpg';
const u2 = 'https://res.cloudinary.com/jvlb23cw/image/upload/v1790775830/impactlens/projects/proj-004/evidence/m_01349/a3ntoibuk6yledopsnvr.jpg';

async function main() {
  console.log('Starting comparison test...');
  try {
    const res = await aiService.compareMedia(u1, u2, 'Flood Response 2026');
    console.log('SUCCESS:');
    console.log(JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error('ERROR NAME:', err?.name);
    console.error('ERROR MESSAGE:', err?.message);
    console.error('ERROR CAUSE:', err?.cause);
    console.error('STACK:', err?.stack);
  }
}

main();
