from flask import Blueprint, request, jsonify, g, current_app
from functools import wraps
import sqlite3
from datetime import datetime

# --- Blueprint ---
test_management = Blueprint('test_management', __name__)

# --- DB Helper ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db_name = current_app.config.get('DATABASE', 'user_management.db')
        db = g._database = sqlite3.connect(db_name, detect_types=sqlite3.PARSE_DECLTYPES)
        db.row_factory = sqlite3.Row
    return db

# --- Auth Decorators (reuse from user_management) ---
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', None)
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'message': 'Unauthorized'}), 401
        token = auth.split(' ')[1]
        from user_management import decode_jwt
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'message': 'Unauthorized'}), 401
        g.user = payload
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, 'user') or g.user.get('role') not in ['admin', 'teacher']:
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# --- API Endpoints ---
# 1. Create Test
@test_management.route('/api/v1/tests', methods=['POST'])
@login_required
@admin_required
def create_test():
    data = request.get_json()
    db = get_db()
    now = datetime.utcnow()
    cur = db.execute(
        'INSERT INTO tests (name, subject_id, pattern, duration_minutes, start_time, end_time, attempt_limit, is_published, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (
            data.get('name'),
            data.get('subject_id'),
            data.get('pattern'),
            data.get('duration_minutes'),
            data.get('start_time'),
            data.get('end_time'),
            data.get('attempt_limit'),
            data.get('is_published', False),
            g.user['user_id'],
            now
        )
    )
    test_id = cur.lastrowid
    db.execute('UPDATE tests SET id = ? WHERE rowid = ?', (test_id, test_id))
    # Insert test_questions
    for qid in data.get('question_ids', []):
        cur_q = db.execute('INSERT INTO test_questions (test_id, question_id) VALUES (?, ?)', (test_id, qid))
        tq_id = cur_q.lastrowid
        #db.execute('UPDATE test_questions SET id = ? WHERE rowid = ?', (tq_id, tq_id))
    db.commit()
    return jsonify({'id': test_id, 'message': 'Test created successfully'}), 201

# 2. Get All Tests
@test_management.route('/api/v1/tests', methods=['GET'])
@login_required
def get_tests():
    db = get_db()
    role = g.user.get('role')
    user_id = g.user.get('user_id')
    if role in ['admin', 'teacher']:
        tests = db.execute('SELECT * FROM tests').fetchall()
    else:
        # For students, only assigned/available tests
        tests = db.execute('''SELECT t.* FROM tests t
            JOIN test_assignments ta ON t.id = ta.test_id
            WHERE ta.user_id = ?''', (user_id,)).fetchall()
    result = [dict(row) for row in tests]
    return jsonify(result), 200

# 3. Get Test Details
@test_management.route('/api/v1/tests/<int:test_id>', methods=['GET'])
@login_required
def get_test(test_id):
    db = get_db()
    test = db.execute('SELECT * FROM tests WHERE id = ?', (test_id,)).fetchone()
    if not test:
        return jsonify({'message': 'Test not found'}), 404
    # Get questions
    questions = db.execute('''SELECT q.* FROM questions q
        JOIN test_questions tq ON q.id = tq.question_id
        WHERE tq.test_id = ?''', (test_id,)).fetchall()
    test_dict = dict(test)
    test_dict['questions'] = [dict(q) for q in questions]
    return jsonify(test_dict), 200

# 4. Update Test
@test_management.route('/api/v1/tests/<int:test_id>', methods=['PUT'])
@login_required
@admin_required
def update_test(test_id):
    data = request.get_json()
    db = get_db()
    test = db.execute('SELECT * FROM tests WHERE id = ?', (test_id,)).fetchone()
    if not test:
        return jsonify({'message': 'Test not found'}), 404
    updates = []
    params = []
    for field in ['name', 'pattern', 'duration_minutes', 'start_time', 'end_time', 'attempt_limit', 'is_published']:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])
    if updates:
        params.append(test_id)
        db.execute(f'UPDATE tests SET {", ".join(updates)} WHERE id = ?', params)
    # Update questions if provided
    if 'question_ids' in data:
        db.execute('DELETE FROM test_questions WHERE test_id = ?', (test_id,))
        for qid in data['question_ids']:
            cur_q = db.execute('INSERT INTO test_questions (test_id, question_id) VALUES (?, ?)', (test_id, qid))
            tq_id = cur_q.lastrowid
            #db.execute('UPDATE test_questions SET id = ? WHERE rowid = ?', (tq_id, tq_id))
    db.commit()
    return jsonify({'message': 'Test updated successfully'}), 200

# 5. Delete Test
@test_management.route('/api/v1/tests/<int:test_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_test(test_id):
    db = get_db()
    test = db.execute('SELECT * FROM tests WHERE id = ?', (test_id,)).fetchone()
    if not test:
        return jsonify({'message': 'Test not found'}), 404
    db.execute('DELETE FROM test_questions WHERE test_id = ?', (test_id,))
    db.execute('DELETE FROM test_assignments WHERE test_id = ?', (test_id,))
    db.execute('DELETE FROM tests WHERE id = ?', (test_id,))
    db.commit()
    return '', 204

# 6. Assign Test
@test_management.route('/api/v1/tests/<int:test_id>/assign', methods=['POST'])
@login_required
@admin_required
def assign_test(test_id):
    data = request.get_json()
    db = get_db()
    test = db.execute('SELECT * FROM tests WHERE id = ?', (test_id,)).fetchone()
    if not test:
        return jsonify({'message': 'Test not found'}), 404
    # Assign to users
    for uid in data.get('user_ids', []): 
        cur_a = db.execute('INSERT INTO test_assignments (test_id, user_id, start_time, end_time, attempt_limit) VALUES (?, ?, ?, ?, ?)',
                   (test_id, uid, data.get('start_time'), data.get('end_time'), data.get('attempt_limit')))
        assign_id = cur_a.lastrowid
        db.execute('UPDATE test_assignments SET id = ? WHERE rowid = ?', (assign_id, assign_id))
    # Assign to groups (not implemented, placeholder)
    # for gid in data.get('group_ids', []): ...
    db.commit()
    return jsonify({'message': 'Test assigned successfully'}), 200

# 7. Get Questions for Test
@test_management.route('/api/v1/tests/<int:test_id>/questions', methods=['GET'])
@login_required
def get_test_questions(test_id):
    from question_bank import get_options_for_question
    db = get_db()
    questions = db.execute('''SELECT q.* FROM questions q
        JOIN test_questions tq ON q.id = tq.question_id
        WHERE tq.test_id = ?''', (test_id,)).fetchall()
    result = []
    for q in questions:
        qd = dict(q)
        qd['options'] = get_options_for_question(db, q['id'])
        result.append(qd)
    return jsonify(result), 200

# 8. Start/Submit Test Attempt
@test_management.route('/api/v1/tests/<int:test_id>/attempt', methods=['POST'])
@login_required
def attempt_test(test_id):
    data = request.get_json() or {}
    db = get_db()
    user_id = g.user['user_id']
    # Check if already attempted (enforce attempt_limit elsewhere)
    attempt = db.execute('SELECT * FROM test_attempts WHERE test_id = ? AND user_id = ?', (test_id, user_id)).fetchone()
    if attempt:
        return jsonify({'message': 'Already attempted'}), 400
    now = datetime.utcnow()
    answers = data.get('answers', [])
    cur = db.execute('INSERT INTO test_attempts (test_id, user_id, started_at, submitted_at, answers) VALUES (?, ?, ?, ?, ?)',
                     (test_id, user_id, now, now, str(answers)))
    attempt_id = cur.lastrowid
    db.execute('UPDATE test_attempts SET id = ? WHERE rowid = ?', (attempt_id, attempt_id))
    # Scoring logic placeholder
    db.commit()
    return jsonify({'attempt_id': attempt_id, 'message': 'Attempt submitted successfully'}), 200

# 9. Get Student's Attempt for Test
@test_management.route('/api/v1/tests/<int:test_id>/attempt', methods=['GET'])
@login_required
def get_test_attempt(test_id):
    db = get_db()
    user_id = g.user['user_id']
    attempt = db.execute('SELECT * FROM test_attempts WHERE test_id = ? AND user_id = ?', (test_id, user_id)).fetchone()
    if not attempt:
        return jsonify({'message': 'No attempt found'}), 404
    return jsonify(dict(attempt)), 200

# 10. Get Test Results
@test_management.route('/api/v1/tests/<int:test_id>/results', methods=['GET'])
@login_required
def get_test_results(test_id):
    db = get_db()
    role = g.user.get('role')
    user_id = g.user.get('user_id')
    if role in ['admin', 'teacher']:
        results = db.execute('SELECT * FROM test_attempts WHERE test_id = ?', (test_id,)).fetchall()
    else:
        results = db.execute('SELECT * FROM test_attempts WHERE test_id = ? AND user_id = ?', (test_id, user_id)).fetchall()
    return jsonify([dict(r) for r in results]), 200

# 11. Get Test Analytics
@test_management.route('/api/v1/tests/<int:test_id>/analytics', methods=['GET'])
@login_required
@admin_required
def get_test_analytics(test_id):
    db = get_db()
    # Basic analytics: avg, min, max, total attempts
    stats = db.execute('SELECT AVG(score) as avg_score, MAX(score) as max_score, MIN(score) as min_score, COUNT(*) as total_attempts FROM test_attempts WHERE test_id = ?', (test_id,)).fetchone()
    # Per-question stats placeholder
    return jsonify({
        'test_id': test_id,
        'average_score': stats['avg_score'],
        'highest_score': stats['max_score'],
        'lowest_score': stats['min_score'],
        'total_attempts': stats['total_attempts'],
        'question_stats': [],
        'topic_stats': []
    }), 200
