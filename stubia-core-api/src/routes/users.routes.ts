import { Router } from 'express';
import { listUsers, createUser, updateUser, deleteUser, restoreUser } from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/restore', restoreUser);

export default router;
