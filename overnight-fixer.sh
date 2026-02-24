#!/bin/bash
# overnight-fixer.sh — Grab GitHub issues, fix each in a worktree, open PRs

REPO="OpenHedgeFund"
OWNER="$(gh repo view --json owner -q .owner.login)"
MAX_TURNS=200
LABEL="openhedgefund"
LIMIT=30  # process all openhedgefund issues

# Fetch open issues
if [ -n "$LABEL" ]; then
  ISSUES=$(gh issue list --repo "$OWNER/$REPO" --state open --label "$LABEL" --limit "$LIMIT" --json number,title,body)
else
  ISSUES=$(gh issue list --repo "$OWNER/$REPO" --state open --limit "$LIMIT" --json number,title,body)
fi

COUNT=$(echo "$ISSUES" | jq length)
echo "Found $COUNT issues to process"

for i in $(seq 0 $((COUNT - 1))); do
  NUMBER=$(echo "$ISSUES" | jq -r ".[$i].number")
  TITLE=$(echo "$ISSUES" | jq -r ".[$i].title")
  BODY=$(echo "$ISSUES" | jq -r ".[$i].body")
  BRANCH="auto/issue-${NUMBER}"

  echo "=========================================="
  echo "Processing issue #$NUMBER: $TITLE"
  echo "=========================================="

  # Create a fresh worktree + branch from main
  git worktree add -b "$BRANCH" ".claude/worktrees/$BRANCH" main 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "Skipping #$NUMBER — branch or worktree already exists"
    continue
  fi

  WORKTREE_PATH="$(pwd)/.claude/worktrees/$BRANCH"

  # Run Claude in the worktree
  (
    cd "$WORKTREE_PATH"
    claude -p "
You are fixing GitHub issue #$NUMBER.

Title: $TITLE

Description:
$BODY

Instructions:
1. Read the relevant code and understand the issue
2. Implement the fix
3. Test your changes if possible (run tests, lint, build)
4. Commit your changes with a descriptive message referencing issue #$NUMBER
5. Push the branch and create a PR that closes #$NUMBER

Important:
- Keep changes minimal and focused on the issue
- Follow existing code patterns in CLAUDE.md
- The branch is already checked out: $BRANCH
" \
      --max-turns "$MAX_TURNS" \
      --allowedTools "Edit,Write,Read,Glob,Grep,Bash(git *),Bash(npm *),Bash(npx *),Bash(ruff *),Bash(pytest *),Bash(python *),Bash(pip *),Bash(gh pr create *),Bash(gh issue *),Bash(docker compose *),Bash(make *),Bash(cd *),Bash(ls *)" \
      > "/tmp/claude-issue-${NUMBER}.log" 2>&1

    echo "Issue #$NUMBER done — log at /tmp/claude-issue-${NUMBER}.log"
  ) &

  # Stagger launches to avoid rate limits — we have all night
  sleep 60
done

echo ""
echo "All issues dispatched. Logs in /tmp/claude-issue-*.log"
echo "Run 'gh pr list' in the morning to see results."
echo ""

wait
echo "All done!"
