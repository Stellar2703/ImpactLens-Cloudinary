import { Router } from 'express';
import { projectIntelligenceController } from '../controllers/project-intelligence.controller';

const router = Router();
router.get('/:projectId/evidence-requirements', (req, res, next) => projectIntelligenceController.getRequirements(req, res, next));
router.post('/:projectId/evidence-requirements', (req, res, next) => projectIntelligenceController.createRequirement(req, res, next));
router.get('/:projectId/milestones', (req, res, next) => projectIntelligenceController.getMilestones(req, res, next));
router.post('/:projectId/milestones', (req, res, next) => projectIntelligenceController.createMilestone(req, res, next));
export default router;
