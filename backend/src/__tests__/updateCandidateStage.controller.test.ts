// Controller tests - mock updateCandidateStage

import { Request, Response } from 'express';

jest.mock('../application/services/candidateService', () => ({
    updateCandidateStage: jest.fn(),
}));

import { updateCandidateStageController } from '../presentation/controllers/candidateController';
import * as candidateService from '../application/services/candidateService';

const mockedUpdateCandidateStage = candidateService.updateCandidateStage as jest.Mock;

describe('updateCandidateStage - Controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockedUpdateCandidateStage.mockReset();
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
            mockedUpdateCandidateStage.mockResolvedValue({
                applicationId: 1,
                candidateId: 1,
                positionId: 1,
                currentInterviewStep: 2,
            });
            mockReq = createRequest({ id: '1' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockedUpdateCandidateStage).toHaveBeenCalledWith(1, { applicationId: 1, newStepId: 2, notes: undefined });
        });

        it('should return 400 when candidateId is invalid', async () => {
            mockReq = createRequest({ id: 'invalid' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockedUpdateCandidateStage).not.toHaveBeenCalled();
        });

        it('should return 400 when candidateId contains non-numeric characters', async () => {
            mockReq = createRequest({ id: '12abc' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockedUpdateCandidateStage).not.toHaveBeenCalled();
        });

        it('should return 400 when applicationId is invalid', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: 'invalid', newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockedUpdateCandidateStage).not.toHaveBeenCalled();
        });

        it('should return 400 when applicationId contains non-numeric characters', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: '12abc', newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockedUpdateCandidateStage).not.toHaveBeenCalled();
        });

        it('should return 400 when newStepId is invalid', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: 1, newStepId: 'invalid' });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockedUpdateCandidateStage).not.toHaveBeenCalled();
        });

        it('should return 400 when newStepId contains non-numeric characters', async () => {
            mockReq = createRequest({ id: '1' }, { applicationId: 1, newStepId: '12abc' });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockedUpdateCandidateStage).not.toHaveBeenCalled();
        });

        it('should return 404 when Application not found', async () => {
            mockedUpdateCandidateStage.mockRejectedValue(new Error('Application not found'));
            mockReq = createRequest({ id: '1' }, { applicationId: 99999, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(404);
        });

        it('should return 404 when Candidate not found', async () => {
            mockedUpdateCandidateStage.mockRejectedValue(new Error('Candidate not found'));
            mockReq = createRequest({ id: '99999' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(404);
        });

        it('should return 403 when Application does not belong to candidate', async () => {
            mockedUpdateCandidateStage.mockRejectedValue(new Error('Application does not belong to candidate'));
            mockReq = createRequest({ id: '99999' }, { applicationId: 1, newStepId: 2 });
            await updateCandidateStageController(mockReq as Request, mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(403);
        });
    });
});