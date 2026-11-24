import { Router } from 'express';
import { getAllUsers, createUser, getRooms, createRoom } from '../controllers/userController';

const router = Router();

router.get('/', getAllUsers);
router.post('/', createUser);
router.get('/rooms', getRooms);
router.post('/rooms', createRoom);

export default router;