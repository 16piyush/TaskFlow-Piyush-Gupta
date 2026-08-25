# TaskFlow — Task Management App

A full-stack task management application built with **React-style vanilla JS frontend** + **Node.js/Express REST API**, featuring JWT authentication and per-user task tracking.

## Features
- User registration & login with JWT auth and bcrypt password hashing
- Create, edit, delete tasks with title, description, priority, status, and due date
- Filter tasks by status (pending / in-progress / completed)
- Live dashboard stats (total, pending, in-progress, completed)
- Responsive UI, keyboard-accessible forms

## Tech Stack
- **Backend:** Node.js, Express, JWT, bcryptjs, JSON file storage (easy to swap for MongoDB/PostgreSQL)
- **Frontend:** HTML, CSS, vanilla JavaScript (fetch API, no build step needed)

## Run locally
```bash
cd backend
npm install
npm start
```
Then open **http://localhost:5000** in your browser. The Express server serves both the API (`/api/*`) and the frontend.

## Deploy (free, ~5 min)
1. Push this folder to a GitHub repo.
2. Deploy on [Render](https://render.com) or [Railway](https://railway.app):
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
3. Add environment variable `JWT_SECRET` with any random string.

## Project structure
```
taskflow/
├── backend/
│   ├── server.js          # Express app entry
│   ├── db.js               # JSON file-based storage
│   ├── middleware/auth.js  # JWT verification
│   └── routes/
│       ├── auth.js         # register/login
│       └── tasks.js        # task CRUD + stats
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

## API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/tasks` | List tasks (supports `?status=` filter) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats/summary` | Dashboard counts |

Built by Piyush Gupta.
