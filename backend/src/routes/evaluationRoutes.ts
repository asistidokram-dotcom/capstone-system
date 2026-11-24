import { Router } from 'express';
import { 
  getCriteria, 
  getScheduleEvaluations, 
  submitEvaluation, 
  getConsolidatedResults 
} from '../controllers/evaluationController';

const router = Router();

router.get('/criteria', getCriteria);
router.get('/:scheduleId', getScheduleEvaluations);
router.get('/:scheduleId/results', getConsolidatedResults);
router.post('/:scheduleId', submitEvaluation);

export default router;