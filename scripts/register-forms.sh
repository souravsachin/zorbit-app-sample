#!/bin/bash
# =============================================================================
# Register FormBuilder Form Definition for zorbit-app-sample
# =============================================================================
#
# This script creates a form definition in zorbit-pfs-form_builder.
# Once registered, the FormRenderer component from zorbit-sdk-react
# can render the task create/edit form from configuration.
#
# Usage:
#   export JWT_TOKEN="your_jwt_token_here"
#   export FORM_BUILDER_URL="http://localhost:3114"
#   bash scripts/register-forms.sh
# =============================================================================

FORM_BUILDER_URL="${FORM_BUILDER_URL:-http://localhost:3114}"
JWT_TOKEN="${JWT_TOKEN:?Error: JWT_TOKEN environment variable is required}"

echo "Registering form definition in FormBuilder..."

curl -s -X POST "$FORM_BUILDER_URL/api/v1/G/forms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d @"$(dirname "$0")/../frontend/config/form-schema.json" | jq .

echo ""
echo "Form definition registered (formId: sample-task-form)."
echo "Use <FormRenderer formId=\"sample-task-form\" /> to render the form."
