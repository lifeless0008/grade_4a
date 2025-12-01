// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/grade_api',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});


// Get all grades
app.get('/api/grades', async (req, res) => {
  try {
    const { student_id, course_subject_id } = req.query;
    let query = 'SELECT * FROM tbl_grades_subject_grade';
    const params = [];
    
    if (student_id || course_subject_id) {
      query += ' WHERE';
      if (student_id) {
        params.push(student_id);
        query += ` student_id = $${params.length}`;
      }
      if (course_subject_id) {
        if (params.length > 0) query += ' AND';
        params.push(course_subject_id);
        query += ` course_subject_id = $${params.length}`;
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grades',
      error: error.message
    });
  }
});

// Get single grade by ID
app.get('/api/grades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tbl_grades_subject_grade WHERE subject_grade_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grade',
      error: error.message
    });
  }
});

// Create new grade
app.post('/api/grades', async (req, res) => {
  try {
    const {
      student_id,
      enrollment_id,
      course_subject_id,
      midterm_grade,
      finals_grade,
      subject_grade,
      remarks,
      finalized_by
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO tbl_grades_subject_grade 
       (student_id, enrollment_id, course_subject_id, midterm_grade, finals_grade, 
        subject_grade, remarks, finalized_by, finalized_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
       RETURNING *`,
      [student_id, enrollment_id, course_subject_id, midterm_grade, finals_grade, 
       subject_grade, remarks, finalized_by]
    );
    
    res.status(201).json({
      success: true,
      message: 'Grade created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating grade',
      error: error.message
    });
  }
});

// Update grade
app.put('/api/grades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      student_id,
      enrollment_id,
      course_subject_id,
      midterm_grade,
      finals_grade,
      subject_grade,
      remarks,
      finalized_by
    } = req.body;
    
    const result = await pool.query(
      `UPDATE tbl_grades_subject_grade 
       SET student_id = COALESCE($1, student_id),
           enrollment_id = COALESCE($2, enrollment_id),
           course_subject_id = COALESCE($3, course_subject_id),
           midterm_grade = COALESCE($4, midterm_grade),
           finals_grade = COALESCE($5, finals_grade),
           subject_grade = COALESCE($6, subject_grade),
           remarks = COALESCE($7, remarks),
           finalized_by = COALESCE($8, finalized_by),
           finalized_at = NOW(),
           updated_at = NOW()
       WHERE subject_grade_id = $9
       RETURNING *`,
      [student_id, enrollment_id, course_subject_id, midterm_grade, finals_grade,
       subject_grade, remarks, finalized_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Grade updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating grade',
      error: error.message
    });
  }
});

// Delete grade
app.delete('/api/grades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM tbl_grades_subject_grade WHERE subject_grade_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting grade',
      error: error.message
    });
  }
});

// Get all grade inputs
app.get('/api/grade-inputs', async (req, res) => {
  try {
    const { subject_grade_id, term } = req.query;
    let query = 'SELECT * FROM tbl_grade_grade_input';
    const params = [];
    
    if (subject_grade_id || term) {
      query += ' WHERE';
      if (subject_grade_id) {
        params.push(subject_grade_id);
        query += ` subject_grade_id = $${params.length}`;
      }
      if (term) {
        if (params.length > 0) query += ' AND';
        params.push(term);
        query += ` term = $${params.length}`;
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching grade inputs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grade inputs',
      error: error.message
    });
  }
});

// Get single grade input
app.get('/api/grade-inputs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tbl_grade_grade_input WHERE grade_input_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade input not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching grade input:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grade input',
      error: error.message
    });
  }
});

// Create grade input
app.post('/api/grade-inputs', async (req, res) => {
  try {
    const {
      subject_grade_id,
      input_type,
      input_name,
      score,
      term,
      created_by
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO tbl_grade_grade_input 
       (subject_grade_id, input_type, input_name, score, term, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [subject_grade_id, input_type, input_name, score, term, created_by]
    );
    
    res.status(201).json({
      success: true,
      message: 'Grade input created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating grade input:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating grade input',
      error: error.message
    });
  }
});

// Update grade input
app.put('/api/grade-inputs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { input_type, input_name, score, term } = req.body;
    
    const result = await pool.query(
      `UPDATE tbl_grade_grade_input 
       SET input_type = COALESCE($1, input_type),
           input_name = COALESCE($2, input_name),
           score = COALESCE($3, score),
           term = COALESCE($4, term),
           updated_at = NOW()
       WHERE grade_input_id = $5
       RETURNING *`,
      [input_type, input_name, score, term, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade input not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Grade input updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating grade input:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating grade input',
      error: error.message
    });
  }
});

// Delete grade input
app.delete('/api/grade-inputs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM tbl_grade_grade_input WHERE grade_input_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade input not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Grade input deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting grade input:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting grade input',
      error: error.message
    });
  }
});

// Get grade statistics
app.get('/api/grades/stats/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_subjects,
         AVG(subject_grade) as average_grade,
         MAX(subject_grade) as highest_grade,
         MIN(subject_grade) as lowest_grade,
         COUNT(CASE WHEN remarks = 'Passed' THEN 1 END) as passed_count,
         COUNT(CASE WHEN remarks = 'Failed' THEN 1 END) as failed_count
       FROM tbl_grades_subject_grade
       WHERE student_id = $1`,
      [student_id]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Grade API Service',
    version: '1.0.0',
    endpoints: {
      grades: {
        getAll: 'GET /api/grades',
        getOne: 'GET /api/grades/:id',
        create: 'POST /api/grades',
        update: 'PUT /api/grades/:id',
        delete: 'DELETE /api/grades/:id',
        stats: 'GET /api/grades/stats/:student_id'
      },
      gradeInputs: {
        getAll: 'GET /api/grade-inputs',
        getOne: 'GET /api/grade-inputs/:id',
        create: 'POST /api/grade-inputs',
        update: 'PUT /api/grade-inputs/:id',
        delete: 'DELETE /api/grade-inputs/:id'
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Grade API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
});

module.exports = app;