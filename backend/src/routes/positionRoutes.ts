import { Router, Request, Response, NextFunction } from 'express';
import { getCandidatesByPosition } from '../presentation/controllers/positionController';

const router = Router();

function validatePositionId(req: Request, res: Response, next: NextFunction): void {
    const idParam = req.params.id;
    if (!/^\d+$/.test(idParam)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    const id = parseInt(idParam, 10);
    if (id <= 0) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    next();
}

router.get('/:id/candidates', validatePositionId, getCandidatesByPosition);

export default router;