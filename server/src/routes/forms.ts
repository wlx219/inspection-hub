import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 模拟数据库
const forms: Map<string, any> = new Map();

// 创建表单记录
router.post('/', authMiddleware, (req: any, res) => {
  try {
    const { name, thumbnailUrl, ocrResult, inspectionData, productBatch, inspector } = req.body;

    const form = {
      id: uuidv4(),
      userId: req.user.userId,
      name,
      thumbnailUrl,
      ocrResult,
      inspectionData: inspectionData || [],
      status: 'processed',
      productBatch,
      inspector,
      inspectionDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    forms.set(form.id, form);

    res.status(201).json(form);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户的所有表单记录
router.get('/', authMiddleware, (req: any, res) => {
  try {
    const userForms = Array.from(forms.values())
      .filter(f => f.userId === req.user.userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(userForms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个表单记录
router.get('/:id', authMiddleware, (req: any, res) => {
  try {
    const form = forms.get(req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(form);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新表单记录
router.put('/:id', authMiddleware, (req: any, res) => {
  try {
    const form = forms.get(req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, inspectionData, productBatch, inspector } = req.body;

    if (name !== undefined) form.name = name;
    if (inspectionData !== undefined) form.inspectionData = inspectionData;
    if (productBatch !== undefined) form.productBatch = productBatch;
    if (inspector !== undefined) form.inspector = inspector;
    form.updatedAt = new Date();

    forms.set(form.id, form);

    res.json(form);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除表单记录
router.delete('/:id', authMiddleware, (req: any, res) => {
  try {
    const form = forms.get(req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    forms.delete(req.params.id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 统计接口
router.get('/stats/summary', authMiddleware, (req: any, res) => {
  try {
    const userForms = Array.from(forms.values())
      .filter(f => f.userId === req.user.userId);

    const total = userForms.length;
    const qualifiedCount = userForms.filter(f =>
      f.inspectionData?.every((d: any) => d.isQualified !== false)
    ).length;
    const overToleranceCount = userForms.filter(f =>
      f.inspectionData?.some((d: any) => d.isOverTolerance)
    ).length;

    res.json({
      total,
      qualifiedCount,
      overToleranceCount,
      qualifiedRate: total > 0 ? Math.round((qualifiedCount / total) * 100) : 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
