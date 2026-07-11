import { Router } from 'express';
import {
  getChatRooms,
  getMessages,
  sendMessage,
  getActiveUsers,
  initiatePersonalChat,
  addParticipantToRoom,
  removeParticipantFromRoom,
  getRoomDetail,
  updateMessage,
  deleteMessage,
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/rooms', getChatRooms);
router.get('/rooms/:roomId', getRoomDetail);
router.get('/rooms/:roomId/messages', getMessages);
router.post('/rooms/:roomId/messages', sendMessage);
router.patch('/messages/:messageId', updateMessage);
router.delete('/messages/:messageId', deleteMessage);
router.post('/rooms/:roomId/participants', addParticipantToRoom);
router.delete('/rooms/:roomId/participants/:targetUserId', removeParticipantFromRoom);
router.get('/users', getActiveUsers);
router.post('/personal', initiatePersonalChat);

export default router;
