# Test Management – UI/UX Design

---

## 1. Test Creation Flow (Admin/Teacher)

### Create Test Page
- **Form Section:**  
  - Fields: Test Name, Subject (dropdown), Pattern, Duration, Availability Window (date/time pickers)
  - Validation and helper text for each field

- **Question Selection Panel:**  
  - Search and filter questions by subject, topic, difficulty
  - Multi-select with checkboxes
  - Preview question details on click

- **Selected Questions List:**  
  - Drag-and-drop to reorder
  - Remove question button

- **Test Summary & Publish:**  
  - Review all test details and selected questions
  - "Publish Test" and "Save as Draft" buttons
  - Success/error feedback after action

---

## 2. Test Assignment Flow (Admin/Teacher)

### Assign Test Modal/Page
- **Test Selector:**  
  - Dropdown or search to select test

- **Student/Group Selector:**  
  - Multi-select for students or groups
  - Filter/search options

- **Availability Settings:**  
  - Start/End time pickers
  - Attempt limit input

- **Confirmation:**  
  - "Assign Test" button
  - Notification preview
  - Success message after assignment

---

## 3. Test Taking Flow (Student)

### Available Tests Page
- **Test List:**  
  - Card or table view of available tests
  - Key info: Subject, duration, status, start/end time
  - "Start Test" button

### Test Interface
- **Instructions Modal:**  
  - Test rules, time limit, navigation info

- **Question Panel:**  
  - One question per page
  - Navigation: Next/Previous, jump to question, flag for review
  - Timer visible at all times
  - Auto-save indicator

- **Submission:**  
  - "Submit Test" button (with confirmation dialog)
  - Submission feedback modal

---

## 4. Test Review & Scoring Flow (Student)

### Results Page
- **Score Summary:**  
  - Total score, percentage, pass/fail status

- **Detailed Review:**  
  - List of questions with student's answer, correct answer, explanation
  - Visual indicators for correct/incorrect
  - Analytics link/button

---

## 5. Test Analytics Flow (Admin/Teacher)

### Test Analytics Dashboard
- **Test Selector:**  
  - Dropdown/search to select test

- **Performance Widgets:**  
  - Average score, highest/lowest, distribution charts

- **Question Statistics Table:**  
  - Columns: Question, % Correct, Avg. Time, Difficulty

- **Student Performance Table:**  
  - Columns: Student, Score, Status

- **Export Options:**  
  - CSV/PDF export buttons

---

## General UI/UX Guidelines

- Consistent sidebar and header navigation
- Responsive design for all devices
- Clear feedback for all actions (success, error, loading)
- Accessible forms, tables, and navigation
- Confirmation dialogs for critical actions (publish, assign, submit)
- Use of color and icons for quick status recognition

---