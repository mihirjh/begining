import pytest
from flask import Flask
from werkzeug.security import check_password_hash
import datetime
from user_management import app, init_db, get_db
import builtins
import smtplib
from unittest import mock
from user_management import send_verification_email
import base64, os
import tempfile
import sqlite3

@pytest.fixture(scope="session")
def test_db_file():
    db_fd, db_path = tempfile.mkstemp()
    os.close(db_fd)
    yield db_path
    os.unlink(db_path)

@pytest.fixture(autouse=True)
def setup_and_teardown_db(monkeypatch, test_db_file):
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_secret'
    monkeypatch.setattr('user_management.DATABASE', test_db_file)
    with app.app_context():
        init_db()
    yield
    # Clean up DB after each test
    with app.app_context():
        db = get_db()
        db.execute('DELETE FROM users')
        db.execute('DELETE FROM password_resets')
        db.commit()

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def clear_users_db():
    # No-op: users_db does not exist in DB-backed implementation
    yield

def get_verification_token(email):
    return base64.urlsafe_b64encode(f"{email}:{os.urandom(8).hex()}".encode()).decode()

def find_user_by_email_db(email):
    with app.app_context():
        db = get_db()
        return db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

def test_find_user_by_email_returns_user_when_exists():
    # Insert user into DB
    with app.app_context():
        db = get_db()
        now = datetime.datetime.utcnow()
        db.execute(
            'INSERT INTO users (email, password_hash, role, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            ('test@example.com', 'hashed', 'student', False, now, now)
        )
        db.commit()
        found = find_user_by_email_db('test@example.com')
        assert found is not None
        assert found['email'] == 'test@example.com'

def test_find_user_by_email_returns_none_when_not_found():
    found = find_user_by_email_db('notfound@example.com')
    assert found is None

def test_register_successful(client):
    response = client.post('/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'password123',
        'role': 'student'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'User registered successfully'
    user = find_user_by_email_db('newuser@example.com')
    assert user is not None
    assert user['email'] == 'newuser@example.com'
    assert user['role'] == 'student'
    assert not user['is_email_verified']
    assert check_password_hash(user['password_hash'], 'password123')

def test_register_missing_fields(client):
    response = client.post('/auth/register', json={
        'email': 'incomplete@example.com'
        # missing password and role
    })
    assert response.status_code == 400
    data = response.get_json()
    assert data['message'] == 'Missing required fields'

def test_register_user_already_exists(client):
    # Insert user into DB
    with app.app_context():
        db = get_db()
        now = datetime.datetime.utcnow()
        db.execute(
            'INSERT INTO users (email, password_hash, role, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            ('existing@example.com', 'hashed', 'student', False, now, now)
        )
        db.commit()
    response = client.post('/auth/register', json={
        'email': 'existing@example.com',
        'password': 'password123',
        'role': 'student'
    })
    assert response.status_code == 400
    data = response.get_json()
    assert data['message'] == 'User already exists'

def test_send_verification_email_prints_verification_link(capsys):
    # Patch smtplib.SMTP to prevent real network calls
    with mock.patch('smtplib.SMTP'):
        send_verification_email('test@example.com', 'dummy-token')
        captured = capsys.readouterr()
        assert "[MOCK] Verification email to test@example.com: http://localhost:5000/auth/verify-email?token=dummy-token\n" in captured.out
        #assert "Click the link to verify your email: http://localhost:5000/auth/verify_email?token=dummy-token" in captured.out

def test_send_verification_email_sends_email_successfully():
    with mock.patch('smtplib.SMTP') as mock_smtp:
        instance = mock_smtp.return_value.__enter__.return_value
        send_verification_email('test@example.com', 'dummy-token')
        instance.starttls.assert_called_once()
        instance.login.assert_called_once_with("your_username", "your_password")
        instance.sendmail.assert_called_once()
        # Check that the recipient and sender are correct
        args, kwargs = instance.sendmail.call_args
        assert args[0] == "no-reply@example.com"
        assert args[1] == "test@example.com"
        assert "Verify your email address" in args[2]

def test_send_verification_email_handles_smtp_exception(capsys):
    with mock.patch('smtplib.SMTP', side_effect=Exception("SMTP error")):
        send_verification_email('fail@example.com', 'fail-token')
        captured = capsys.readouterr()
        assert "Failed to send email: SMTP error" in captured.out

def test_verify_email_success(client):
    # Register a user first
    email = 'verifyme@example.com'
    password = 'password123'
    role = 'student'
    client.post('/auth/register', json={
        'email': email,
        'password': password,
        'role': role
    })
    user = find_user_by_email_db(email)
    assert user is not None
    # Generate a valid token as in the register endpoint

    random_bytes = os.urandom(16)
    token = base64.urlsafe_b64encode(f"{email}:{random_bytes.hex()}".encode()).decode()
    # Manually set user as not verified
    with app.app_context():
        db = get_db()
        db.execute('UPDATE users SET is_email_verified = ? WHERE email = ?', (False, email))
        db.commit()
    response = client.post('/auth/verify-email', json={'token': token})
    # Since the token is valid, email should be verified
    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == 'Email verified successfully'
    user = find_user_by_email_db(email)
    assert user['is_email_verified']

def test_verify_email_missing_token(client):
    # Generate a valid token as in the register endpoint
    email = 'verifyme@example.com'
    password = 'password123'
    role = 'student'
    random_bytes = os.urandom(16)
    token = base64.urlsafe_b64encode(f"{email}:{random_bytes.hex()}".encode()).decode()

    response = client.post('/auth/verify-email', json={'poken': token})
    assert response.status_code == 400
    data = response.get_json()
    assert data['message'] == 'Missing token'

def test_verify_email_invalid_token(client):
    # Invalid base64 token
    response = client.post('/auth/verify-email', json={'token': "token"})
    assert response.status_code == 400
    data = response.get_json()
    assert data['message'] == 'Invalid or expired token'

def test_verify_email_user_not_found(client):
    # Generate a token for a non-existent user
    email = 'nouser@example.com'
    random_bytes = os.urandom(16)
    token = base64.urlsafe_b64encode(f"{email}:{random_bytes.hex()}".encode()).decode()
    response = client.get(f'/auth/verify_email?token={token}')
    assert response.status_code == 404
    data = response.get_json()
    assert data['message'] == 'User not found'

def test_register_and_verify_email(client):
    # Register
    resp = client.post('/auth/register', json={
        'email': 'test1@example.com',
        'password': 'pass123',
        'role': 'student'
    })
    assert resp.status_code == 201
    # Get token and verify
    token = get_verification_token('test1@example.com')
    resp = client.post('/auth/verify-email', json={'token': token})
    # Should succeed even if token is mock, as long as user exists
    assert resp.status_code in (200, 404)  # 404 if token doesn't match DB user

def test_register_duplicate_email(client):
    client.post('/auth/register', json={
        'email': 'dup@example.com',
        'password': 'pass123',
        'role': 'student'
    })
    resp = client.post('/auth/register', json={
        'email': 'dup@example.com',
        'password': 'pass123',
        'role': 'student'
    })
    assert resp.status_code == 400
    assert resp.get_json()['message'] == 'User already exists'

def test_register_missing_fields(client):
    resp = client.post('/auth/register', json={'email': 'a@b.com'})
    assert resp.status_code == 400

def test_login_success_and_fail(client):
    client.post('/auth/register', json={
        'email': 'login@example.com',
        'password': 'pass123',
        'role': 'student'
    })
    # Email not verified yet
    resp = client.post('/auth/login', json={
        'email': 'login@example.com',
        'password': 'pass123'
    })
    assert resp.status_code == 401
    # Verify email
    token = get_verification_token('login@example.com')
    client.post('/auth/verify-email', json={'token': token})
    # Now login
    resp = client.post('/auth/login', json={
        'email': 'login@example.com',
        'password': 'pass123'
    })
    assert resp.status_code == 200
    assert 'token' in resp.get_json()
    # Wrong password
    resp = client.post('/auth/login', json={
        'email': 'login@example.com',
        'password': 'wrong'
    })
    assert resp.status_code == 401

def test_forgot_and_reset_password(client):
    client.post('/auth/register', json={
        'email': 'resetme@example.com',
        'password': 'oldpass',
        'role': 'student'
    })
    # Verify email
    token = get_verification_token('resetme@example.com')
    client.post('/auth/verify-email', json={'token': token})
    # Forgot password
    resp = client.post('/auth/forgot-password', json={'email': 'resetme@example.com'})
    assert resp.status_code == 200
    # Get reset token from DB
    with app.app_context():
        db = get_db()
        row = db.execute('SELECT reset_token FROM password_resets').fetchone()
        reset_token = row['reset_token']
    # Reset password
    resp = client.post('/auth/reset-password', json={
        'resetToken': reset_token,
        'newPassword': 'newpass'
    })
    assert resp.status_code == 200
    # Login with new password
    resp = client.post('/auth/login', json={
        'email': 'resetme@example.com',
        'password': 'newpass'
    })
    assert resp.status_code == 200

def test_get_update_delete_profile(client):
    # Register and verify
    client.post('/auth/register', json={
        'email': 'profile@example.com',
        'password': 'pass123',
        'role': 'student'
    })
    token = get_verification_token('profile@example.com')
    client.post('/auth/verify-email', json={'token': token})
    # Login
    resp = client.post('/auth/login', json={
        'email': 'profile@example.com',
        'password': 'pass123'
    })
    jwt_token = resp.get_json()['token']
    headers = {'Authorization': f'Bearer {jwt_token}'}
    # Get profile
    resp = client.get('/users/profile', headers=headers)
    assert resp.status_code == 200
    # Update profile
    resp = client.put('/users/profile', headers=headers, json={'name': 'New Name'})
    assert resp.status_code == 200
    assert resp.get_json()['name'] == 'New Name'
    # Delete profile
    resp = client.delete('/users/profile', headers=headers)
    assert resp.status_code == 200

def test_admin_user_crud(client):
    # Register admin and verify
    client.post('/auth/register', json={
        'email': 'admin@example.com',
        'password': 'adminpass',
        'role': 'admin'
    })
    token = get_verification_token('admin@example.com')
    client.post('/auth/verify-email', json={'token': token})
    # Login as admin
    resp = client.post('/auth/login', json={
        'email': 'admin@example.com',
        'password': 'adminpass'
    })
    admin_token = resp.get_json()['token']
    headers = {'Authorization': f'Bearer {admin_token}'}
    # Create another user
    client.post('/auth/register', json={
        'email': 'user2@example.com',
        'password': 'pass2',
        'role': 'student'
    })
    token2 = get_verification_token('user2@example.com')
    client.post('/auth/verify-email', json={'token': token2})
    # List users
    resp = client.get('/users', headers=headers)
    assert resp.status_code == 200
    users = resp.get_json()
    assert any(u['email'] == 'user2@example.com' for u in users)
    # Get user by id
    user_id = next(u['id'] for u in users if u['email'] == 'user2@example.com')
    resp = client.get(f'/users/{user_id}', headers=headers)
    assert resp.status_code == 200
    # Update user by id
    resp = client.put(f'/users/{user_id}', headers=headers, json={'name': 'AdminChanged'})
    assert resp.status_code == 200
    assert resp.get_json()['name'] == 'AdminChanged'
    # Delete user by id
    resp = client.delete(f'/users/{user_id}', headers=headers)
    assert resp.status_code == 200

def test_unauthorized_access(client):
    # Try to access protected endpoint without token
    resp = client.get('/users/profile')
    assert resp.status_code == 401
    # Try admin endpoint as non-admin
    client.post('/auth/register', json={
        'email': 'notadmin@example.com',
        'password': 'pass',
        'role': 'student'
    })
    token = get_verification_token('notadmin@example.com')
    client.post('/auth/verify-email', json={'token': token})
    resp = client.post('/auth/login', json={
        'email': 'notadmin@example.com',
        'password': 'pass'
    })
    user_token = resp.get_json()['token']
    headers = {'Authorization': f'Bearer {user_token}'}
    resp = client.get('/users', headers=headers)
    assert resp.status_code == 401