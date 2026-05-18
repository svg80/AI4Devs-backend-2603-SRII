import { Request, Response } from 'express';
import { findCandidatesByPosition } from '../../application/services/positionService';

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await findCandidatesByPosition(id);

        res.json({
            positionId: result.position.id,
            positionTitle: result.position.title,
            candidates: result.candidates
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: 'Position not found' });
            }
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};