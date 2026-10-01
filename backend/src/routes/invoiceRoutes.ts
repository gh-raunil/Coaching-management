import { Router } from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoice);

export default router;
