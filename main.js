import './style.css'

const API_BASE_URL = 'http://localhost:5000/api/courses';

const app = document.querySelector('#app');

let courses = [];
let editingCourseId = null;
let isLoading = false;

function init() {
  renderApp();
  fetchCourses();
}

function renderApp() {
  app.innerHTML = `
    <header>
      <h1>CodeCraftHub: Your Learning Management Platform</h1>
      <p>Manage your learning journey with ease</p>
    </header>

    <div class="container">
      <div id="message-container"></div>

      <div class="card">
        <div class="card-header">Add New Course</div>
        <form id="add-course-form">
          <div class="form-grid">
            <div class="form-group required">
              <label for="name">Course Name</label>
              <input type="text" id="name" name="name" required placeholder="Enter course name">
            </div>

            <div class="form-group required">
              <label for="description">Description</label>
              <textarea id="description" name="description" required placeholder="Enter course description"></textarea>
            </div>

            <div class="form-group required">
              <label for="target_date">Target Date</label>
              <input type="date" id="target_date" name="target_date" required>
            </div>

            <div class="form-group required">
              <label for="status">Status</label>
              <select id="status" name="status" required>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div class="btn-group" style="margin-top: 16px;">
            <button type="submit" class="btn btn-primary" id="submit-btn">
              Add Course
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-header">Your Courses</div>
        <div id="courses-container">
          <div class="loading-overlay">
            <div class="spinner spinner-dark"></div>
            <p>Loading courses...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('add-course-form').addEventListener('submit', handleAddCourse);
}

async function fetchCourses() {
  try {
    isLoading = true;
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    courses = await response.json();
    renderCourses();
  } catch (error) {
    console.error('Error fetching courses:', error);
    showMessage('Failed to load courses. Please check if the server is running.', 'error');
    renderEmptyState();
  } finally {
    isLoading = false;
  }
}

function renderCourses() {
  const container = document.getElementById('courses-container');

  if (courses.length === 0) {
    renderEmptyState();
    return;
  }

  container.innerHTML = `
    <div class="course-grid">
      ${courses.map(course => renderCourseCard(course)).join('')}
    </div>
  `;

  attachCourseEventListeners();
}

function renderCourseCard(course) {
  const isEditing = editingCourseId === course.id;
  const formattedDate = formatDate(course.target_date);
  const createdDate = formatDate(course.created_at);
  const statusClass = getStatusClass(course.status);

  if (isEditing) {
    return `
      <div class="course-card editing" data-course-id="${course.id}">
        <form class="edit-form" id="edit-form-${course.id}">
          <div class="form-grid">
            <div class="form-group required">
              <label>Course Name</label>
              <input type="text" name="name" value="${escapeHtml(course.name)}" required>
            </div>

            <div class="form-group required">
              <label>Description</label>
              <textarea name="description" required>${escapeHtml(course.description)}</textarea>
            </div>

            <div class="form-group required">
              <label>Target Date</label>
              <input type="date" name="target_date" value="${course.target_date}" required>
            </div>

            <div class="form-group required">
              <label>Status</label>
              <select name="status" required>
                <option value="Not Started" ${course.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                <option value="In Progress" ${course.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${course.status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>
          </div>

          <div class="btn-group">
            <button type="submit" class="btn btn-success btn-sm">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>
    `;
  }

  return `
    <div class="course-card" data-course-id="${course.id}">
      <div class="course-name">${escapeHtml(course.name)}</div>
      <div class="course-description">${escapeHtml(course.description)}</div>

      <div class="course-meta">
        <div class="course-meta-item">
          <span class="course-meta-label">Target Date</span>
          <span class="course-meta-value">${formattedDate}</span>
        </div>

        <div class="course-meta-item">
          <span class="course-meta-label">Created</span>
          <span class="course-meta-value">${createdDate}</span>
         </div>

        <div class="course-meta-item">
          <span class="course-meta-label">Status</span>
          <span class="status-badge ${statusClass}">${course.status}</span>
        </div>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary btn-sm edit-btn" data-id="${course.id}">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn" data-id="${course.id}">Remove</button>
      </div>
    </div>
  `;
}

function renderEmptyState() {
  const container = document.getElementById('courses-container');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📚</div>
      <h3>No Courses Yet</h3>
      <p>Start by adding your first course above!</p>
    </div>
  `;
}

function attachCourseEventListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const courseId = parseInt(e.target.dataset.id);
      startEditing(courseId);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const courseId = parseInt(e.target.dataset.id);
      handleDeleteCourse(courseId);
    });
  });

  document.querySelectorAll('[id^="edit-form-"]').forEach(form => {
    form.addEventListener('submit', handleEditCourse);
  });
}

function startEditing(courseId) {
  editingCourseId = courseId;
  renderCourses();
}

window.cancelEdit = function() {
  editingCourseId = null;
  renderCourses();
};

async function handleAddCourse(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const courseData = {
    name: formData.get('name').trim(),
    description: formData.get('description').trim(),
    target_date: formData.get('target_date'),
    status: formData.get('status')
  };

  if (!validateCourse(courseData)) {
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<div class="spinner"></div> Adding...';
  submitBtn.disabled = true;

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const newCourse = await response.json();
    courses.push(newCourse);
    renderCourses();
    form.reset();
    showMessage('Course added successfully!', 'success');
  } catch (error) {
    console.error('Error adding course:', error);
    showMessage(`Failed to add course: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function handleEditCourse(e) {
  e.preventDefault();

  const form = e.target;
  const courseId = parseInt(form.id.replace('edit-form-', ''));
  const formData = new FormData(form);

  const courseData = {
    name: formData.get('name').trim(),
    description: formData.get('description').trim(),
    target_date: formData.get('target_date'),
    status: formData.get('status')
  };

  if (!validateCourse(courseData)) {
    return;
  }

  const saveBtn = form.querySelector('button[type="submit"]');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<div class="spinner"></div> Saving...';
  saveBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const updatedCourse = await response.json();
    courses = courses.map(c => c.id === courseId ? updatedCourse : c);
    editingCourseId = null;
    renderCourses();
    showMessage('Course updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating course:', error);
    showMessage(`Failed to update course: ${error.message}`, 'error');
  } finally {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
}

async function handleDeleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) {
    return;
  }

  const courseCard = document.querySelector(`[data-course-id="${courseId}"]`);
  const deleteBtn = courseCard.querySelector('.delete-btn');
  const originalText = deleteBtn.innerHTML;
  deleteBtn.innerHTML = '<div class="spinner"></div>';
  deleteBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/${courseId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    courses = courses.filter(c => c.id !== courseId);
    renderCourses();
    showMessage('Course deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting course:', error);
    showMessage(`Failed to delete course: ${error.message}`, 'error');
    deleteBtn.innerHTML = originalText;
    deleteBtn.disabled = false;
  }
}

function validateCourse(course) {
  if (!course.name) {
    showMessage('Course name is required', 'error');
    return false;
  }

  if (!course.description) {
    showMessage('Description is required', 'error');
    return false;
  }

  if (!course.target_date) {
    showMessage('Target date is required', 'error');
    return false;
  }

  if (!course.status) {
    showMessage('Status is required', 'error');
    return false;
  }

  return true;
}

function showMessage(message, type = 'success') {
  const container = document.getElementById('message-container');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.innerHTML = `
    <span>${type === 'success' ? '✓' : '✕'}</span>
    <span>${escapeHtml(message)}</span>
  `;

  const existingMessage = container.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }

  container.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusClass(status) {
  const statusMap = {
    'Not Started': 'status-not-started',
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed'
  };
  return statusMap[status] || 'status-not-started';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();
