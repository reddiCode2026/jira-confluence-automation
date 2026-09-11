const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function generateReport({ projectKey, reportDate }) {
	const response = await fetch(`${apiBaseUrl}/reports`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ projectKey, reportDate }),
	});

	const payload = await response.json();
	if (!response.ok) {
		throw new Error(payload.error?.message || 'Unable to generate the report.');
	}
	return payload;
}

export { generateReport };
