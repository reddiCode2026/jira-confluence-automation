import { Router } from 'express';

function createReportRoutes(controller) {
	const router = Router();
	router.post('/reports', controller.generate);
	return router;
}

export { createReportRoutes };
