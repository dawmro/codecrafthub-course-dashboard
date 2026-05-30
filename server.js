import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let courses = [];
let nextId = 1;

// GET /api/courses - fetch all courses
app.get('/api/courses', (req, res) => {
  res.json(courses);
});

// GET /api/courses/:id - fetch single course
app.get('/api/courses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const course = courses.find(c => c.id === id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  res.json(course);
});

// POST /api/courses - create new course
app.post('/api/courses', (req, res) => {
  const { name, description, target_date, status } = req.body;

  // Validation
  if (!name || !description || !target_date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const validStatuses = ['Not Started', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const newCourse = {
    id: nextId++,
    name: name.trim(),
    description: description.trim(),
    target_date,
    status,
    created_at: new Date().toISOString()
  };

  courses.push(newCourse);
  res.status(201).json(newCourse);
});

// PUT /api/courses/:id - update course
app.put('/api/courses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const courseIndex = courses.findIndex(c => c.id === id);

  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const { name, description, target_date, status } = req.body;

  // Validation
  if (status) {
    const validStatuses = ['Not Started', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
  }

  const updatedCourse = {
    ...courses[courseIndex],
    ...(name && { name: name.trim() }),
    ...(description && { description: description.trim() }),
    ...(target_date && { target_date }),
    ...(status && { status })
  };

  courses[courseIndex] = updatedCourse;
  res.json(updatedCourse);
});

// DELETE /api/courses/:id - delete course
app.delete('/api/courses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const courseIndex = courses.findIndex(c => c.id === id);

  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  courses.splice(courseIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/courses`);
});
