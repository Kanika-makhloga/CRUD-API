const express = require("express");

const app = express();

const PORT = 3000;

app.use(express.json());

// In-memory tasks list
let tasks = [
  {
    id: 1,
    title: "Learn Node.js",
    done: false
  },
  {
    id: 2,
    title: "Build CRUD API",
    done: false
  },
  {
    id: 3,
    title: "Complete Assignment",
    done: true
  }
];

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// GET all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// GET single task by id
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const task = tasks.find(task => task.id === id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`
    });
  }

  res.json(task);
});

// POST create new task
app.post("/tasks", (req, res) => {
  const { title } = req.body;

  // Validation
  if (!title || title.trim() === "") {
    return res.status(400).json({
      error: "Title is required"
    });
  }

  const newTask = {
    id: tasks.length + 1,
    title: title,
    done: false
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

// PUT update task
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const task = tasks.find(task => task.id === id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`
    });
  }

  const { title, done } = req.body;

  // Validation
  if (
    (title !== undefined && title.trim() === "") ||
    (done !== undefined && typeof done !== "boolean")
  ) {
    return res.status(400).json({
      error: "Invalid task data"
    });
  }

  if (title !== undefined) {
    task.title = title;
  }

  if (done !== undefined) {
    task.done = done;
  }

  res.json(task);
});


// DELETE task
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const taskIndex = tasks.findIndex(task => task.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: `Task ${id} not found`
    });
  }

  tasks.splice(taskIndex, 1);

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});