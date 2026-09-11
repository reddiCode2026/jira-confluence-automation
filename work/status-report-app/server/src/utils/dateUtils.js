const utcDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function createReportWindow(reportDate) {
	if (!utcDatePattern.test(reportDate)) {
		const error = new Error('reportDate must use YYYY-MM-DD format');
		error.code = 'INVALID_REPORT_DATE';
		error.statusCode = 400;
		throw error;
	}

	const end = new Date(`${reportDate}T23:59:59.999Z`);
	if (Number.isNaN(end.valueOf())) {
		const error = new Error('reportDate must be a valid calendar date');
		error.code = 'INVALID_REPORT_DATE';
		error.statusCode = 400;
		throw error;
	}

	const start = new Date(end);
	start.setUTCDate(start.getUTCDate() - 6);

	return {
		start: start.toISOString(),
		end: end.toISOString(),
		timezone: 'UTC',
	};
}

function createReportFilename(date = new Date()) {
	const iso = date.toISOString();
	return `status_report_${iso.slice(0, 10)}_${iso.slice(11, 19).replaceAll(':', '-')}Z.md`;
}

export { createReportFilename, createReportWindow };
