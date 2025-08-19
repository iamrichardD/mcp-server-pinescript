#!/bin/bash
#
# Session Type Manager for mcp-server-pinescript
#
# Sets the session type for the next commit to determine version bump type:
# - patch: Bug fixes and small improvements (1.0.0 → 1.0.1)
# - minor: New features and enhancements (1.0.0 → 1.1.0)  
# - major: Breaking changes (1.0.0 → 2.0.0)
#
# Usage:
#   ./scripts/set-session-type.sh patch
#   ./scripts/set-session-type.sh minor  
#   ./scripts/set-session-type.sh major
#   ./scripts/set-session-type.sh show    # Display current session type
#   ./scripts/set-session-type.sh clear   # Remove session type file
#

SESSION_TYPE_FILE=".session-type"

case "$1" in
    patch|minor|major)
        echo "$1" > "$SESSION_TYPE_FILE"
        echo "✅ Session type set to: $1"
        echo "🔢 Next commit will be a $1 version bump"
        ;;
    show)
        if [ -f "$SESSION_TYPE_FILE" ]; then
            CURRENT_TYPE=$(cat "$SESSION_TYPE_FILE")
            echo "📋 Current session type: $CURRENT_TYPE"
        else
            echo "📋 No session type set (will default to patch)"
        fi
        ;;
    clear)
        if [ -f "$SESSION_TYPE_FILE" ]; then
            rm "$SESSION_TYPE_FILE"
            echo "🗑️  Session type cleared"
        else
            echo "📋 No session type file to clear"
        fi
        ;;
    *)
        echo "🔧 Session Type Manager for mcp-server-pinescript"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  patch   - Set session type to patch (bug fixes)"
        echo "  minor   - Set session type to minor (new features)"
        echo "  major   - Set session type to major (breaking changes)"
        echo "  show    - Display current session type"
        echo "  clear   - Remove session type file"
        echo ""
        echo "Examples:"
        echo "  $0 patch   # For bug fixes and small improvements"
        echo "  $0 minor   # For new features and enhancements"
        echo "  $0 major   # For breaking changes"
        echo ""
        echo "The session type determines the version bump during commit:"
        echo "  patch: 1.0.0 → 1.0.1"
        echo "  minor: 1.0.0 → 1.1.0"
        echo "  major: 1.0.0 → 2.0.0"
        ;;
esac