import express from 'express';
import { getProfiles, likeProfile, getMatches, updateProfile, uploadPhoto, getMatchProfile, unmatchUser, reportUser } from '../controllers/userController.js';

const router = express.Router();

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.post('/upload', upload.single('photo'), uploadPhoto);
router.post('/upload-photo', upload.single('photo'), uploadPhoto);

import { requireAuth } from '../utils/jwtAuth.js';

router.use(requireAuth);

router.get('/profiles', getProfiles);
router.post('/like/:id', likeProfile);
router.get('/matches', getMatches);
router.get('/profile/:id', getMatchProfile);
router.put('/profile', updateProfile);
router.delete('/unmatch/:id', unmatchUser);
router.post('/report', reportUser);

export default router;
