-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL,
    is_email_verified INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reset_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SUBJECTS TABLE
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- TOPICS TABLE
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(subject_id, name)
);

-- TESTS TABLE
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    pattern VARCHAR(100),
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    attempt_limit INTEGER DEFAULT 1,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUESTIONS TABLE
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    question_type VARCHAR(30) CHECK (question_type IN ('mcq_single', 'mcq_multiple', 'true_false', 'short_answer', 'fill_blank')) NOT NULL,
    content TEXT NOT NULL,
    difficulty VARCHAR(20),
    explanation TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TEST_QUESTIONS (MANY-TO-MANY: TESTS <-> QUESTIONS)
CREATE TABLE IF NOT EXISTS test_questions (
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER,
    PRIMARY KEY (test_id, question_id)
);

-- QUESTION_OPTIONS (FOR MCQ/TRUE_FALSE)
CREATE TABLE question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- ASSIGNMENTS (TESTS ASSIGNED TO STUDENTS/GROUPS)
CREATE TABLE IF NOT EXISTS test_assignments (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('assigned', 'started', 'completed')) DEFAULT 'assigned',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    attempt_limit INTEGER DEFAULT 1
);

-- TEST_ATTEMPTS (EACH STUDENT'S ATTEMPT)
CREATE TABLE IF NOT EXISTS test_attempts (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    score NUMERIC,
    is_graded BOOLEAN DEFAULT FALSE
);

-- ATTEMPT_ANSWERS (ANSWERS GIVEN BY STUDENT)
CREATE TABLE IF NOT EXISTS attempt_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_ids INTEGER[], -- For MCQ/True/False
    answer_text TEXT,              -- For short answer/fill in the blank
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MANUAL REVIEWS (FOR SUBJECTIVE QUESTIONS)
CREATE TABLE IF NOT EXISTS manual_reviews (
    id SERIAL PRIMARY KEY,
    attempt_answer_id INTEGER REFERENCES attempt_answers(id) ON DELETE CASCADE,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    score NUMERIC,
    feedback TEXT,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ANALYTICS (AGGREGATED PERFORMANCE DATA)
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    total_attempts INTEGER DEFAULT 0,
    avg_score NUMERIC,
    last_attempt_at TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- FEEDBACK & IMPROVEMENT SUGGESTIONS
CREATE TABLE IF NOT EXISTS improvement_suggestions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    suggestion TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOG (OPTIONAL, FOR SECURITY/INTEGRITY)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);