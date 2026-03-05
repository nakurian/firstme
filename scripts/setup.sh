#!/bin/bash
set -e

echo "=== FirstMe Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is required. Install from https://docker.com"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "WARNING: Claude CLI not found. Error analysis will not work."; }
command -v gh >/dev/null 2>&1 || { echo "WARNING: GitHub CLI not found. Jira ticket creation will not work."; }

# Install dependencies
echo "[1/4] Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo "[2/4] Creating .env.local..."
  cat > .env.local << 'EOF'
REDIS_URL=redis://localhost:6379
DATABASE_URL=./data/firstme.db
REPOS_CACHE_DIR=/tmp/firstme-repos
GITHUB_TOKEN=
WEBHOOK_SECRET=dev-secret
EOF
  echo "  Created .env.local — edit GITHUB_TOKEN if needed."
else
  echo "[2/4] .env.local already exists, skipping."
fi

# Start Redis
echo "[3/4] Starting Redis via Docker..."
docker compose up -d

# Generate DB migrations if needed
echo "[4/4] Preparing database..."
npx drizzle-kit generate 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Run the app with:"
echo "  npm run app"
echo ""
echo "This starts both the web UI (http://localhost:3000) and the background worker."
echo ""
