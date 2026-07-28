const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

const db = new sqlite3.Database("./tasks.db", (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task API",
      version: "1.0.0",
      description: "CRUD API for managing tasks"
    }
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL
    )
  `);

  db.get("SELECT COUNT(*) AS count FROM tasks", (err, row) => {

    if (row.count === 0) {

      const stmt = db.prepare(
        "INSERT INTO tasks (title, done) VALUES (?, ?)"
      );

      stmt.run("Learn Node.js", 0);
      stmt.run("Build CRUD API", 0);
      stmt.run("Complete Assignment", 1);

      stmt.finalize();

      console.log("Sample tasks inserted.");

    }

  });

});


/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     responses:
 *       200:
 *         description: Success
 */
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: [
      "/tasks",
      "/docs"
    ]
  });
});


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health
 *     responses:
 *       200:
 *         description: Server running
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});


/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     responses:
 *       200:
 *         description: List of tasks
 */
app.get("/tasks", (req, res) => {

  db.all("SELECT * FROM tasks", [], (err, rows) => {

    if (err) {
      return res.status(500).json({
        error: err.message
      });
    }

    const tasks = rows.map(task => ({
      id: task.id,
      title: task.title,
      done: Boolean(task.done)
    }));

    res.json(tasks);

  });

});


/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
app.get("/tasks/:id", (req, res) => {

  const id = Number(req.params.id);

  db.get(
    "SELECT * FROM tasks WHERE id = ?",
    [id],
    (err, row) => {

      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      if (!row) {
        return res.status(404).json({
          error: "Task not found"
        });
      }

      res.json({
        id: row.id,
        title: row.title,
        done: Boolean(row.done)
      });

    }
  );

});


/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created
 */
app.post("/tasks", (req, res) => {

  const { title } = req.body || {};

  if (!title || title.trim() === "") {
    return res.status(400).json({
      error: "Title is required"
    });
  }

  db.run(
    "INSERT INTO tasks (title, done) VALUES (?, ?)",
    [title.trim(), 0],
    function (err) {

      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.status(201).json({
        id: this.lastID,
        title: title.trim(),
        done: false
      });

    }
  );

});


/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update task
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Learn Express"
 *               done:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
app.put("/tasks/:id", (req, res) => {

  const id = Number(req.params.id);

  const task = tasks.find(t => t.id === id);


  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }


  const { title, done } = req.body || {};


  if (title !== undefined) {
    task.title = title;
  }


  if (done !== undefined) {
    task.done = done;
  }


  res.json(task);

});


/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted successfully
 */
app.delete("/tasks/:id", (req, res) => {

  const id = Number(req.params.id);


  const index = tasks.findIndex(t => t.id === id);


  if (index === -1) {
    return res.status(404).json({
      error: "Task not found"
    });
  }


  tasks.splice(index, 1);


  res.status(204).send();

});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});