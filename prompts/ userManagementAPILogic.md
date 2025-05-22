# User Management API – Application Logic (Flow Chart in Natural Language, Including CRUD Operations)

---

## 1. Registration (`POST /auth/register`)
- User submits registration form with email, password, and role.
- System checks if all required fields are present.
- System checks if the email already exists in the database.
  - If yes, returns error: "User already exists".
- System hashes the password and creates a new user record with `is_email_verified = false`.
- System sends a verification email (with a token or link).
- Returns: "User registered successfully".

---

## 2. Email Verification (`POST /auth/verify-email`)
- User clicks the verification link or submits the token.
- System checks if the token is valid and not expired.
  - If invalid/expired, returns error.
- System finds the user and sets `is_email_verified = true`.
- Returns: "Email verified successfully".

---

## 3. Login (`POST /auth/login`)
- User submits email and password.
- System finds the user by email.
  - If not found, returns "Invalid credentials".
- System checks if the password matches the stored hash.
  - If not, returns "Invalid credentials".
- System checks if the email is verified.
  - If not, may return "Please verify your email".
- System generates a JWT token for the user.
- Returns: JWT token.

---

## 4. Forgot Password (`POST /auth/forgot-password`)
- User submits their email.
- System checks if the email exists.
  - If not, returns "User not found".
- System generates a password reset token and stores it (with expiry).
- System sends a password reset email with the token/link.
- Returns: "Password reset link sent".

---

## 5. Reset Password (`POST /auth/reset-password`)
- User submits the reset token and new password.
- System checks if the token is valid and not expired.
  - If invalid/expired, returns error.
- System finds the user and updates the password hash.
- System deletes or invalidates the used token.
- Returns: "Password reset successful".

---

## 6. Get User Profile (`GET /users/profile`)
- User sends a request with a valid JWT token.
- System verifies the token and retrieves the user.
  - If token is invalid/expired, returns "Unauthorized".
- System returns user profile details (id, email, name, role, etc.).

---

## 7. Update User Profile (`PUT /users/profile`)
- User sends a request with a valid JWT token and new profile data (name, password).
- System verifies the token and retrieves the user.
  - If token is invalid/expired, returns "Unauthorized".
- System updates the user's profile fields (name, password if provided).
- System updates the `updated_at` timestamp.
- Returns: Updated user profile.

---

## 8. Delete User (`DELETE /users/profile`)
- User sends a request with a valid JWT token.
- System verifies the token and retrieves the user.
  - If token is invalid/expired, returns "Unauthorized".
- System deletes the user record from the database.
- Returns: "User deleted successfully".

---

## 9. List All Users (`GET /users`)
- Admin sends a request with a valid JWT token.
- System verifies the token and checks if the user has admin privileges.
  - If not admin, returns "Unauthorized".
- System retrieves and returns a paginated list of all users.

---

## 10. Get User by ID (`GET /users/{userId}`)
- Admin sends a request with a valid JWT token and user ID.
- System verifies the token and checks if the user has admin privileges.
  - If not admin, returns "Unauthorized".
- System retrieves and returns the user details for the given ID.
  - If user not found, returns 404.

---

## 11. Update User by ID (`PUT /users/{userId}`)
- Admin sends a request with a valid JWT token, user ID, and update data.
- System verifies the token and checks if the user has admin privileges.
  - If not admin, returns "Unauthorized".
- System updates the specified user's profile fields.
  - If user not found, returns 404.
- Returns: Updated user profile.

---

## 12. Delete User by ID (`DELETE /users/{userId}`)
- Admin sends a request with a valid JWT token and user ID.
- System verifies the token and checks if the user has admin privileges.
  - If not admin, returns "Unauthorized".
- System deletes the user record for the given ID.
  - If user not found, returns 404.
- Returns: "User deleted successfully".

---

## Error Handling (All Endpoints)
- If required fields are missing, return 400 with a descriptive message.
- If authentication fails, return 401 Unauthorized.
- If a resource is not found, return 404.
- All responses are in JSON format.

---

## Security
- All sensitive endpoints require JWT authentication (except registration, login, forgot/reset password, and email verification).
- Passwords are always stored as hashes.
- Tokens are time-limited and securely generated.
- Only admin users can perform CRUD operations on other users.

---