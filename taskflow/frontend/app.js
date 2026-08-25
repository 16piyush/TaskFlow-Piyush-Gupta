const API = '/api';
let token = localStorage.getItem('tf_token');
let currentUser = JSON.parse(localStorage.getItem('tf_user') || 'null');
let currentFilter = '';
let editingTaskId = null;

const $ = (id) => document.getElementById(id);

// ---------- Auth screen wiring ----------
$('show-register').onclick = () => { $('login-form').classList.add('hidden'); $('register-form').classList.remove('hidden'); };
$('show-login').onclick = () => { $('register-form').classList.add('hidden'); $('login-form').classList.remove('hidden'); };

$('login-btn').onclick = async () => {
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  $('login-err').textContent = '';
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setSession(data.token, data.user);
  } catch (e) { $('login-err').textContent = e.message; }
};

$('register-btn').onclick = async () => {
  const name = $('reg-name').value.trim();
  const email = $('reg-email').value.trim();
  const password = $('reg-password').value;
  $('register-err').textContent = '';
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setSession(data.token, data.user);
  } catch (e) { $('register-err').textContent = e.message; }
};

$('logout-btn').onclick = () => {
  localStorage.removeItem('tf_token');
  localStorage.removeItem('tf_user');
  token = null; currentUser = null;
  location.reload();
};

function setSession(t, u) {
  token = t; currentUser = u;
  localStorage.setItem('tf_token', t);
  localStorage.setItem('tf_user', JSON.stringify(u));
  showApp();
}

// ---------- App screen ----------
function showApp() {
  $('auth-screen').classList.add('hidden');
  $('app-screen').classList.remove('hidden');
  $('user-name').textContent = currentUser.name;
  loadTasks();
  loadStats();
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.status;
    $('view-title').textContent = btn.textContent;
    loadTasks();
  };
});

async function authedFetch(url, opts = {}) {
  opts.headers = { ...(opts.headers || {}), 'Authorization': `Bearer ${token}` };
  const res = await fetch(url, opts);
  if (res.status === 401 || res.status === 403) {
    $('logout-btn').click();
    throw new Error('Session expired');
  }
  return res;
}

async function loadTasks() {
  const q = currentFilter ? `?status=${currentFilter}` : '';
  const res = await authedFetch(`${API}/tasks${q}`);
  const tasks = await res.json();
  renderTasks(tasks);
}

async function loadStats() {
  const res = await authedFetch(`${API}/tasks/stats/summary`);
  const s = await res.json();
  $('stats').innerHTML = `
    <div class="stat-row"><span>Total</span><b>${s.total}</b></div>
    <div class="stat-row"><span>Pending</span><b>${s.pending}</b></div>
    <div class="stat-row"><span>In progress</span><b>${s.inProgress}</b></div>
    <div class="stat-row"><span>Completed</span><b>${s.completed}</b></div>
  `;
}

function renderTasks(tasks) {
  const list = $('task-list');
  list.innerHTML = '';
  $('empty-state').classList.toggle('hidden', tasks.length > 0);

  tasks.forEach(t => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.onclick = () => openModal(t);
    card.innerHTML = `
      <div class="task-main">
        <div class="task-title ${t.status === 'completed' ? 'done' : ''}">${escapeHtml(t.title)}</div>
        ${t.description ? `<div class="task-desc">${escapeHtml(t.description)}</div>` : ''}
      </div>
      <div class="task-meta">
        ${t.dueDate ? `<span class="due">${formatDate(t.dueDate)}</span>` : ''}
        <span class="pill ${t.priority}">${t.priority}</span>
        <span class="pill status-${t.status}">${t.status.replace('-', ' ')}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modal ----------
$('new-task-btn').onclick = () => openModal(null);
$('cancel-modal-btn').onclick = closeModal;

function openModal(task) {
  editingTaskId = task ? task.id : null;
  $('modal-title').textContent = task ? 'Edit task' : 'New task';
  $('task-title').value = task ? task.title : '';
  $('task-desc').value = task ? task.description : '';
  $('task-priority').value = task ? task.priority : 'medium';
  $('task-status').value = task ? task.status : 'pending';
  $('task-due').value = task && task.dueDate ? task.dueDate.slice(0, 10) : '';
  $('delete-task-btn').classList.toggle('hidden', !task);
  $('task-modal').classList.remove('hidden');
}
function closeModal() { $('task-modal').classList.add('hidden'); }

$('delete-task-btn').onclick = async () => {
  if (!editingTaskId) return;
  await authedFetch(`${API}/tasks/${editingTaskId}`, { method: 'DELETE' });
  closeModal();
  loadTasks();
  loadStats();
};

$('save-task-btn').onclick = async () => {
  const body = {
    title: $('task-title').value.trim(),
    description: $('task-desc').value.trim(),
    priority: $('task-priority').value,
    status: $('task-status').value,
    dueDate: $('task-due').value || null
  };
  if (!body.title) return;

  if (editingTaskId) {
    await authedFetch(`${API}/tasks/${editingTaskId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
  } else {
    await authedFetch(`${API}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
  }
  closeModal();
  loadTasks();
  loadStats();
};

// ---------- Init ----------
if (token && currentUser) showApp();
