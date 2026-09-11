const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function generateReport({ projectKey, reportDate }) {
	const response = await fetch(`${apiBaseUrl}/reports`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ projectKey, reportDate }),
	});

	const responseText = await response.text();
	let payload = {};
	try {
		payload = responseText ? JSON.parse(responseText) : {};
	} catch {
		payload = {};
	}
	if (!response.ok) {
		throw new Error(payload.error?.message || `Report generation failed with status ${response.status}.`);
	}
	return payload;
}

export { generateReport };
