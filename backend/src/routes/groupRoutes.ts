import { Router } from 'express';
import { 
  getAllGroups, 
  getAdvisers, 
  createGroup, 
  updateGroup, // <-- ADDED IMPORT
  getAvailableStudents, 
  addGroupMember,
  deleteGroup,
  removeGroupMember
} from '../controllers/groupController';

const router = Router();

router.get('/', getAllGroups);
router.get('/advisers', getAdvisers);
router.get('/students', getAvailableStudents);
router.post('/', createGroup);
router.put('/:id', updateGroup); // <-- ADDED ROUTE
router.post('/:groupId/members', addGroupMember);
router.delete('/:id', deleteGroup);
router.delete('/:groupId/members/:memberId', removeGroupMember);

export default router;