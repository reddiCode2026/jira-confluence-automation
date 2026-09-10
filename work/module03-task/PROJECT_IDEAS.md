# Project Ideas: Jira/Confluence Automation

## 1. Automated Sprint Health Digest

**Problem it solves:** Managers spend time manually checking sprint progress across boards to spot at-risk work before standups. Issues like stalled tickets, missing estimates, or unassigned blockers often surface too late.

**Data needed:**
- Jira: issue status, assignee, story points, sprint field, last-updated timestamp, blocked/flagged label
- Jira: sprint start/end dates from the board configuration
- Output target: Confluence page or email/Slack summary

## 2. Cross-Project Dependency Tracker

**Problem it solves:** Managers overseeing multiple teams need visibility into cross-team blockers (e.g., Team A waiting on Team B). Today this is tracked manually in spreadsheets or standups, causing delays to surface late.

**Data needed:**
- Jira: issue links (blocks/is blocked by), linked issue project and status, priority
- Jira: component or team field to group by owning team
- Output target: Confluence dashboard or dependency report page

## 3. Release Notes Generator

**Problem it solves:** Preparing release notes for stakeholders is manual and error-prone, requiring someone to gather all completed tickets, categorize them, and write a summary in Confluence before each release.

**Data needed:**
- Jira: issues with a specific fix version, resolution status, issue type (bug/feature/task), summary text
- Confluence: target space and parent page for publishing the generated notes
- Output target: new or updated Confluence page per release version
