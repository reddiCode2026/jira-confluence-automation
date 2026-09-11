const requiredVariables = ['JIRA_SITE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];

function readEnvironment(source = process.env) {

	const missingVariables = requiredVariables.filter((name) => !source[name]);
	if (missingVariables.length > 0) {
		throw new Error(`Missing required configuration: ${missingVariables.join(', ')}`);
	}

	return {
		jiraSiteUrl: source.JIRA_SITE_URL.replace(/\/$/, ''),
		jiraEmail: source.JIRA_EMAIL,
		jiraApiToken: source.JIRA_API_TOKEN,
		defaultProjectKey: source.JIRA_PROJECT_KEY || 'EPMCDMETST',
		port: Number(source.PORT || 3000),
	};
}

export { readEnvironment };
