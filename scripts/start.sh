#!/bin/bash

# Start Redis if not running
docker compose up -d 2>/dev/null

# Start worker in background
echo "Starting worker..."
npx tsx src/worker.ts &
WORKER_PID=$!

# Start Next.js dev server
echo "Starting web UI at http://localhost:3000..."
npx next dev --webpack &
DEV_PID=$!

# Trap Ctrl+C to kill both
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $WORKER_PID $DEV_PID 2>/dev/null
  wait $WORKER_PID $DEV_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo "FirstMe is running!"
echo "  Web UI:  http://localhost:3000"
echo "  Worker:  PID $WORKER_PID"
echo ""
echo "Press Ctrl+C to stop."
echo ""

# Wait for either to exit
wait
