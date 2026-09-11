import { useState } from 'react';
import { generateReport } from './services/reportApi.js';

function todayUtc() {
	return new Date().toISOString().slice(0, 10);
}

export default function App() {
	const [projectKey, setProjectKey] = useState('EPMCDMETST');
	const [reportDate, setReportDate] = useState(todayUtc());
	const [report, setReport] = useState(null);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');
		setReport(null);
		setIsLoading(true);
		try {
			setReport(await generateReport({ projectKey: projectKey.trim(), reportDate }));
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main>
			<h1>Weekly Status Report</h1>
			<form onSubmit={handleSubmit}>
				<label>
					Project Key
					<input value={projectKey} onChange={(event) => setProjectKey(event.target.value)} required />
				</label>
				<label>
					Report Date
					<input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} required />
				</label>
				<button type="submit" disabled={isLoading}>
					{isLoading ? 'Generating...' : 'Generate report'}
				</button>
			</form>
			{error && <p role="alert">{error}</p>}
			{report && (
				<section>
					<p>Report generated for {report.project.key} on {reportDate}.</p>
					<a href={report.reportFile.url} download={report.reportFile.path.split('/').pop()}>Download Markdown</a>
					<pre>{report.markdown}</pre>
				</section>
			)}
		</main>
	);
}
export default function App() {
	return (
		<main>
			<h1>Weekly Status Report</h1>
			<p>Docker-local React client is running.</p>
		</main>
	);
}
