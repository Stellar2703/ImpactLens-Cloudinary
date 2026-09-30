import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller';

const router = Router();

router.get('/', (req, res, next) => projectsController.getProjects(req, res, next));
router.get('/:id', (req, res, next) => projectsController.getProjectById(req, res, next));
router.post('/', (req, res, next) => projectsController.createProject(req, res, next));
router.delete('/:id', (req, res, next) => projectsController.deleteProject(req, res, next));

export default router;
