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

// Auth routes
const authRoutes = require("./routes/auth");

app.use(express.json());

// Authentication routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;

// Root Endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: [
      "/tasks",
      "/auth/signup",
      "/auth/login",
      "/public/info",
      "/protected/profile"
    ]
  });
});

// Health Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// ==========================================
// STAGE 2 - PUBLIC ROUTE
// ==========================================

app.get("/public/info", (req, res) => {
  res.status(200).json({
    message: "Welcome stranger! This info is public."
  });
});

// ==========================================
// STAGE 2 - PROTECTED ROUTE
// ==========================================

app.get("/protected/profile", (req, res) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      error: "Access token required"
    });
  }

  // Check if it uses Bearer authentication
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Access token required"
    });
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      error: "Access token required"
    });
  }

  // Stage 2 only checks that a token was provided.
  // Actual JWT verification will be added in Stage 3.
  res.status(200).json({
    message: "Protected profile accessed",
    status: "Token received"
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
// SWAGGER DOCUMENTATION
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