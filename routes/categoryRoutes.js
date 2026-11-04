import express from 'express';
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getAllCategories);
router.post('/', createCategory);
router.get('/:slug', getCategoryBySlug);

export default router;
