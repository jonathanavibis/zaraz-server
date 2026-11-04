import express from 'express';
import { getAllBanners, createBanner } from '../controllers/bannerController.js';

const router = express.Router();

router.get('/', getAllBanners);
router.post('/', createBanner);

export default router;
