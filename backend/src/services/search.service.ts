import { MediaData } from './mock-db';
import { isDatabaseAvailable, prisma } from '../config/database';
import { mediaService } from './media.service';

export interface SearchResultItem {
  asset: MediaData;
  matchScore: number;
  matchReason: string;
}

export class SearchService {
  async search(
    query: string,
    filters?: { projectId?: string; type?: string; verificationStatus?: string; date?: string; offset?: number; limit?: number }
  ): Promise<SearchResultItem[]> {
    if (!query || !query.trim()) return [];

    if (!isDatabaseAvailable()) {
      throw new Error('Semantic search requires live database persistence.');
    }

    const q = query.toLowerCase();
    const keywords = q.match(/[\p{L}\p{N}]+/gu) || [];
    const persisted = await prisma.mediaAsset.findMany({
      where: {
        ...(filters?.projectId && filters.projectId !== 'all' ? { projectId: filters.projectId } : {}),
        ...(filters?.type && filters.type !== 'all' ? { resourceType: filters.type } : {}),
        ...(filters?.date ? { uploadedAt: { gte: new Date(`${filters.date}T00:00:00.000Z`), lt: new Date(`${filters.date}T23:59:59.999Z`) } } : {}),
      },
      include: {
        project: true,
        aiMetadata: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
        milestoneLinks: { include: { milestone: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const semanticMap: Record<string, string[]> = {
      tree: ['tree', 'trees', 'planting', 'plantation', 'sapling', 'reforestation', 'vegetation', 'foliage', 'canopy'],
      planting: ['tree', 'trees', 'plantation', 'sapling', 'reforestation', 'vegetation'],
      vegetation: ['tree', 'trees', 'plantation', 'sapling', 'foliage', 'canopy', 'greenery'],
      infrastructure: ['bridge', 'power', 'line', 'road', 'pier', 'culvert', 'construction'],
      flood: ['water', 'inundation', 'drainage', 'scour', 'river', 'washout', 'flooding'],
      road: ['road', 'highway', 'bridge', 'pavement', 'infrastructure'],
      risk: ['encroachment', 'hazard', 'scour', 'damage', 'washout', 'instability'],
      safety: ['inspection', 'clearance', 'power', 'hazard', 'risk'],
      lake: ['water', 'basin', 'weed', 'hyacinth', 'silt', 'wetland'],
      community: ['people', 'volunteer', 'panchayat', 'school', 'community'],
    };

    const results: SearchResultItem[] = persisted
      .map((rawAsset) => {
        if (!rawAsset.cloudinaryUrl) return null;
        const asset = mediaService.toMediaData(rawAsset);
        const verification = rawAsset.verifications[0]?.status || 'PENDING';
        const verificationKey = verification.toLowerCase();
        if (filters?.verificationStatus && filters.verificationStatus !== 'all' && verificationKey !== filters.verificationStatus.toLowerCase()) return null;
        const corpus = [
          { text: asset.title, weight: 5 },
          { text: asset.projectName, weight: 5 },
          { text: rawAsset.project.category, weight: 4 },
          { text: rawAsset.project.type, weight: 3 },
          { text: asset.location, weight: 3 },
          { text: asset.ai.description, weight: 5 },
          { text: asset.ai.activity, weight: 4 },
          { text: verificationKey, weight: 3 },
          ...((asset.ai.tags || []).map((text) => ({ text, weight: 4 }))),
          ...((asset.ai.objects || []).map((text) => ({ text, weight: 4 }))),
          ...((asset.ai.activities || []).map((text) => ({ text, weight: 4 }))),
          ...((asset.ai.impactSignals || []).map((text) => ({ text, weight: 4 }))),
          ...((asset.ai.riskSignals || []).map((text) => ({ text, weight: 4 }))),
          ...rawAsset.milestoneLinks.flatMap((link) => [{ text: link.milestone.title, weight: 4 }, { text: link.milestone.description, weight: 3 }]),
        ]
          .map((field) => ({ ...field, text: String(field.text || '').toLowerCase() }));

        let score = 0;
        const matchedTerms: string[] = [];

        for (const kw of keywords) {
          const match = corpus.find((field) => field.text.includes(kw) || field.text.split(/[\s,;:/-]+/).some((word) => word.startsWith(kw) || kw.startsWith(word)));
          if (match) {
            score += match.weight;
            if (!matchedTerms.includes(kw)) matchedTerms.push(kw);
          }
        }

        for (const [trigger, synonyms] of Object.entries(semanticMap)) {
          if (q.includes(trigger)) {
            for (const syn of synonyms) {
              const match = corpus.find((field) => field.text.includes(syn));
              if (match && !matchedTerms.includes(syn)) {
                score += Math.max(2, match.weight - 1);
                matchedTerms.push(syn);
              }
            }
          }
        }

        if (score === 0) return null;

        const matchScore = Math.min(99, Math.round(35 + score * 4));
        const matchReason = `Matched evidence metadata: ${matchedTerms.slice(0, 5).join(', ')}`;

        return {
          asset,
          matchScore,
          matchReason,
        };
      })
      .filter((r): r is SearchResultItem => r !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    const offset = Math.max(0, filters?.offset || 0);
    const limit = Math.min(100, Math.max(1, filters?.limit || 50));
    return results.slice(offset, offset + limit);
  }
}

export const searchService = new SearchService();
