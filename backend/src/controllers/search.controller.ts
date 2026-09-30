import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const projectId = req.query.projectId as string;
      const type = req.query.type as string;
      const verificationStatus = req.query.verificationStatus as string;
      const date = req.query.date as string;
      const offset = Math.max(0, Number.parseInt((req.query.offset as string) || '0', 10) || 0);
      const limit = Math.min(100, Math.max(1, Number.parseInt((req.query.limit as string) || '50', 10) || 50));

      const results = await searchService.search(q, { projectId, type, verificationStatus, date, offset, limit });
      res.json(results);
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
