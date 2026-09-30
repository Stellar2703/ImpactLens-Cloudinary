import { Router } from 'express';
import { storiesController } from '../controllers/stories.controller';

const router = Router();

router.get('/', (req, res, next) => storiesController.getStories(req, res, next));
router.post('/generate', (req, res, next) => storiesController.generateStory(req, res, next));

export default router;
