# Task CRUD API

A RESTful Task CRUD API built using Node.js, Express, and PostgreSQL.

The project demonstrates the progression from basic API development to a containerized PostgreSQL-backed application.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Docker
- Docker Compose
- Swagger/OpenAPI

## Features

- Create tasks
- Read all tasks
- Read a task by ID
- Update tasks
- Delete tasks
- PostgreSQL persistence
- Parameterized SQL queries
- Dockerized API
- Dockerized PostgreSQL
- Persistent Docker volume
- Swagger API documentation
- Health endpoint

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Health check |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get task by ID |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/docs` | Swagger documentation |

## Run with Docker

Make sure Docker Desktop is running.

Create `.env` from `.env.example` and set the required values.

Then run:

```bash
docker compose up --build