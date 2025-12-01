-- Create tbl_grades_subject_grade table
CREATE TABLE IF NOT EXISTS tbl_grades_subject_grade (
    subject_grade_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    enrollment_id INTEGER NOT NULL,
    course_subject_id INTEGER NOT NULL,
    midterm_grade DECIMAL(5,2),
    finals_grade DECIMAL(5,2),
    subject_grade DECIMAL(5,2),
    remarks TEXT,
    finalized_by INTEGER,
    finalized_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tbl_grade_grade_input table
CREATE TABLE IF NOT EXISTS tbl_grade_grade_input (
    grade_input_id SERIAL PRIMARY KEY,
    subject_grade_id INTEGER NOT NULL REFERENCES tbl_grades_subject_grade(subject_grade_id) ON DELETE CASCADE,
    input_type VARCHAR(50) NOT NULL CHECK (input_type IN ('quiz', 'exam', 'assignment', 'project', 'recitation', 'attendance')),
    input_name VARCHAR(255) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    term VARCHAR(20) NOT NULL CHECK (term IN ('midterms', 'finals')),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_grades_student ON tbl_grades_subject_grade(student_id);
CREATE INDEX idx_grades_course ON tbl_grades_subject_grade(course_subject_id);
CREATE INDEX idx_grade_inputs_subject ON tbl_grade_grade_input(subject_grade_id);
CREATE INDEX idx_grade_inputs_term ON tbl_grade_grade_input(term);

-- Insert sample data
INSERT INTO tbl_grades_subject_grade 
(student_id, enrollment_id, course_subject_id, midterm_grade, finals_grade, subject_grade, remarks, finalized_by, finalized_at)
VALUES 
(1, 101, 1, 85.5, 88.0, 86.75, 'Passed', 1, NOW()),
(2, 102, 1, 92.0, 94.5, 93.25, 'Passed', 1, NOW()),
(3, 103, 2, 78.0, 82.0, 80.0, 'Passed', 1, NOW());

INSERT INTO tbl_grade_grade_input 
(subject_grade_id, input_type, input_name, score, term, created_by)
VALUES 
(1, 'quiz', 'Quiz 1', 45.0, 'midterms', 1),
(1, 'exam', 'Midterm Exam', 85.0, 'midterms', 1),
(1, 'quiz', 'Quiz 2', 48.0, 'finals', 1),
(2, 'quiz', 'Quiz 1', 50.0, 'midterms', 1),
(2, 'assignment', 'Programming Assignment 1', 95.0, 'midterms', 1);

-- Success message
SELECT 'Database initialized successfully!' as message;