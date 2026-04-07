# Start Script for Note Taking App

Write-Host "Starting Note Taking App Services..." -ForegroundColor Cyan
Write-Host "Make sure MongoDB is running locally on port 27017." -ForegroundColor Yellow

# Start FastAPI Background
Write-Host "Starting FastAPI Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"

# Start Vite Frontend
Write-Host "Starting Vite Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services are starting up!" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
