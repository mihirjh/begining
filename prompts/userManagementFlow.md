---

## 3. User Management – User Flow Diagrams

### 1. Registration Flow
- User visits registration page  
  → Enters email, password, (optionally selects role: Student/Teacher)  
  → Submits form  
  → System validates input  
    → [If valid] Creates user account, sends verification email  
    → [If invalid] Shows error message  
  → User verifies email  
  → Registration complete, redirected to login

### 2. Login Flow
- User visits login page  
  → Enters email and password  
  → Submits form  
  → System authenticates credentials  
    → [If valid] Logs in, redirects to dashboard (role-based)  
    → [If invalid] Shows error message

### 3. Password Reset Flow
- User clicks "Forgot Password"  
  → Enters email  
  → System sends password reset link  
  → User clicks link, enters new password  
  → System updates password  
  → User can now log in with new password

### 4. Profile Management Flow
- User logs in  
  → Navigates to profile page  
  → Edits profile details (name, password, etc.)  
  → Submits changes  
  → System validates and updates profile  
  → Shows success or error message

### 5. Role-Based Access Flow
- User logs in  
  → System checks user role  
    → [If Student] Redirects to student dashboard  
    → [If Teacher/Admin] Redirects to admin dashboard

---
