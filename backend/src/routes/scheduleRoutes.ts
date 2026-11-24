import { Router } from 'express';
import { 
  getSchedules, 
  getRooms, 
  createSchedule, 
  getPanelists, 
  addPanelistToSchedule,
  deleteSchedule,
  removePanelistFromSchedule
} from '../controllers/scheduleController';

const router = Router();

router.get('/', getSchedules);
router.get('/rooms', getRooms);
router.get('/panelists', getPanelists);
router.post('/', createSchedule);
router.post('/:scheduleId/panelists', addPanelistToSchedule);
router.delete('/:id', deleteSchedule);
router.delete('/:scheduleId/panelists/:panelistId', removePanelistFromSchedule);

export default router;