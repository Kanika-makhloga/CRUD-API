const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE
    )
  `);

  const result = await pool.query("SELECT COUNT(*) FROM tasks");

  if (parseInt(result.rows[0].count) === 0) {
    await pool.query(
      `INSERT INTO tasks (title, done)
       VALUES
       ($1, $2),
       ($3, $4),
       ($5, $6)`,
      [
        "Study Express",
        false,
        "Complete Assignment",
        true,
        "Practice CRUD",
        false
      ]
    );

    console.log("Seeded 3 example tasks");
  }
}

async function getAllTasks() {
  const result = await pool.query(
    "SELECT * FROM tasks ORDER BY id"
  );

  return result.rows;
}

async function getTaskById(id) {
  const result = await pool.query(
    "SELECT * FROM tasks WHERE id = $1",
    [id]
  );

  return result.rows[0];
}

async function createTask(title) {
  const result = await pool.query(
    `INSERT INTO tasks (title, done)
     VALUES ($1, $2)
     RETURNING *`,
    [title, false]
  );

  return result.rows[0];
}

async function updateTask(id, title, done) {
  const result = await pool.query(
    `UPDATE tasks
     SET title = $1, done = $2
     WHERE id = $3
     RETURNING *`,
    [title, done, id]
  );

  return result.rows[0];
}

async function deleteTask(id) {
  const result = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
}

module.exports = {
  initializeDatabase,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};