from flask import Flask, request, jsonify, g, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import datetime
import base64
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
import logging

try:
    import jwt  # PyJWT
except ImportError:
    raise ImportError("PyJWT is required. Install with 'pip install PyJWT'.")

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
DATABASE = 'user_management.db'

from question_bank import question_bank
app.register_blueprint(question_bank)

from test_management import test_management
app.register_blueprint(test_management)

@app.before_request
def log_request_info():
    app.logger.debug(f'Request: {request.method} {request.url}')
    app.logger.debug(f'Headers: {dict(request.headers)}')
    app.logger.debug(f'Body: {request.get_data()}')

@app.after_request
def log_response_info(response):
    app.logger.debug(f'Response status: {response.status}')
    app.logger.debug(f'Response data: {response.get_data(as_text=True)}')
    return response

# --- DB UTILS ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        # Set the database name from current_app.config['DATABASE'] if available, else fallback
        db_name = current_app.config.get('DATABASE', DATABASE)
        db = g._database = sqlite3.connect(db_name, detect_types=sqlite3.PARSE_DECLTYPES)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        try:
            with open('/Users/mihirjha/Documents/coding/begining/dbSchema.sql', 'r') as f:
                db.executescript(f.read())
            db.commit()
        except sqlite3.OperationalError as e:
            if "already exists" in str(e):
                pass  # Ignore if tables already exist
            else:
                raise

# --- JWT UTILS ---
def generate_jwt(user):
    payload = {
        'user_id': user['id'],
        'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    # PyJWT 2.x returns a string, 1.x returns bytes
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token

def decode_jwt(token):
    try:
        return jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
    except Exception:
        return None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', None)
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'message': 'Unauthorized'}), 401
        token = auth.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({'message': 'Unauthorized'}), 401
        g.user = payload
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, 'user') or g.user.get('role') != 'admin':
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# --- EMAIL UTILS (MOCK) ---
def send_verification_email(email, token):
    verification_link = f"http://localhost:5000/auth/verify-email?token={token}"
    print(f"[MOCK] Verification email to {email}: {verification_link}")

def send_password_reset_email(email, token):
    reset_link = f"http://localhost:5000/auth/reset-password?token={token}"
    print(f"[MOCK] Password reset email to {email}: {reset_link}")

# --- HELPERS ---
def user_row_to_dict(row):
    return {
        'id': row['id'],
        'email': row['email'],
        'name': row['name'],
        'role': row['role'],
        'is_email_verified': bool(row['is_email_verified']),
        'created_at': row['created_at'],
        'updated_at': row['updated_at']
    }

# --- ENDPOINTS ---

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    if not email or not password or not role:
        return jsonify({'message': 'Missing required fields'}), 400
    db = get_db()
    if db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone():
        return jsonify({'message': 'User already exists'}), 400
    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
    now = datetime.datetime.utcnow()
    db.execute(
        'INSERT INTO users (email, password_hash, role, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        (email, hashed_password, role, False, now, now)
    )
    db.commit()
    # Generate verification token (mock: base64)
    token = base64.urlsafe_b64encode(f"{email}:{os.urandom(8).hex()}".encode()).decode()
    send_verification_email(email, token)
    # Store token in DB (optional, for real expiry logic)
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/auth/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    token = data.get('token')
    if not token:
        return jsonify({'message': 'Missing token'}), 400
    try:
        decoded = base64.urlsafe_b64decode(token).decode()
        email, _ = decoded.split(':')
    except Exception:
        return jsonify({'message': 'Invalid or expired token'}), 400
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    db.execute('UPDATE users SET is_email_verified = 1, updated_at = ? WHERE email = ?', (datetime.datetime.utcnow(), email))
    db.commit()
    return jsonify({'message': 'Email verified successfully'}), 200

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'message': 'Invalid credentials'}), 401
    if not user['is_email_verified']:
        return jsonify({'message': 'Please verify your email'}), 401
    token = generate_jwt(user)
    return jsonify({'token': token}), 200

@app.route('/auth/login', methods=['OPTIONS'])
def login_options():
    return '', 200

@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Missing email'}), 400
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    # Generate reset token (mock: base64)
    token = base64.urlsafe_b64encode(f"{email}:{os.urandom(8).hex()}".encode()).decode()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    db.execute(
        'INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, ?)',
        (user['id'], token, expires_at)
    )
    db.commit()
    send_password_reset_email(email, token)
    return jsonify({'message': 'Password reset link sent'}), 200

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('resetToken')
    new_password = data.get('newPassword')
    if not token or not new_password:
        return jsonify({'message': 'Missing required fields'}), 400
    db = get_db()
    reset = db.execute(
        'SELECT * FROM password_resets WHERE reset_token = ?', (token,)
    ).fetchone()
    if not reset or reset['expires_at'] < datetime.datetime.utcnow():
        return jsonify({'message': 'Invalid or expired reset token'}), 400
    user = db.execute('SELECT * FROM users WHERE id = ?', (reset['user_id'],)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    hashed_password = generate_password_hash(new_password, method="pbkdf2:sha256")
    db.execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', (hashed_password, datetime.datetime.utcnow(), user['id']))
    db.execute('DELETE FROM password_resets WHERE id = ?', (reset['id'],))
    db.commit()
    return jsonify({'message': 'Password reset successful'}), 200

@app.route('/users/profile', methods=['GET'])
@login_required
def get_profile():
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (g.user['user_id'],)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user_row_to_dict(user)), 200

@app.route('/users/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    name = data.get('name')
    password = data.get('password')
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (g.user['user_id'],)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    updates = []
    params = []
    if name:  
        updates.append('name = ?')
        params.append(name)
    if password:
        updates.append('password_hash = ?')
        params.append(generate_password_hash(password, method="pbkdf2:sha256"))
    if not updates:
        return jsonify({'message': 'No fields to update'}), 400
    updates.append('updated_at = ?')
    params.append(datetime.datetime.utcnow())
    params.append(user['id'])
    db.execute(f'UPDATE users SET {", ".join(updates)} WHERE id = ?', params)
    db.commit()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user['id'],)).fetchone()
    return jsonify(user_row_to_dict(user)), 200

@app.route('/users/profile', methods=['DELETE'])
@login_required
def delete_profile():
    db = get_db()
    db.execute('DELETE FROM users WHERE id = ?', (g.user['user_id'],))
    db.commit()
    return jsonify({'message': 'User deleted successfully'}), 200

# --- ADMIN ENDPOINTS ---

@app.route('/users', methods=['GET'])
@login_required
@admin_required
def list_users():
    db = get_db()
    users = db.execute('SELECT * FROM users').fetchall()
    return jsonify([user_row_to_dict(u) for u in users]), 200

@app.route('/users/<int:user_id>', methods=['GET'])
@login_required
@admin_required
def get_user_by_id(user_id):
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user_row_to_dict(user)), 200

@app.route('/users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user_by_id(user_id):
    data = request.get_json()
    name = data.get('name')
    password = data.get('password')
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    updates = []
    params = []
    if name:
        updates.append('name = ?')
        params.append(name)
    if password:
        updates.append('password_hash = ?')
        params.append(generate_password_hash(password, method="pbkdf2:sha256"))
    if not updates:
        return jsonify({'message': 'No fields to update'}), 400
    updates.append('updated_at = ?')
    params.append(datetime.datetime.utcnow())
    params.append(user_id)
    db.execute(f'UPDATE users SET {", ".join(updates)} WHERE id = ?', params)
    db.commit()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    return jsonify(user_row_to_dict(user)), 200

@app.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user_by_id(user_id):
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    db.execute('DELETE FROM users WHERE id = ?', (user_id,))
    db.commit()
    return jsonify({'message': 'User deleted successfully'}), 200

# --- INIT DB (for development only) ---
@app.cli.command('init-db')
def cli_init_db():
    init_db()
    print("Database initialized.")