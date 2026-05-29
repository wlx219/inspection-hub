import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// 模拟用户数据库
const users: Map<string, { id: string; email: string; password: string; name: string }> = new Map();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 检查用户是否已存在
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 创建用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
    };
    users.set(user.id, user);

    // 生成 token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 查找用户
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成 token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req: any, res) => {
  const user = users.get(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ id: user.id, email: user.email, name: user.name });
});

// 演示模式登录（无需注册）
router.post('/demo', (req, res) => {
  const demoUser = {
    id: 'demo-user',
    email: 'demo@inspectionhub.com',
    name: '演示用户',
  };
  const token = generateToken({ userId: demoUser.id, email: demoUser.email });
  res.json({ user: demoUser, token });
});

export default router;
