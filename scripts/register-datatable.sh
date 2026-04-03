#!/bin/bash
# =============================================================================
# Register DataTable Page Definition for zorbit-app-sample
# =============================================================================
#
# This script creates a DataTable page definition in zorbit-pfs-datatable.
# Once registered, the ZorbitDataTable component can render the task list
# with all features: sorting, filtering, PII masking, export.
#
# Usage:
#   export JWT_TOKEN="your_jwt_token_here"
#   export DATATABLE_URL="http://localhost:3113"
#   bash scripts/register-datatable.sh
# =============================================================================

DATATABLE_URL="${DATATABLE_URL:-http://localhost:3113}"
JWT_TOKEN="${JWT_TOKEN:?Error: JWT_TOKEN environment variable is required}"

echo "Registering DataTable page definition..."

curl -s -X POST "$DATATABLE_URL/api/v1/G/datatable/pages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d @"$(dirname "$0")/../frontend/config/datatable-page.json" | jq .

echo ""
echo "DataTable page definition registered (shortname: sample-tasks)."
echo "The ZorbitDataTable component can now query: /api/v1/O/:orgId/datatable/query/sample-tasks"
