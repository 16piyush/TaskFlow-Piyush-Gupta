const express = require('express');
const { readDB, writeDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tasks - list current user's tasks (supports ?status= & ?priority= filters)
router.get('/', (req, res) => {
  const db = readDB();
  let tasks = db.tasks.filter(t => t.userId === req.user.id);

  const { status, priority } = req.query;
  if (status) tasks = tasks.filter(t => t.status === status);
  if (priority) tasks = tasks.filter(t => t.priority === priority);

  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(tasks);
});

// POST /api/tasks - create a task
router.post('/', (req, res) => {
  const { title, description, priority, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const db = readDB();
  const newTask = {
    id: Date.now().toString(),
    userId: req.user.id,
    title,
    description: description || '',
    priority: priority || 'medium',
    status: 'pending',
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.tasks.push(newTask);
  writeDB(db);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id - update a task
router.put('/:id', (req, res) => {
  const db = readDB();
  const task = db.tasks.find(t => t.id === req.params.id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  const { title, description, priority, status, dueDate } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (dueDate !== undefined) task.dueDate = dueDate;
  task.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const db = readDB();
  const idx = db.tasks.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Task not found.' });

  db.tasks.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Task deleted.' });
});

// GET /api/tasks/stats/summary - dashboard counts
router.get('/stats/summary', (req, res) => {
  const db = readDB();
  const tasks = db.tasks.filter(t => t.userId === req.user.id);
  const summary = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };
  res.json(summary);
});

module.exports = router;
