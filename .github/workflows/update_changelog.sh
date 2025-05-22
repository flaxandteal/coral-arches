#!/bin/bash

# Usage: ./update_changelog.sh path/to/pr.md

PR_FILE="$1"
PR_TITLE="$2"
PR_AUTHOR="$3"
PR_NUMBER="$4"
PR_LINK="$5"
BRANCH_NAME="$6"

CHANGELOG_FILE="Changelog-${BRANCH_NAME}.md"
TEMP_CHECKED="types_checked.txt"
ALL_TYPES=(
  "Model Changes"
  "Added Functions"
  "Added Concepts"
  "Workflows Updated"
  "Reports Updated"
  "Added/Updated Dependencies"
  "Features Added"
  "Bug Fix"
)

if [[ ! -f "$PR_FILE" ]]; then
  echo "Error: PR file '$PR_FILE' not found."
  exit 1
fi

# Step 1: Extract checked items from PR
awk '/^### Types of Changes/,/^---/' "$PR_FILE" | grep '\[x\]' | sed 's/- \[x\] //' | sed 's/^ *//' > "$TEMP_CHECKED"

# Step 2: Merge in already-checked items from existing changelog
if grep -q "^### Types of Changes" "$CHANGELOG_FILE"; then
  awk '/^### Types of Changes/,/^$/' "$CHANGELOG_FILE" | grep '\[x\]' | sed 's/- \[x\] //' >> "$TEMP_CHECKED"
fi

# Deduplicate all checked types
sort -u "$TEMP_CHECKED" -o "$TEMP_CHECKED"

# Step 3: Extract current non-checklist section content
declare -A EXISTING_SECTIONS
current=""
while read -r line; do
  if [[ "$line" =~ ^###\ (.*) ]]; then
    current="${BASH_REMATCH[1]}"
    EXISTING_SECTIONS["$current"]=""
  elif [[ "$line" =~ ^##\ (.*) ]]; then
    current="${BASH_REMATCH[1]}"
    EXISTING_SECTIONS["$current"]=""
  elif [[ -n "$current" ]]; then
    EXISTING_SECTIONS["$current"]+="${line}"$'\n'
  fi
done < "$CHANGELOG_FILE"

# Step 4: Create updated changelog
{
    echo "### Types of Changes"
    for type in "${ALL_TYPES[@]}"; do
        if grep -Fxq "$type" "$TEMP_CHECKED"; then
        echo "- [x] $type"
        else
        echo "- [ ] $type"
        fi
    done
    echo ""

    for type in "${ALL_TYPES[@]}"; do
        # Only process if this type is checked
        if grep -Fxq "$type" "$TEMP_CHECKED"; then

        content_from_pr=$(awk -v section="### $type" '
            BEGIN {found=0}
            $0 ~ "^"section {
            found=1; next
            }
            found && /^---/ {exit}
            found && /^### / {exit}
            found {print}
        ' "$PR_FILE" | sed -E 's/\[[^][]*\]//g; s/\([^()]*\)//g' | sed '/^[[:space:]]*$/d')

        existing="${EXISTING_SECTIONS["$type"]}"
        cleaned_existing=$(echo "$existing" \
        | sed -E 's/\[[^][]*\]//g' \
        | sed '/^[[:space:]]*$/d' \
        | sed '/^[[:space:]]*-\s*\(.*\)/d')

        cleaned_new=$(echo "$content_from_pr" \
        | sed '/^[[:space:]]*$/d' \
        | sed '/^[[:space:]]*-\s*\(.*\)/d')


        # Only include the section if it has content
        if [[ -n "$cleaned_existing" || -n "$cleaned_new" ]]; then
            echo "### $type"

            # Format and print existing content with bullet points
            if [[ -n "$cleaned_existing" ]]; then
            echo "$cleaned_existing" | sed -E '/^- \(/! s/^[^-]/- &/'
            fi

            # Format and print new PR content with bullet points
            if [[ -n "$cleaned_new" ]]; then
            echo "$cleaned_new" | sed -E '/^-\s*\(/! s/^[^-]/- &/'
            fi


            echo ""
            fi
        fi
    done

} >> "$CHANGELOG_FILE.tmp"

changes=$(sed -n "/^## Changes Proposed$/,/^### Types of Changes$/p" "$PR_FILE" | \
sed '1d;$d' | grep -v '^- _' | \
 sed -E 's/\[[^][]*\]//g; s/\([^()]*\)//g' | \
 sed '/^[[:space:]]*$/d' | \
 sed -E 's/^[[:space:]]*([^-\s].*)$/- \1/')

# Format new PR entry - removing extra newline at the beginning
NEW_PR_ENTRY=$(cat << EOF
**$PR_TITLE**
$(if [[ "$PR_NUMBER" != "N/A" ]]; then echo "[$PR_NUMBER]($PR_LINK) by @$PR_AUTHOR"; else echo "PR link or number not found - by @$PR_AUTHOR"; fi)

$(if [[ -n "$changes" ]]; then echo "$changes"; fi)
EOF
)

# Check if Pull Requests section exists and append to it
if [[ -n "${EXISTING_SECTIONS["Pull Requests"]}" ]]; then
    {
        echo "## Pull Requests"
        # Trim trailing whitespace/newlines from existing content
        # and ensure exactly one newline before adding new entry
        echo -n "${EXISTING_SECTIONS["Pull Requests"]}" | sed -z 's/\n*$/\n\n/'
        echo -n "$NEW_PR_ENTRY"
        echo ""
    } >> "$CHANGELOG_FILE.tmp"
else
    {
        echo "## Pull Requests"
        echo ""
        echo -n "$NEW_PR_ENTRY"
        echo ""
    } >> "$CHANGELOG_FILE.tmp"
fi

mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"
rm "$TEMP_CHECKED"

echo "✅ CHANGELOG.md updated with merged content from: $PR_FILE"
