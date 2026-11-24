import { Router } from 'express';
import { getDashboardStats, getWorkloads, getStudentGroupInfo } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/workloads', getWorkloads);
router.get('/student-group', getStudentGroupInfo); // <-- NEW ROUTE ADDED

export default router;