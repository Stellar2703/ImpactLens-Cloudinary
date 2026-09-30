import { Router } from 'express';
import { comparisonsController } from '../controllers/comparisons.controller';

const router = Router();

router.get('/', (req, res, next) => comparisonsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => comparisonsController.getById(req, res, next));
router.post('/', (req, res, next) => comparisonsController.compare(req, res, next));

export default router;

