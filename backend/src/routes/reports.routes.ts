import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';

const router = Router();

router.get('/', (req, res, next) => reportsController.getReports(req, res, next));
router.get('/:id', (req, res, next) => reportsController.getReportById(req, res, next));
router.post('/generate', (req, res, next) => reportsController.generateReport(req, res, next));
router.patch('/:id', (req, res, next) => reportsController.updateReport(req, res, next));

export default router;
