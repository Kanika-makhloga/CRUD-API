# Task CRUD API

A secure RESTful Task API built with Node.js, Express, PostgreSQL, and Supabase Authentication.

This project demonstrates CRUD operations, user authentication, JWT verification, protected routes, reusable authentication middleware, Swagger documentation, and Dockerized PostgreSQL.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Supabase Auth
- Docker
- Docker Compose
- Swagger/OpenAPI
- Git & GitHub

## Features

- User signup
- User login
- User logout
- JWT authentication
- Protected routes
- Reusable authentication middleware
- Create tasks
- Read all tasks
- Read a task by ID
- Update tasks
- Delete tasks
- PostgreSQL persistence
- Parameterized SQL queries
- Dockerized PostgreSQL
- Persistent Docker volume
- Swagger API documentation
- Health endpoint
- Public and protected API routes

## Authentication

Supabase Auth manages users and issues JWT access tokens.

Protected endpoints require:

```text
Authorization: Bearer <access_token>