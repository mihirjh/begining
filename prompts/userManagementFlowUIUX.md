# User Management – UI/UX Design

---

## 1. Registration Flow

### Registration Page
- **Form Fields:**  
  - Email  
  - Password  
  - Confirm Password  
  - Role selector (Student/Teacher)  
- **Actions:**  
  - "Register" button  
  - Link to login page  
- **Feedback:**  
  - Inline validation for fields  
  - Error messages for invalid input  
  - Success message after registration  
  - Email verification prompt

### Email Verification Page
- **Message:**  
  - "A verification link has been sent to your email."
  - "Resend verification email" button

---

## 2. Login Flow

### Login Page
- **Form Fields:**  
  - Email  
  - Password  
- **Actions:**  
  - "Login" button  
  - "Forgot Password?" link  
  - Link to registration page  
- **Feedback:**  
  - Error message for invalid credentials

### Dashboard Redirect
- **Role-based:**  
  - Student: Redirect to student dashboard  
  - Teacher/Admin: Redirect to admin dashboard

---

## 3. Password Reset Flow

### Forgot Password Page
- **Form Field:**  
  - Email  
- **Actions:**  
  - "Send Reset Link" button  
- **Feedback:**  
  - Confirmation message after sending link

### Reset Password Page
- **Form Fields:**  
  - New Password  
  - Confirm New Password  
- **Actions:**  
  - "Reset Password" button  
- **Feedback:**  
  - Success message after password reset

---

## 4. Profile Management Flow

### Profile Page
- **Editable Fields:**  
  - Name  
  - Email (read-only or editable with verification)  
  - Password (change password option)  
- **Actions:**  
  - "Save Changes" button  
- **Feedback:**  
  - Inline validation  
  - Success/error message after update

---

## 5. Role-Based Access Flow

- **On Login:**  
  - System checks user role  
  - Redirects to appropriate dashboard (student or admin/teacher)

---

## General UI/UX Guidelines

- Clean, minimal forms with clear labels and placeholders
- Responsive design for all devices
- Accessible navigation and form controls
- Clear feedback for all actions (success, error, loading)
- Secure handling of sensitive actions (password, email verification)
- Consistent branding and layout across all pages