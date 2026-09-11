function escapeMarkdown(value) {
	return String(value ?? '').replace(/[\\`*_{}[\]()#+.!|<>-]/g, '\\$&').replace(/\r?\n/g, ' ');
}

function renderIssue(issue) {
	return `- ${escapeMarkdown(issue.key)} | ${escapeMarkdown(issue.summary)} | ${escapeMarkdown(issue.issueType)} | ${escapeMarkdown(issue.status)} | ${escapeMarkdown(issue.assignee)} | ${escapeMarkdown(issue.reporter)}`;
}

function renderMarkdownReport({ projectKey, reportDate, window, createdItems, completed, blockers }) {
	const lines = [
		'# Weekly Status Report',
		'',
		`- Project Key: ${escapeMarkdown(projectKey)}`,
		`- Report Date: ${escapeMarkdown(reportDate)}`,
		`- Window: ${escapeMarkdown(window.start)} to ${escapeMarkdown(window.end)}`,
		`- Generated: ${new Date().toISOString()}`,
		'',
		'## Created User Stories and Bugs',
	];
	lines.push(...(createdItems.length ? createdItems.map(renderIssue) : ['None']));
	lines.push('', '## Completed This Week');
	lines.push(...(completed.length ? completed.map(renderIssue) : ['None']));

	if (blockers.length) {
		lines.push('', '## Blockers / Impediments', ...blockers.map(renderIssue));
	}

	return `${lines.join('\n')}\n`;
}

export { renderMarkdownReport };
