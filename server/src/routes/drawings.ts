import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 模拟数据库
const drawings: Map<string, any> = new Map();

// 创建图纸记录
router.post('/', authMiddleware, (req: any, res) => {
  try {
    const { name, filePath, fileType, pageCount, width, height, annotations } = req.body;

    const drawing = {
      id: uuidv4(),
      userId: req.user.userId,
      name,
      filePath,
      fileType,
      pageCount: pageCount || 1,
      width,
      height,
      annotations: annotations || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    drawings.set(drawing.id, drawing);

    res.status(201).json(drawing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户的所有图纸
router.get('/', authMiddleware, (req: any, res) => {
  try {
    const userDrawings = Array.from(drawings.values())
      .filter(d => d.userId === req.user.userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(userDrawings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个图纸
router.get('/:id', authMiddleware, (req: any, res) => {
  try {
    const drawing = drawings.get(req.params.id);

    if (!drawing) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    if (drawing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(drawing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新图纸
router.put('/:id', authMiddleware, (req: any, res) => {
  try {
    const drawing = drawings.get(req.params.id);

    if (!drawing) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    if (drawing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, annotations, filePath } = req.body;

    if (name !== undefined) drawing.name = name;
    if (annotations !== undefined) drawing.annotations = annotations;
    if (filePath !== undefined) drawing.filePath = filePath;
    drawing.updatedAt = new Date();

    drawings.set(drawing.id, drawing);

    res.json(drawing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除图纸
router.delete('/:id', authMiddleware, (req: any, res) => {
  try {
    const drawing = drawings.get(req.params.id);

    if (!drawing) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    if (drawing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    drawings.delete(req.params.id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
