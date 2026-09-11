const utcDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function createReportWindow(reportDate) {
	if (!utcDatePattern.test(reportDate)) {
		throw new Error('reportDate must use YYYY-MM-DD format');
	}

	const end = new Date(`${reportDate}T23:59:59.999Z`);
	if (Number.isNaN(end.valueOf())) {
		throw new Error('reportDate must be a valid calendar date');
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
