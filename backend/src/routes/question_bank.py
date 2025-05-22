from flask import Blueprint, app, request, jsonify, g
from werkzeug.utils import secure_filename
import sqlite3
import os
import csv
import io
from functools import wraps
from datetime import datetime

DATABASE = 'user_management.db'

question_bank = Blueprint('question_bank', __name__)

# --- AUTH DECORATORS (reuse from user_management) ---
def get_db():
    from flask import current_app, g
    db = getattr(g, '_database', None)
    if db is None:
        db_name = current_app.config.get('DATABASE', DATABASE)
        db = g._database = sqlite3.connect(db_name, detect_types=sqlite3.PARSE_DECLTYPES)
        db.row_factory = sqlite3.Row
    return db

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import request, jsonify, g, current_app
        import jwt
        auth = request.headers.get('Authorization', None)
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'message': 'Unauthorized'}), 401
        token = auth.split(' ')[1]
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        except Exception:
            return jsonify({'message': 'Unauthorized'}), 401
        g.user = payload
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import g, jsonify
        if not hasattr(g, 'user') or g.user.get('role') not in ['admin', 'teacher']:
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# --- HELPERS ---
def question_row_to_dict(row):
    return {
        'id': row['id'],
        'subject_id': row['subject_id'],
        'topic_id': row['topic_id'],
        'question_type': row['question_type'],
        'content': row['content'],
        'difficulty': row['difficulty'],
        'explanation': row['explanation'],
        'options': [],  # To be filled below
    }

def get_options_for_question(db, question_id):
    options = db.execute('SELECT id, option_text, is_correct FROM question_options WHERE question_id = ?', (question_id,)).fetchall()
    return [{'id': o['id'], 'option_text': o['option_text'], 'is_correct': bool(o['is_correct'])} for o in options]

# --- ENDPOINTS ---
@question_bank.route('/api/v1/questions', methods=['POST'])
@login_required
@admin_required
def add_question():
    data = request.get_json()
    db = get_db()
    q = data
    cur = db.execute(
        'INSERT INTO questions (subject_id, topic_id, question_type, content, difficulty, explanation, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (q.get('subject_id'), q.get('topic_id'), q.get('question_type'), q.get('content'), q.get('difficulty'), q.get('explanation'), g.user['user_id'])
    )
    question_id = cur.lastrowid
    print(f"Inserted question_id: {question_id}")
    # Update id column to match rowid if needed
    db.execute('UPDATE questions SET id = ? WHERE rowid = ?', (question_id, question_id))
    # Insert options if present
    options = q.get('options', [])
    for opt in options:
        db.execute('INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                   (question_id, opt.get('option_text'), opt.get('is_correct', False)))
    db.commit()
    # Check if question is in DB
    question_check = db.execute('SELECT * FROM questions WHERE id = ?', (question_id,)).fetchone()
    print(f"Question row: {dict(question_check) if question_check else None}")
    # Check if options are in DB
    options_check = db.execute('SELECT * FROM question_options WHERE question_id = ?', (question_id,)).fetchall()
    print(f"Options rows: {[dict(row) for row in options_check]}")
    question = db.execute('SELECT * FROM questions WHERE id = ?', (question_id,)).fetchone()
    if not question:
        return jsonify({'message': 'Question not found after insert'}), 500
    result = question_row_to_dict(question)
    result['options'] = get_options_for_question(db, question_id)
    return jsonify(result), 201

@question_bank.route('/api/v1/questions', methods=['GET'])
@login_required
@admin_required
def get_questions():
    db = get_db()
    query = 'SELECT * FROM questions WHERE 1=1'
    params = []
    for key in ['subject_id', 'topic_id', 'difficulty', 'question_type']:
        val = request.args.get(key)
        if val:
            query += f' AND {key} = ?'
            params.append(val)
    if request.args.get('search'):
        query += ' AND content LIKE ?'
        params.append(f"%{request.args['search']}%")
    questions = db.execute(query, params).fetchall()
    result = []
    for q in questions:
        qd = question_row_to_dict(q)
        qd['options'] = get_options_for_question(db, q['id'])
        result.append(qd)
    return jsonify(result), 200

@question_bank.route('/api/v1/questions/<int:question_id>', methods=['GET'])
@login_required
@admin_required
def get_question(question_id):
    db = get_db()
    q = db.execute('SELECT * FROM questions WHERE id = ?', (question_id,)).fetchone()
    if not q:
        return jsonify({'message': 'Question not found'}), 404
    qd = question_row_to_dict(q)
    qd['options'] = get_options_for_question(db, question_id)
    return jsonify(qd), 200

@question_bank.route('/api/v1/questions/<int:question_id>', methods=['PUT'])
@login_required
@admin_required
def update_question(question_id):
    data = request.get_json()
    db = get_db()
    q = db.execute('SELECT * FROM questions WHERE id = ?', (question_id,)).fetchone()
    if not q:
        return jsonify({'message': 'Question not found'}), 404
    db.execute('UPDATE questions SET subject_id=?, topic_id=?, question_type=?, content=?, difficulty=?, explanation=? WHERE id=?',
               (data.get('subject_id'), data.get('topic_id'), data.get('question_type'), data.get('content'), data.get('difficulty'), data.get('explanation'), question_id))
    db.execute('DELETE FROM question_options WHERE question_id = ?', (question_id,))
    for opt in data.get('options', []):
        db.execute('INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                   (question_id, opt.get('option_text'), opt.get('is_correct', False)))
    db.commit()
    q = db.execute('SELECT * FROM questions WHERE id = ?', (question_id,)).fetchone()
    qd = question_row_to_dict(q)
    qd['options'] = get_options_for_question(db, question_id)
    return jsonify(qd), 200

@question_bank.route('/api/v1/questions/<int:question_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_question(question_id):
    db = get_db()
    q = db.execute('SELECT * FROM questions WHERE id = ?', (question_id,)).fetchone()
    if not q:
        return jsonify({'message': 'Question not found'}), 404
    db.execute('DELETE FROM questions WHERE id = ?', (question_id,))
    db.commit()
    return '', 204

@question_bank.route('/api/v1/questions/bulk-upload', methods=['POST'])
@login_required
@admin_required
def bulk_upload():
    if 'file' not in request.files:
        return jsonify({'message': 'No file uploaded'}), 400
    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({'message': 'Only CSV files supported'}), 400
    db = get_db()
    stream = io.StringIO(file.stream.read().decode('utf-8'))
    reader = csv.DictReader(stream)
    success, errors = 0, []
    for i, row in enumerate(reader, 2):
        try:
            cur = db.execute(
                'INSERT INTO questions (subject_id, topic_id, question_type, content, difficulty, explanation, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (row['subject_id'], row['topic_id'], row['question_type'], row['content'], row['difficulty'], row['explanation'], g.user['user_id'])
            )
            question_id = cur.lastrowid
            # Update id column to match rowid if needed
            db.execute('UPDATE questions SET id = ? WHERE rowid = ?', (question_id, question_id))
            # Parse options (assume JSON string or semicolon-separated)
            options = row.get('options', '')
            if options:
                import json
                try:
                    opts = json.loads(options)
                except Exception:
                    opts = [o.strip() for o in options.split(';') if o.strip()]
                    opts = [{'option_text': o, 'is_correct': False} for o in opts]
                for opt in opts:
                    db.execute('INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                               (question_id, opt.get('option_text'), opt.get('is_correct', False)))
            success += 1
        except Exception as e:
            errors.append({'row': i, 'message': str(e)})
    db.commit()
    return jsonify({'success_count': success, 'error_count': len(errors), 'errors': errors, 'summary': f"{success} questions added, {len(errors)} errors found."}), 200
