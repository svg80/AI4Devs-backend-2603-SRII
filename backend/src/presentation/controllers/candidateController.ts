import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage } from '../../application/services/candidateService';
import { STAGE_ERRORS, HTTP_STATUS } from '../../application/constants';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };

interface UpdateStageBody {
    applicationId: number | string;
    newStepId: number | string;
    notes?: string;
}

export const updateCandidateStageController = async (req: Request, res: Response): Promise<void> => {
    try {
        const candidateIdParam = req.params.id;
        const candidateId = parseInt(candidateIdParam, 10);

        if (isNaN(candidateId) || candidateId <= 0) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid ID format' });
            return;
        }

        const body = req.body as UpdateStageBody;
        const applicationId = parseInt(String(body.applicationId), 10);
        const newStepId = parseInt(String(body.newStepId), 10);

        if (isNaN(applicationId) || applicationId <= 0) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid application ID format' });
            return;
        }

        if (isNaN(newStepId) || newStepId <= 0) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid newStepId format' });
            return;
        }

        const result = await updateCandidateStage(candidateId, {
            applicationId,
            newStepId,
            notes: body.notes,
        });

        res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (message === STAGE_ERRORS.APP_NOT_FOUND || message === STAGE_ERRORS.STEP_NOT_FOUND) {
            res.status(HTTP_STATUS.NOT_FOUND).json({ error: message });
            return;
        }

        if (message === STAGE_ERRORS.APP_NOT_BELONG) {
            res.status(HTTP_STATUS.FORBIDDEN).json({ error: message });
            return;
        }

        if (message === STAGE_ERRORS.STEP_WRONG_FLOW || message === STAGE_ERRORS.POSITION_CLOSED) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ error: message });
            return;
        }

        res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: 'Internal Server Error' });
    }
};