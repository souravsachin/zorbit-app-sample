#!/bin/bash
# =============================================================================
# Register Menu Items for zorbit-app-sample
# =============================================================================
#
# This script registers navigation menu items in the zorbit-navigation service.
# Run this ONCE after deploying the module for the first time.
#
# Prerequisites:
#   - zorbit-navigation service is running
#   - You have a valid JWT token (get one from zorbit-identity /auth/login)
#
# Usage:
#   export JWT_TOKEN="your_jwt_token_here"
#   export NAV_URL="http://localhost:3103"  # or production URL
#   bash scripts/register-menu.sh
# =============================================================================

NAV_URL="${NAV_URL:-http://localhost:3103}"
JWT_TOKEN="${JWT_TOKEN:?Error: JWT_TOKEN environment variable is required}"

echo "Registering menu items in navigation service at $NAV_URL..."

# Main menu item — appears in sidebar under "Modules" section
curl -s -X POST "$NAV_URL/api/v1/G/navigation/menu-items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "label": "Sample Tasks",
    "icon": "CheckSquare",
    "route": "/sample-tasks",
    "section": "modules",
    "order": 900,
    "privileges": [],
    "children": [
      {
        "label": "Task List",
        "route": "/sample-tasks",
        "icon": "List",
        "order": 1
      },
      {
        "label": "Guide",
        "route": "/sample-tasks/guide",
        "icon": "BookOpen",
        "order": 2
      },
      {
        "label": "Setup",
        "route": "/sample-tasks/setup",
        "icon": "Settings",
        "order": 3
      },
      {
        "label": "Deployments",
        "route": "/sample-tasks/deployments",
        "icon": "Rocket",
        "order": 4
      }
    ]
  }' | jq .

echo ""
echo "Menu items registered. Refresh the console to see them in the sidebar."
