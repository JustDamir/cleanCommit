@echo off
echo Starting Clean Commit...
echo.

echo Starting Python service...
cd python_service
start "Python ML" cmd /k "python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python app.py"
cd ..

timeout /t 5 /nobreak >nul

echo Starting Go server...
start "Go Server" cmd /k "go run cmd/server/main.go"

echo.
echo Both services started!
echo Open http://localhost:8080 in your browser
