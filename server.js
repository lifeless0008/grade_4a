const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

app.get('/api/grades', async (req, res) => {
  try {
    const { student_id, course_subject_id, enrollment_id } = req.query;
    let query = 'SELECT * FROM tbl_grades_subject_grade WHERE 1=1';
    const params = [];
    
    if (student_id) {
      params.push(student_id);
      query += ` AND student_id = $${params.length}`;
    }
    if (course_subject_id) {
      params.push(course_subject_id);
      query += ` AND course_subject_id = $${params.length}`;
    }
    if (enrollment_id) {
      params.push(enrollment_id);
      query += ` AND enrollment_id = $${params.length}`;
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

    if (!student_id || !enrollment_id || !course_subject_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, enrollment_id, course_subject_id'
      });
    }
    
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
      message: 'Grade deleted successfully',
      deleted_id: parseInt(id)
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

app.get('/api/grade_inputs', async (req, res) => {
  try {
    const { subject_grade_id, term, input_type } = req.query;
    let query = 'SELECT * FROM tbl_grade_grade_input WHERE 1=1';
    const params = [];
    
    if (subject_grade_id) {
      params.push(subject_grade_id);
      query += ` AND subject_grade_id = $${params.length}`;
    }
    if (term) {
      params.push(term);
      query += ` AND term = $${params.length}`;
    }
    if (input_type) {
      params.push(input_type);
      query += ` AND input_type = $${params.length}`;
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

app.get('/api/grade_inputs/:id', async (req, res) => {
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

app.post('/api/grade_inputs', async (req, res) => {
  try {
    const {
      subject_grade_id,
      input_type,
      input_name,
      score,
      term,
      created_by
    } = req.body;

    if (!subject_grade_id || !input_type || !input_name || score === undefined || !term) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject_grade_id, input_type, input_name, score, term'
      });
    }

    const validInputTypes = ['quiz', 'exam', 'assignment', 'project', 'recitation', 'attendance'];
    if (!validInputTypes.includes(input_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid input_type. Must be one of: ${validInputTypes.join(', ')}`
      });
    }

    const validTerms = ['midterms', 'finals'];
    if (!validTerms.includes(term)) {
      return res.status(400).json({
        success: false,
        message: `Invalid term. Must be either 'midterms' or 'finals'`
      });
    }
    
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


app.put('/api/grade_inputs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { input_type, input_name, score, term } = req.body;

    if (input_type) {
      const validInputTypes = ['quiz', 'exam', 'assignment', 'project', 'recitation', 'attendance'];
      if (!validInputTypes.includes(input_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid input_type. Must be one of: ${validInputTypes.join(', ')}`
        });
      }
    }

    if (term) {
      const validTerms = ['midterms', 'finals'];
      if (!validTerms.includes(term)) {
        return res.status(400).json({
          success: false,
          message: `Invalid term. Must be either 'midterms' or 'finals'`
        });
      }
    }
    
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

app.delete('/api/grade_inputs/:id', async (req, res) => {
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
      message: 'Grade input deleted successfully',
      deleted_id: parseInt(id)
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

app.get('/api/grades/stats/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_subjects,
         ROUND(AVG(subject_grade)::numeric, 2) as average_grade,
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
      student_id: parseInt(student_id),
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

app.get('/api/grade_inputs/summary/:subject_grade_id', async (req, res) => {
  try {
    const { subject_grade_id } = req.params;
    const result = await pool.query(
      `SELECT 
         term,
         COUNT(*) as total_inputs,
         ROUND(AVG(score)::numeric, 2) as average_score,
         MAX(score) as highest_score,
         MIN(score) as lowest_score
       FROM tbl_grade_grade_input
       WHERE subject_grade_id = $1
       GROUP BY term
       ORDER BY term`,
      [subject_grade_id]
    );
    
    res.json({
      success: true,
      subject_grade_id: parseInt(subject_grade_id),
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching input summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching input summary',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Grade API Service - Group 3',
    version: '1.0.0',
    status: 'operational',
    documentation: {
      grades: {
        get_all: 'GET /api/grades (optional: ?student_id=1&course_subject_id=1&enrollment_id=1)',
        get_one: 'GET /api/grades/:id',
        create: 'POST /api/grades',
        update: 'PUT /api/grades/:id',
        delete: 'DELETE /api/grades/:id',
        stats: 'GET /api/grades/stats/:student_id'
      },
      grade_inputs: {
        get_all: 'GET /api/grade_inputs (optional: ?subject_grade_id=1&term=midterms&input_type=quiz)',
        get_one: 'GET /api/grade_inputs/:id',
        create: 'POST /api/grade_inputs',
        update: 'PUT /api/grade_inputs/:id',
        delete: 'DELETE /api/grade_inputs/:id',
        summary: 'GET /api/grade_inputs/summary/:subject_grade_id'
      },
      system: {
        health: 'GET /health',
        docs: 'GET /'
      }
    },
    sample_requests: {
      create_grade: {
        url: 'POST /api/grades',
        body: {
          student_id: 1,
          enrollment_id: 101,
          course_subject_id: 1,
          midterm_grade: 88.5,
          finals_grade: 90.0,
          subject_grade: 89.25,
          remarks: 'Passed',
          finalized_by: 1
        }
      },
      create_input: {
        url: 'POST /api/grade_inputs',
        body: {
          subject_grade_id: 1,
          input_type: 'quiz',
          input_name: 'Quiz 3',
          score: 48.5,
          term: 'finals',
          created_by: 1
        }
      }
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    requested_url: req.originalUrl,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Grade API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
