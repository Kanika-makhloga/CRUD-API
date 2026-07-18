const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
const PORT = 3000;

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
  res.json(tasks);
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

  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json(task);
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


  const newTask = {
    id: tasks.length + 1,
    title: title,
    done: false
  };


  tasks.push(newTask);

  res.status(201).json(newTask);

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