# Question Bank – UI/UX Design

---

## 1. Add Question Flow

### Question Bank Page
- **Sidebar Navigation:**  
  - Dashboard  
  - Question Bank  
  - Tests  
  - Analytics  
  - Notifications

- **Main Panel:**  
  - **"Add Question" Button:** Prominently placed at the top
  - **Question List Table:** Shows existing questions with filters and search

### Add Question Modal/Page
- **Form Fields:**  
  - Question Type (dropdown: MCQ, True/False, Short Answer, etc.)
  - Question Text (textarea)
  - Options (dynamic fields for MCQ/True-False)
  - Correct Answer(s) (checkboxes/radio)
  - Explanation (textarea)
  - Tags (subject, topic, difficulty, pattern; dropdowns or chips)
- **Actions:**  
  - "Save" and "Cancel" buttons
  - Validation feedback for required fields
  - Success/error message after submission

---

## 2. Bulk Upload Flow

### Bulk Upload Modal/Page
- **Instructions Panel:**  
  - Download template (CSV/Excel) button
  - Step-by-step upload instructions

- **Upload Section:**  
  - File input for uploading completed template
  - "Upload" button
  - Progress indicator during upload

- **Validation Feedback:**  
  - Success summary if all questions are valid
  - Error report table if issues are found (row, column, error message)
  - Option to download error report

---

## 3. Edit/Delete Question Flow

### Question List Table
- **Columns:**  
  - Question Text (truncated), Type, Subject, Topic, Difficulty, Actions

- **Actions:**  
  - "Edit" button: Opens edit modal/page with pre-filled form
  - "Delete" button: Opens confirmation dialog
  - Confirmation message after successful edit/delete

---

## 4. Search & Filter Flow

### Filters & Search Bar
- **Search Bar:**  
  - Search by keyword in question text

- **Filter Controls:**  
  - Dropdowns or chips for subject, topic, difficulty, type

- **Filtered Results Table:**  
  - Updates in real-time as filters/search are applied

---

## General UI/UX Guidelines

- Consistent navigation and layout
- Responsive design for desktop/tablet/mobile
- Clear feedback for all actions (success, error, loading)
- Accessible forms and tables (keyboard navigation, ARIA labels)
- Confirmation dialogs for critical actions (delete, bulk upload)
- Use of icons and color for quick recognition of question types and statuses

---