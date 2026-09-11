import { createReportFilename, createReportWindow } from '../utils/dateUtils.js';
import { renderMarkdownReport } from '../templates/markdownReport.js';

const reportFields = [
	'project', 'issuetype', 'summary', 'status', 'assignee', 'created',
	'reporter', 'resolutiondate', 'customfield_10004', 'customfield_10001',
	'labels', 'flagged'
];

function normalizeIssue(issue) {
	const fields = issue.fields || {};
	return {
		key: issue.key,
		project: fields.project?.key || '',
		issueType: fields.issuetype?.name || '',
		summary: fields.summary || '',
		status: fields.status?.name || '',
		statusCategory: fields.status?.statusCategory?.name || '',
		assignee: fields.assignee?.displayName || 'Unassigned',
		created: fields.created,
		reporter: fields.reporter?.displayName || 'Unknown',
		storyPoints: Number.isFinite(Number(fields.customfield_10004))
			? Number(fields.customfield_10004)
			: null,
		resolvedAt: fields.resolutiondate || null,
		isBlocked: fields.flagged === true || (fields.labels || []).includes('blocked'),
	};
}

function createReportService({ jiraClient, writeFile = null }) {
	return {
		async generate({ projectKey, reportDate }) {
			const window = createReportWindow(reportDate);
			const jql = `project = ${projectKey} AND issuetype in (Story, Bug) AND created >= "${window.start}" AND created <= "${window.end}"`;
			const issues = (await jiraClient.searchIssues(jql, reportFields))
				.map(normalizeIssue)
				.filter((issue, index, all) => all.findIndex((candidate) => candidate.key === issue.key) === index);

			const createdItems = issues.filter((issue) => ['Story', 'Bug'].includes(issue.issueType));
			const completed = issues.filter((issue) => issue.status === 'Done' && issue.resolvedAt);
			const blockers = issues.filter((issue) => issue.isBlocked && issue.status !== 'Done');
			const markdown = renderMarkdownReport({ projectKey, reportDate, window, createdItems, completed, blockers });
			const filename = createReportFilename();
			if (writeFile) await writeFile(filename, markdown);

			return {
				project: { key: projectKey },
				window,
				sections: { createdItems, completed, blockers },
				markdown,
				filename,
			};
		},
	};
}

export { createReportService, normalizeIssue };
