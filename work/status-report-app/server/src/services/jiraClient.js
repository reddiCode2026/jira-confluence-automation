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
			throw new Error(`Jira request failed with status ${response.status}`);
		}

		const payload = await response.json();
		return payload.issues || [];
	}

	return { searchIssues };
}

export { createJiraClient };
