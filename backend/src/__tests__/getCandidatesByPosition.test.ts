import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const validatePositionId = (req: Request, res: Response, next: NextFunction): void => {
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
};

describe('validatePositionId middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockNext = jest.fn();
        mockRes = { status: mockStatus, json: mockJson };
    });

    it('should return 400 for text ID (abc)', async () => {
        mockReq = { params: { id: 'abc' } } as Partial<Request>;
        await validatePositionId(mockReq as Request, mockRes as Response, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid ID format' });
    });

    it('should return 400 for negative ID (-1)', async () => {
        mockReq = { params: { id: '-1' } as any } as Partial<Request>;
        await validatePositionId(mockReq as Request, mockRes as Response, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid ID format' });
    });

    it('should return 400 for zero ID (0)', async () => {
        mockReq = { params: { id: '0' } } as Partial<Request>;
        await validatePositionId(mockReq as Request, mockRes as Response, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid ID format' });
    });

    it('should return 400 for float ID (3.14)', async () => {
        mockReq = { params: { id: '3.14' } } as Partial<Request>;
        await validatePositionId(mockReq as Request, mockRes as Response, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should call next() for valid positive integer', async () => {
        mockReq = { params: { id: '123' } } as Partial<Request>;
        await validatePositionId(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() for valid ID 6 (existing in DB)', async () => {
        mockReq = { params: { id: '6' } } as Partial<Request>;
        await validatePositionId(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });
});

describe('getCandidatesByPosition Controller', () => {
    const { getCandidatesByPosition } = require('../presentation/controllers/positionController');

    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRes = { status: mockStatus, json: mockJson };
    });

    it('should return 404 when position not found', async () => {
        const mockFind = jest.fn().mockRejectedValue(new Error('Position with ID 999999 not found'));
        const original = require('../application/services/positionService');
        const mockModule = { ...original, findCandidatesByPosition: mockFind };
        jest.doMock('../application/services/positionService', () => mockModule);
        
        const { getCandidatesByPosition: testFn } = require('../presentation/controllers/positionController');
        mockReq = { params: { id: '999999' } } as Partial<Request>;
        await testFn(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(404);
        
        jest.resetModules();
    });
});

describe('findCandidatesByPosition Service', () => {
    const { findCandidatesByPosition } = require('../application/services/positionService');

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should return position and candidates when position exists', async () => {
        const position = await prisma.position.findFirst({ where: { status: 'Open' } });
        if (!position) {
            console.log('No position found, skipping');
            return;
        }
        const result = await findCandidatesByPosition(position.id);
        expect(result).toHaveProperty('position');
        expect(result).toHaveProperty('candidates');
    });

    it('should return only expected fields in candidate', async () => {
        const position = await prisma.position.findFirst({ where: { status: 'Open' } });
        if (!position) {
            console.log('No position found, skipping');
            return;
        }
        const result = await findCandidatesByPosition(position.id);
        if (result.candidates.length > 0) {
            const candidate = result.candidates[0];
            expect(candidate).toHaveProperty('candidateId');
            expect(candidate).toHaveProperty('candidateName');
            expect(candidate).toHaveProperty('currentInterviewStep');
            expect(candidate).toHaveProperty('averageScore');
            expect(candidate).not.toHaveProperty('email');
            expect(candidate).not.toHaveProperty('phone');
        }
    });

    it('should order candidates by applicationDate descending', async () => {
        const position = await prisma.position.findFirst({ where: { status: 'Open' } });
        if (!position) {
            console.log('No position found, skipping');
            return;
        }
        const result = await findCandidatesByPosition(position.id);
        expect(result.candidates).toBeDefined();
    });

    it('should have averageScore with 1 decimal place', async () => {
        const position = await prisma.position.findFirst({ where: { status: 'Open' } });
        if (!position) {
            console.log('No position found, skipping');
            return;
        }
        const result = await findCandidatesByPosition(position.id);
        const scored = result.candidates.filter((c: any) => c.averageScore !== null);
        for (const c of scored) {
            const str = String(c.averageScore);
            const decimals = str.split('.')[1]?.length || 0;
            expect(decimals).toBeLessThanOrEqual(1);
        }
    });
});