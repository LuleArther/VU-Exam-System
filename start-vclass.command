#!/bin/bash
# Double-click this file in Finder to start both the backend (Django) and
# frontend (Astro) servers for the VClass Exam System in one go.
#
# To stop everything: close this Terminal window, or press Ctrl+C in it.

cd "$(dirname "$0")"

echo "Starting VClass Exam System..."
echo ""

# If a previous run is still active on these ports, free them up first so
# this always starts cleanly instead of failing with "port already in use".
lsof -ti:8000 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -ti:4321 -sTCP:LISTEN | xargs kill -9 2>/dev/null

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# Backend (Django). --noreload keeps this to a single process (no hidden
# child process), so stopping it later via Ctrl+C is guaranteed to be clean.
(
  cd backend
  source my_venv/bin/activate
  exec python -u manage.py runserver --noreload
) &
BACKEND_PID=$!

# Frontend (Astro)
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://localhost:4321"
echo ""
echo "Leave this window open while you work. Press Ctrl+C here to stop both servers."
echo ""

# Give the frontend a few seconds to come up, then open it in the browser.
sleep 6
open http://localhost:4321

wait
