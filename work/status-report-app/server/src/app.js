import express from 'express';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readEnvironment } from './config/environment.js';
import { createReportController } from './controllers/reportController.js';
import { createJiraClient } from './services/jiraClient.js';
import { createReportService } from './services/reportService.js';
import { createReportRoutes } from './routes/reportRoutes.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const reportsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../reports');

app.use(express.json());
app.use((request, response, next) => {
	response.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (request.method === 'OPTIONS') return response.sendStatus(204);
	next();
});
app.use('/reports', express.static(reportsDirectory, { dotfiles: 'deny' }));

app.get('/api/health', (_request, response) => {
	response.json({ status: 'ok' });
});

const reportService = createReportService({
	jiraClient: {
		searchIssues: async (jql, fields) => {
			const config = readEnvironment();
			return createJiraClient(config).searchIssues(jql, fields);
		},
	},
	writeFile: async (filename, markdown) => {
		await mkdir(reportsDirectory, { recursive: true });
		await writeFile(path.join(reportsDirectory, filename), markdown, 'utf8');
	},
});

app.use('/api', createReportRoutes(createReportController(reportService)));

app.use((error, _request, response, _next) => {
	console.error(error.message);
	response.status(500).json({ error: { message: 'Unable to generate the report.' } });
});

app.listen(port, '0.0.0.0', () => {
	console.log(`Status report API listening on port ${port}`);
});
