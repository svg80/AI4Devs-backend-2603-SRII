// TEST GREEN - Tests against real database

import { Request, Response } from 'express';
import { updateCandidateStage } from '../application/services/candidateService';
import { updateCandidateStageController } from '../presentation/controllers/candidateController';

describe('updateCandidateStage - Service', () => {
    describe('updateCandidateStage(candidateId, input)', () => {
        it('should update stage successfully', async () => {
            const result = await updateCandidateStage(1, { applicationId: 1, newStepId: 2 });
            expect(result).toHaveProperty('applicationId');
            expect(result).toHaveProperty('candidateId');
            expect(result).toHaveProperty('positionId');
            expect(result).toHaveProperty('currentInterviewStep', 2);
        });

        it('should throw error when application does not exist', async () => {
            await expect(
                updateCandidateStage(1, { applicationId: 99999, newStepId: 2 })
            ).rejects.toThrow('Application not found');
        });

        it('should throw error when application does not belong to candidate', async () => {
            await expect(
                updateCandidateStage(99999, { applicationId: 1, newStepId: 2 })
            ).rejects.toThrow('Application does not belong to candidate');
        });

        it('should throw error when newStepId does not exist', async () => {
            await expect(
                updateCandidateStage(1, { applicationId: 1, newStepId: 99999 })
            ).rejects.toThrow('Interview step not found');
        });
    });
});

describe('updateCandidateStage - Controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRes = { status: mockStatus, json: mockJson };
    });

    const createRequest = (params: any, body: any): Partial<Request> => ({
        params,
        body,
    });

    describe('PUT /candidates/:id/stage', () => {
        it('should return 200 when update is successful', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
        });

        it('should return 400 when candidateId is invalid', async () => {
            mockReq = createRequest({ id: 'invalid' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('should return 400 when applicationId is invalid', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: 'invalid', newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('should return 400 when newStepId is invalid', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: 1, newStepId: 'invalid' });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('should return 404 when Application not found', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: 99999, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(404);
        });

        it('should return 403 when Application does not belong to candidate', async () => {
            mockReq = createRequest({ id: '99999' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(403);
        });
    });
});