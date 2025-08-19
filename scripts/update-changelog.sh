#!/bin/bash
#
# CHANGELOG.md automation script for mcp-server-pinescript
#
# Automatically updates CHANGELOG.md with new version entries
# based on git commits and session type information.
#
# Usage:
#   ./scripts/update-changelog.sh <version> <session_type> [commit_message]
#
# Called automatically by pre-commit hook during version bumps
#

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <version> <session_type> [commit_message]"
    echo "Example: $0 2.1.0 minor 'Add new validation rules'"
    exit 1
fi

VERSION="$1"
SESSION_TYPE="$2"
COMMIT_MSG="${3:-$(git log -1 --pretty=%B | head -1)}"
CHANGELOG_FILE="CHANGELOG.md"
DATE=$(date +%Y-%m-%d)

# Backup changelog
cp "$CHANGELOG_FILE" "${CHANGELOG_FILE}.backup"

# Determine change type based on session type
case "$SESSION_TYPE" in
    major)
        CHANGE_TYPE="⚠️ BREAKING CHANGES"
        ;;
    minor)
        CHANGE_TYPE="Added"
        ;;
    patch)
        CHANGE_TYPE="Fixed"
        ;;
    *)
        CHANGE_TYPE="Changed"
        ;;
esac

# Create new changelog entry
NEW_ENTRY="## [${VERSION}] - ${DATE}

### ${CHANGE_TYPE}
- ${COMMIT_MSG}

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---
"

# Insert new entry after the header
{
    # Print header lines until we reach the first version entry
    sed -n '1,/^## \[/p' "$CHANGELOG_FILE" | head -n -1
    # Add new entry
    echo "$NEW_ENTRY"
    # Add rest of changelog
    sed -n '/^## \[/,$p' "$CHANGELOG_FILE"
} > "${CHANGELOG_FILE}.tmp"

mv "${CHANGELOG_FILE}.tmp" "$CHANGELOG_FILE"

echo "✅ CHANGELOG.md updated for version $VERSION"
echo "📝 Entry added: $CHANGE_TYPE - $COMMIT_MSG"

# Clean up backup on success
rm -f "${CHANGELOG_FILE}.backup"