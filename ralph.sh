#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop (Beads edition)
# Usage: ./ralph.sh [max_iterations]
# Environment: RALPH_TOOL=amp|claude (default: amp)

set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Tool selection (amp or claude)
RALPH_TOOL=${RALPH_TOOL:-amp}
# Mode selection for amp (free, smart, rush)
RALPH_MODE=${RALPH_MODE:-smart}

# Build command based on tool
case "$RALPH_TOOL" in
    amp)
        CMD="amp --dangerously-allow-all --mode $RALPH_MODE"
        ;;
    claude)
        CMD="claude -p --dangerously-skip-permissions"
        ;;
    *)
        echo "Unknown tool: $RALPH_TOOL (use 'amp' or 'claude')"
        exit 1
        ;;
esac

echo "Starting Ralph (Beads edition) - Max iterations: $MAX_ITERATIONS, Tool: $RALPH_TOOL"

for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo " Ralph Iteration $i of $MAX_ITERATIONS"
    echo "═══════════════════════════════════════════════════════"

    # Run the selected tool with the prompt
    OUTPUT=$(cat "$SCRIPT_DIR/PROMPT.md" | $CMD 2>&1 | tee /dev/stderr) || true

    # Check for completion signal
    if echo "$OUTPUT" | grep -q "COMPLETE"; then
        echo ""
        echo "Ralph completed all tasks!"
        echo "Completed at iteration $i of $MAX_ITERATIONS"
        exit 0
    fi

    echo "Iteration $i complete. Continuing..."
    sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Run 'bd list' to check status."
exit 1
