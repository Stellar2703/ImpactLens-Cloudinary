import { Request, Response, NextFunction } from 'express';
import { comparisonService } from '../services/comparison.service';
import { z } from 'zod';

const comparisonSchema = z.object({
  projectId: z.string().trim().min(1),
  beforeMediaId: z.string().trim().min(1),
  afterMediaId: z.string().trim().min(1),
}).refine((value) => value.beforeMediaId !== value.afterMediaId, {
  message: 'Before and after media must be different assets',
});

export class ComparisonsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query;
      const comparisons = await comparisonService.getAllComparisons(projectId as string | undefined);
      res.json(comparisons);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const comparison = await comparisonService.getComparisonById(req.params.id);
      if (!comparison) return res.status(404).json({ error: 'Comparison not found' });
      res.json(comparison);
    } catch (err) {
      next(err);
    }
  }

  async compare(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = comparisonSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid comparison request', details: parsed.error.flatten() });
      }

      const result = await comparisonService.compareAssets(
        parsed.data.projectId,
        parsed.data.beforeMediaId,
        parsed.data.afterMediaId
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const comparisonsController = new ComparisonsController();

