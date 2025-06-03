#!/bin/bash

# Usage: ./update_changelog.sh path/to/pr.md pr_title pr_author pr_number pr_link [branch_name]

# Configuration options - set these to customize your changelog
# Set these variables to 'true' or 'false' to enable/disable features
SHOW_ACCUMULATED_PROPOSED_CHANGES=true  # Show combined "Proposed Changes" section
SHOW_ACCUMULATED_CHECKED_HEADINGS=true  # Show content under each checked heading
SHOW_PR_CHANGES=true                   # Include PR changes in PR entries
SHOW_PR_DESCRIPTION=false               # Include PR description in PR entries

PR_FILE="$1"
PR_TITLE="$2"    # PR title directly from GitHub 
PR_AUTHOR="$3"
PR_NUMBER="$4"
PR_LINK="$5"
BRANCH_NAME_OVERRIDE="$6"  # Optional branch name from GitHub Action

# Make sure we have the required parameters
if [[ ! -f "$PR_FILE" ]]; then
  echo "Error: PR file '$PR_FILE' not found."
  exit 1
fi

if [[ -z "$PR_TITLE" ]]; then
  echo "Error: PR title is required."
  exit 1
fi

# Determine changelog filename
BRANCH_NAME="$BRANCH_NAME_OVERRIDE"
if [[ -z "$BRANCH_NAME" ]]; then
    # Fallback to default if branch name not provided
    echo "No branch name provided, using default name"
    CHANGELOG_FILE="CHANGELOG.md"
else
    # Create changelog filename based on branch name
    echo "Using branch name: $BRANCH_NAME"
    CHANGELOG_FILE="CHANGELOG_${BRANCH_NAME}.md"
fi

TEMP_CHECKED="types_checked.txt"
TEMP_ALL_TYPES="all_types.txt"

# Extract all types from the PR file's "Types of Changes" section
awk '/^### Types of Changes/,/^---/' "$PR_FILE" | grep '^\s*- \[[ x]\]' | sed -E 's/^\s*- \[[x ]\] //' > "$TEMP_ALL_TYPES"
readarray -t ALL_TYPES < "$TEMP_ALL_TYPES"

# Step 1: Extract checked items from PR
awk '/^### Types of Changes/,/^---/' "$PR_FILE" | grep '\[x\]' | sed 's/- \[x\] //' | sed 's/^ *//' > "$TEMP_CHECKED"

# Step 2: Merge in already-checked items from existing changelog to preserve them
if [[ -f "$CHANGELOG_FILE" ]] && grep -q "^### Types of Changes" "$CHANGELOG_FILE"; then
  awk '/^### Types of Changes/,/^$/' "$CHANGELOG_FILE" | grep '\[x\]' | sed 's/- \[x\] //' >> "$TEMP_CHECKED"
fi

# Deduplicate all checked types
sort -u "$TEMP_CHECKED" -o "$TEMP_CHECKED"

# Step 3: Extract current non-checklist section content
declare -A EXISTING_SECTIONS
current=""

if [[ -f "$CHANGELOG_FILE" ]]; then
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
fi

# Extract PR description if needed
if [[ "$SHOW_PR_DESCRIPTION" == "true" ]]; then
  PR_DESCRIPTION=$(awk '/^## Description of the Issue/,/^---/ {if (!/^## Description of the Issue/ && !/^---/) print}' "$PR_FILE" | 
    grep -v "Related Task" | 
    sed -E '/^\s*$/d')
fi

# Extract changes proposed from the PR
pr_changes=$(sed -n "/^## Changes Proposed$/,/^### Types of Changes$/p" "$PR_FILE" | \
sed '1d;$d' | sed -E '/^- \(/d' | grep -v '^- _' | \
 sed -E 's/\[[^][]*\]//g; s/\([^()]*\)//g' | \
 sed '/^[[:space:]]*$/d' | \
 sed -E 's/^([^-].*)$/- \1/')

# Step 4: Create updated changelog
{
    # Always show Types of Changes
    echo "### Types of Changes"
    for type in "${ALL_TYPES[@]}"; do
        if grep -Fxq "$type" "$TEMP_CHECKED"; then
        echo "- [x] $type"
        else
        echo "- [ ] $type"
        fi
    done
    echo ""

    # Conditionally add Proposed Changes section
    if [[ "$SHOW_ACCUMULATED_PROPOSED_CHANGES" == "true" ]]; then
        echo "### Proposed Changes"
        # Collect existing proposed changes if present
        existing_proposed=$(echo "${EXISTING_SECTIONS["Proposed Changes"]}" | sed '/^[[:space:]]*$/d')
        if [[ -n "$existing_proposed" ]]; then
            echo "$existing_proposed"
        fi
        
        # Add new proposed changes from this PR
        proposed_points=$(awk '/^## Changes Proposed/,/^### Types of Changes/ {if (!/^## Changes Proposed/ && !/^### Types of Changes/) print}' "$PR_FILE" | \
            sed -E '/^- \(/d' | \
            sed -E 's/\[[^][]*\]//g; s/\([^()]*\)//g' | \
            sed '/^[[:space:]]*$/d' | \
            sed -E 's/^([^-].*)$/- \1/' | \
            sed -E 's/^[[:space:]]*([^-].*)$/- \1/')
            
        # Remove duplicate dashes and trim empty lines
        proposed_points=$(echo "$proposed_points" | sed -E '/^-\s*$/d' | sed '/^[[:space:]]*$/d')
        if [[ -n "$proposed_points" ]]; then
            echo "$proposed_points"
        fi
        echo ""
    fi

    # Conditionally show content under each checked heading
    if [[ "$SHOW_ACCUMULATED_CHECKED_HEADINGS" == "true" ]]; then
        for type in "${ALL_TYPES[@]}"; do
            # Process if this type is checked in either the current PR OR was previously checked
            if grep -Fxq "$type" "$TEMP_CHECKED"; then
                # Extract content from current PR only if it's checked in this PR
                pr_checked=$(awk '/^### Types of Changes/,/^---/' "$PR_FILE" | grep '\[x\]' | sed 's/- \[x\] //' | sed 's/^ *//')
                
                if echo "$pr_checked" | grep -Fxq "$type"; then
                    # This type is checked in current PR, extract its content
                    section_content=$(awk -v section="### $type" '
                        BEGIN {found=0}
                        $0 ~ "^"section {found=1; next}
                        found && /^---/ {exit}
                        found && /^### / {exit}
                        found {print}
                    ' "$PR_FILE" \
                    | sed -E '/^- \(/d' \
                    | sed -E '/^- _/d' \
                    | sed -E 's/\[[^][]*\]//g; s/\([^()]*\)//g' \
                    | sed '/^[[:space:]]*$/d' \
                    | sed -E '/^-[[:space:]]*$/d' \
                    | sed -E 's/^([^-].*)$/- \1/')
                else
                    # This type was checked before but not in current PR, no new content
                    section_content=""
                fi

                existing_content="${EXISTING_SECTIONS["$type"]}"
                cleaned_existing=$(echo "$existing_content" | sed -E '/^- _/d' | sed -E '/^- \(/d' | sed -E '/^-[[:space:]]*$/d' | sed '/^[[:space:]]*$/d' | sed -E 's/^([^-].*)$/- \1/')
                cleaned_new=$(echo "$section_content" | sed '/^[[:space:]]*$/d')

                if [[ -n "$cleaned_existing" || -n "$cleaned_new" ]]; then
                    echo "### $type"
                    if [[ -n "$cleaned_existing" ]]; then
                        echo "$cleaned_existing"
                    fi
                    if [[ -n "$cleaned_new" ]]; then
                        echo "$cleaned_new"
                    fi
                    echo ""
                fi
            fi
        done
    fi

    # Build PR entry based on configuration options
    NEW_PR_ENTRY="**$PR_TITLE**"
    NEW_PR_ENTRY+=$'\n'
    
    if [[ "$PR_NUMBER" != "N/A" && -n "$PR_NUMBER" ]]; then 
        NEW_PR_ENTRY+="[$PR_NUMBER]($PR_LINK) by @$PR_AUTHOR"
    else 
        NEW_PR_ENTRY+="PR link or number not found - by @$PR_AUTHOR"
    fi
    NEW_PR_ENTRY+=$'\n'
    
    # Add description if enabled
    if [[ "$SHOW_PR_DESCRIPTION" == "true" && -n "$PR_DESCRIPTION" ]]; then
        NEW_PR_ENTRY+=$'\n'
        NEW_PR_ENTRY+="**Description:**"
        NEW_PR_ENTRY+=$'\n'
        NEW_PR_ENTRY+="$PR_DESCRIPTION"
        NEW_PR_ENTRY+=$'\n'
    fi
    
    # Add changes if enabled
    if [[ "$SHOW_PR_CHANGES" == "true" && -n "$pr_changes" ]]; then
        NEW_PR_ENTRY+=$'\n'
        NEW_PR_ENTRY+="$pr_changes"
        NEW_PR_ENTRY+=$'\n'
    fi

    # Add Pull Requests section
    echo "## Pull Requests"
    echo ""  # Exactly one newline
    
    # Add existing PR entries if present
    if [[ -n "${EXISTING_SECTIONS["Pull Requests"]}" ]]; then
        # Trim both leading and trailing whitespace/newlines from existing content
        # This ensures we don't get duplicate newlines when appending
        existing_pr_content=$(echo "${EXISTING_SECTIONS["Pull Requests"]}" | sed -z 's/^\n*//' | sed -z 's/\n*$//')
        echo "$existing_pr_content"
        echo ""  # Add a blank line between existing entries and new entry
    fi
    
    # Add the new PR entry
    echo "$NEW_PR_ENTRY"
    
} > "$CHANGELOG_FILE.tmp"

mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"
rm "$TEMP_CHECKED"
rm "$TEMP_ALL_TYPES"

echo "✅ $CHANGELOG_FILE updated with merged content from: $PR_FILE"
echo "PR Title: $PR_TITLE"
echo "Configuration used:"
echo "- Show accumulated proposed changes: $SHOW_ACCUMULATED_PROPOSED_CHANGES"
echo "- Show accumulated checked headings: $SHOW_ACCUMULATED_CHECKED_HEADINGS"
echo "- Show PR changes: $SHOW_PR_CHANGES"
echo "- Show PR description: $SHOW_PR_DESCRIPTION"
