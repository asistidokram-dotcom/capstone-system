import { Router } from 'express';
import { getRevisions, createRevision, updateRevisionStatus } from '../controllers/revisionController';

const router = Router();

router.get('/:scheduleId', getRevisions);
router.post('/', createRevision);
router.put('/:id/status', updateRevisionStatus);

export default router;