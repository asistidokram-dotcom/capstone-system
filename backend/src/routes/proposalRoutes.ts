import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAllProposals, updateProposalStatus, createProposal } from '../controllers/proposalController';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

// FIXED: Use process.cwd() instead of __dirname for NodeNext compatibility
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('document')(req, res, (err: any) => {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

router.get('/', getAllProposals);
router.put('/:id/status', authorize('ADMIN', 'COORDINATOR', 'ADVISER'), updateProposalStatus);
router.post('/', authorize('STUDENT', 'ADMIN', 'COORDINATOR'), uploadMiddleware, createProposal); 

export default router;