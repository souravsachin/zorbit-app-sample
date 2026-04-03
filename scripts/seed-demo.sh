#!/bin/bash
# =============================================================================
# Seed Demo Data for zorbit-app-sample
# =============================================================================
#
# Seeds 10 sample tasks with various statuses and priorities.
# Requires authentication (JWT token).
#
# Usage:
#   export JWT_TOKEN="your_jwt_token_here"
#   export SAMPLE_URL="http://localhost:3040"
#   bash scripts/seed-demo.sh
# =============================================================================

SAMPLE_URL="${SAMPLE_URL:-http://localhost:3040}"
JWT_TOKEN="${JWT_TOKEN:?Error: JWT_TOKEN environment variable is required}"

echo "Seeding demo tasks..."

curl -s -X POST "$SAMPLE_URL/api/v1/G/sample/seed/demo" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo ""
echo "Demo tasks seeded. View them at: $SAMPLE_URL/api-docs"
