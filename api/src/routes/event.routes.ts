import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth1.middleware'; 
import { createEvent, getEventListPublic, getEventDetailPublic } from '../controllers/event.controller'; 
import { Role } from '../../generated/prisma';
import { createPromotion } from '../controllers/event.controller';
import { getOrganizerEvents } from '../controllers/event.controller';
import { getTicketDetailController } from '../controllers/event.controller';
import { updateEvent } from '../controllers/event.controller';

const router = Router();

router.get('/', getEventListPublic);
router.get('/:id', getEventDetailPublic);
router.get(
    '/organizer/events', 
    authenticate, 
    authorize(Role.organizer),
    getOrganizerEvents
);

router.get(
    '/tickets/:id',
    authenticate, 
    getTicketDetailController
);
router.post(
    '/', 
    authenticate,
    authorize(Role.organizer),
    createEvent
);

router.post(
    '/promotions',
    authenticate, 
    authorize(Role.organizer), 
    createPromotion
);

router.put(
    '/:id', 
    authenticate, 
    authorize(Role.organizer),
    updateEvent
);

export default router;