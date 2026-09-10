# Weekly Status Report Instructions

Use `template.md` to prepare a stakeholder-facing report for one Jira project.
The report covers a rolling seven-day period and should describe the current
state clearly enough for stakeholders to understand progress, risks, and needed
actions.

## 1. Set the reporting period

1. Use the seven days immediately before the report is generated.
2. Enter the start and end dates in `YYYY-MM-DD` format.
3. Enter the PM's name and the generation date.
4. Replace `[Project Key]` with the Jira project key.

## 2. Set the overall health

Choose one status using these rules:

- **Red:** At least one open issue is flagged as an impediment or has the
  `blocked` label.
- **Amber:** No blockers are present, but progress is below 70% of the expected
  pace.
- **Green:** No blockers are present and progress is at least 70% of the
  expected pace.

Add one sentence explaining the result. Mention the most important risk or
progress signal, not a general statement such as "The project is on track."

## 3. Add completed work

List issues resolved during the reporting period. For each issue, include:

- Jira issue key
- Short summary
- Issue type, such as Story, Bug, or Task

If no issues were completed, replace the sample bullets with `None reported.`

## 4. Add in-progress and at-risk work

List currently open issues in progress. Include the issue status and story-point
estimate when available. Highlight work that may miss its target or needs
attention. If there are no relevant items, use `None reported.`

## 5. Add blockers and impediments

Include open issues that match either of these Jira signals:

- The Flagged field is set to `Impediment`.
- The issue has the `blocked` label.

For each blocker, state the owner or responsible team and the action needed to
remove it. If none exist, replace the sample bullet with `No blockers reported.`

## 6. Complete the metrics table

Use the Jira issue data in scope to calculate:

- **Story points completed this week:** Points on issues completed during the
  reporting period.
- **Total story points in scope:** Completed plus currently open points included
  in the report.
- **Completion rate:** Completed points divided by total points in scope,
  multiplied by 100. If the total is zero, enter `N/A`.
- **Status counts:** Number of issues in To Do, In Progress, and Done categories.

Round the completion rate to a whole percentage unless more precision is useful.

## 7. Final review

Before sharing the report:

1. Remove unused placeholder bullets and bracketed instructions.
2. Confirm every Jira key links to the correct issue or is easy to search.
3. Make sure blocker actions have a clear owner.
4. Check that the health status agrees with the blocker and metric data.
5. Confirm that the report contains no credentials, API tokens, or confidential
   information that stakeholders should not receive.
