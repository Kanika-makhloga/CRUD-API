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

const authRoutes = require("./routes/auth");
const requireAuth = require("./middleware/authMiddleware");

app.use(express.json());

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;

// ==========================================
// ROOT
// ==========================================

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: [
      "/tasks",
      "/auth/signup",
      "/auth/login",
      "/auth/logout",
      "/public/info",
      "/protected/profile"
    ]
  });
});

// ==========================================
// HEALTH
// ==========================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// ==========================================
// PUBLIC ROUTE
// ==========================================

app.get("/public/info", (req, res) => {
  res.status(200).json({
    message: "Welcome stranger! This info is public."
  });
});

// ==========================================
// PROTECTED PROFILE
// ==========================================

app.get("/protected/profile", requireAuth, (req, res) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    message: "Protected profile accessed successfully"
  });
});

// ==========================================
// EXISTING CRUD ROUTES
// ==========================================

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

    const updatedTitle =
      title !== undefined ? title : task.title;

    const updatedDone =
      done !== undefined ? done : task.done;

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

// ==========================================
// SWAGGER
// ==========================================

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// ==========================================
// START SERVER
// ==========================================

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running and connected to Supabase on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Database initialization failed:",
      error
    );

    process.exit(1);
  });