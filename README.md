# English Writer - 90-Day Learning Journey

## Introduction
**English Writer** is a comprehensive local-first web application designed to help Vietnamese speakers master English sentence patterns over a 90-day curriculum (A1-A2 levels). The application focuses on practical usage, context-aware learning, and active recall through daily lessons and quizzes.

## Key Features
- **90-Day Roadmap**: Structured curriculum covering A1 to A2 levels.
- **Daily Lessons**: 
  - Learn 25-30 sentence patterns per day.
  - **Theory**: Structure, Explanation, and Usage Context.
  - **Practice**: Bidirectional translation (VI-EN, EN-VI) with smart fuzzy matching (ignores case, punctuation).
  - **Audio**: Text-to-Speech support for listening and pronunciation.
- **Smart Quizzes**: 
  - Random questions from learned patterns.
  - Timer and attempt limits (3 attempts/day) to simulate pressure.
- **Admin Dashboard**:
  - Overview of the entire curriculum.
  - **CSV Import/Export**: Easily manage and update vocabulary/patterns using Excel/CSV templates.
- **Local Storage**: Data persists locally using SQLite, ensuring privacy and offline capability.

## Tech Stack

### Backend
- **Language**: Golang
- **Framework**: Gin (Web Framework)
- **Database**: SQLite with GORM (ORM)
- **Key Libraries**: 
  - `encoding/csv` for bulk imports.
  - `gorm.io/gorm` for data modeling.

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Hooks (useState, useEffect)
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Getting Started

### Prerequisites
- **Go** (version 1.20+)
- **Node.js** (version 18+) & **npm**

### Installation & Running

#### 1. Backend
Navigate to the backend directory and start the server:
```bash
cd backend
go mod download
go run main.go
```
The backend server will start at `http://localhost:8080`.
*Note: The database will be automatically seeded on the first run.*

#### 2. Frontend
Open a new terminal, navigate to the frontend directory, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5174` (or similar port shown in terminal).

## Git Workflow

We follow a structured Git workflow to ensure code quality and stability.

### Branch Naming Convention
- **Main Branch**: `main` (Production-ready code)
- **Feature Branches**: `feature/feature-name` (e.g., `feature/admin-dashboard`, `feature/csv-import`)
- **Bug Fixes**: `fix/bug-description` (e.g., `fix/encoding-error`, `fix/mobile-responsive`)
- **Documentation**: `docs/update-readme`

### Workflow Steps
1.  **Pull latest changes**:
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **Create a new branch**:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  **Commit changes**:
    - Write clear, descriptive commit messages.
    - Format: `[Type]: Description` (e.g., `[Feat]: Add CSV import logic`, `[Fix]: Resolve UTF-8 encoding issue`)
4.  **Push to remote**:
    ```bash
    git push origin feature/your-feature-name
    ```
5.  **Create a Pull Request (PR)**:
    - Go to GitHub and create a PR from your branch to `main`.
    - **Description**: Explain what changed, why, and how to test.
    - **Screenshots**: Attach screenshots for UI changes.
    - **Review**: Request review from team members.
6.  **Merge**:
    - Once approved, merge into `main` (Squash and Merge is recommended for clean history).

## License
Private Project.
