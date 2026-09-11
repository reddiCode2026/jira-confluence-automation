function createJiraClient(config, fetchImplementation = fetch) {
	async function searchIssues(jql, fields) {
		const response = await fetchImplementation(`${config.jiraSiteUrl}/rest/api/3/search`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Basic ${Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64')}`,
			},
			body: JSON.stringify({ jql, fields, maxResults: 100 }),
		});

		if (!response.ok) {
			const error = new Error(`Jira request failed with status ${response.status}`);
			error.code = response.status === 401 ? 'JIRA_AUTHENTICATION_FAILED' : 'JIRA_UPSTREAM_FAILED';
			error.statusCode = response.status === 401 ? 502 : 502;
			throw error;
		}

		const payload = await response.json();
		return payload.issues || [];
	}

	return { searchIssues };
}

export { createJiraClient };
