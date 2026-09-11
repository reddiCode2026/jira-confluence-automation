function createReportController(reportService) {
	return {
		generate: async (request, response, next) => {
			try {
				const projectKey = String(request.body?.projectKey || '').trim() || 'EPMCDMETST';
				const reportDate = String(request.body?.reportDate || '');
				if (!reportDate) return response.status(400).json({ error: { message: 'reportDate is required.' } });
				const report = await reportService.generate({ projectKey, reportDate });
				response.status(200).json({ ...report, reportFile: { path: `server/reports/${report.filename}`, url: `/reports/${report.filename}` } });
			} catch (error) {
				next(error);
			}
		},
	};
}

export { createReportController };
