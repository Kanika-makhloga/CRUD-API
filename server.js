require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");

const express = require("express");
const app = express();

const {
  initializeDatabase,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} = require("./repositories/taskRepository");

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Root Endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

// Health Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// GET all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch tasks"
    });
  }
});

// GET task by ID
app.get("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const task = await getTaskById(id);

    if (!task) {
      return res.status(404).json({
        error: `Task ${id} not found`
      });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch task"
    });
  }
});

// POST create task
app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        error: "Title is required"
      });
    }

    const newTask = await createTask(title);

    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create task"
    });
  }
});

// PUT update task
app.put("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const task = await getTaskById(id);

    if (!task) {
      return res.status(404).json({
        error: `Task ${id} not found`
      });
    }

    const { title, done } = req.body;

    if (
      (title !== undefined &&
        (typeof title !== "string" || title.trim() === "")) ||
      (done !== undefined && typeof done !== "boolean")
    ) {
      return res.status(400).json({
        error: "Invalid data"
      });
    }

    const updatedTitle = title !== undefined ? title : task.title;
    const updatedDone = done !== undefined ? done : task.done;

    const updatedTask = await updateTask(
      id,
      updatedTitle,
      updatedDone
    );

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update task"
    });
  }
});

// DELETE task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const deletedTask = await deleteTask(id);

    if (!deletedTask) {
      return res.status(404).json({
        error: `Task ${id} not found`
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to delete task"
    });
  }
});

// Swagger Docs
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// Initialize database first, then start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running and connected to Supabase on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });