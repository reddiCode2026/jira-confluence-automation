import express from 'express';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get('/api/health', (_request, response) => {
	response.json({ status: 'ok' });
});

app.get('/api/reports', (_request, response) => {
	response.status(405).json({
		error: { message: 'Use POST /api/reports to generate a report.' }
	});
});

app.listen(port, '0.0.0.0', () => {
	console.log(`Status report API listening on port ${port}`);
});
