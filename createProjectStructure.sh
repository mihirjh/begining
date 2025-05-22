#!/bin/bash

# Create backend structure
mkdir -p backend/src/{controllers,models,routes,middlewares,services,utils,config}
touch backend/src/app.js
mkdir -p backend/tests
mkdir -p backend/uploads
touch backend/.env backend/package.json backend/README.md

# Create frontend structure
mkdir -p frontend/public
mkdir -p frontend/src/{components,pages,hooks,utils,store}
touch frontend/src/App.tsx frontend/src/index.tsx
mkdir -p frontend/tests
touch frontend/.env frontend/package.json frontend/README.md

# Create docs
mkdir -p docs
touch docs/requirement.txt docs/userManagementFlow.md docs/testManagementFlow.md docs/questionBankFlow.md docs/testTakingFlow.md docs/scoringAnalyticsFlow.md docs/feedbackImprovementFlow.md docs/adminTeacherToolsFlow.md

# Create scripts folder
mkdir -p scripts

# Root files
touch .gitignore docker-compose.yml README.md

echo "Project structure created successfully."