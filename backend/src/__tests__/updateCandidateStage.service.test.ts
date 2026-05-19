// TEST GREEN - Tests against real database

import { PrismaClient } from '@prisma/client';
import { Candidate } from '../domain/models/Candidate';
import { Application } from '../domain/models/Application';
import { InterviewStep } from '../domain/models/InterviewStep';
import { Position } from '../domain/models/Position';
import { Company } from '../domain/models/Company';
import { InterviewFlow } from '../domain/models/InterviewFlow';
import { InterviewType } from '../domain/models/InterviewType';

const prisma = new PrismaClient();

interface TestFixtures {
    company: any;
    interviewFlow: any;
    interviewType: any;
    step1: any;
    step2: any;
    position: any;
    candidate: any;
    application: any;
}

async function createTestFixtures(): Promise<TestFixtures> {
    const company = await new Company({ name: 'Test Company' }).save();
    const interviewFlow = await new InterviewFlow({ description: 'Test Flow' }).save();
    const interviewType = await new InterviewType({ name: 'Technical' }).save();

    const step1 = await new InterviewStep({
        interviewFlowId: interviewFlow.id,
        interviewTypeId: interviewType.id,
        name: 'Initial Review',
        orderIndex: 1,
    }).save();

    const step2 = await new InterviewStep({
        interviewFlowId: interviewFlow.id,
        interviewTypeId: interviewType.id,
        name: 'Technical Interview',
        orderIndex: 2,
    }).save();

    const position = await new Position({
        companyId: company.id,
        interviewFlowId: interviewFlow.id,
        title: 'Software Engineer',
        description: 'Test position',
        status: 'OPEN',
        isVisible: true,
        location: 'Remote',
        jobDescription: 'Job description',
    }).save();

    const candidate = await new Candidate({
        firstName: 'Test',
        lastName: 'Candidate',
        email: `test-${Date.now()}@example.com`,
    }).save();

    const application = await new Application({
        positionId: position.id,
        candidateId: candidate.id,
        applicationDate: new Date(),
        currentInterviewStep: step1.id,
    }).save();

    return { company, interviewFlow, interviewType, step1, step2, position, candidate, application };
}

async function cleanupTestFixtures(fixtures: TestFixtures): Promise<void> {
    await prisma.application.deleteMany({ where: { id: fixtures.application.id } }).catch(() => {});
    await prisma.candidate.deleteMany({ where: { id: fixtures.candidate.id } }).catch(() => {});
    await prisma.position.deleteMany({ where: { id: fixtures.position.id } }).catch(() => {});
    await prisma.interviewStep.deleteMany({ where: { id: { in: [fixtures.step1.id, fixtures.step2.id] } } }).catch(() => {});
    await prisma.interviewType.deleteMany({ where: { id: fixtures.interviewType.id } }).catch(() => {});
    await prisma.interviewFlow.deleteMany({ where: { id: fixtures.interviewFlow.id } }).catch(() => {});
    await prisma.company.deleteMany({ where: { id: fixtures.company.id } }).catch(() => {});
}

describe('updateCandidateStage - Service', () => {
    let fixtures: TestFixtures;

    beforeAll(async () => {
        fixtures = await createTestFixtures();
    });

    afterAll(async () => {
        await cleanupTestFixtures(fixtures);
        await prisma.$disconnect();
    });

    describe('updateCandidateStage(candidateId, input)', () => {
        it('should update stage successfully', async () => {
            const { updateCandidateStage } = await import('../application/services/candidateService');
            const result = await updateCandidateStage(fixtures.candidate.id, {
                applicationId: fixtures.application.id,
                newStepId: fixtures.step2.id,
            });
            expect(result).toHaveProperty('applicationId');
            expect(result).toHaveProperty('candidateId');
            expect(result).toHaveProperty('positionId');
            expect(result.currentInterviewStep).toBe(fixtures.step2.id);
        });

        it('should throw error when application does not exist', async () => {
            const { updateCandidateStage } = await import('../application/services/candidateService');
            await expect(
                updateCandidateStage(fixtures.candidate.id, { applicationId: 99999, newStepId: fixtures.step2.id })
            ).rejects.toThrow('Application not found');
        });

        it('should throw error when application does not belong to candidate', async () => {
            const { updateCandidateStage } = await import('../application/services/candidateService');
            const otherCandidate = await new Candidate({
                firstName: 'Other',
                lastName: 'Candidate',
                email: `other-${Date.now()}@example.com`,
            }).save();
            const otherApplication = await new Application({
                positionId: fixtures.position.id,
                candidateId: otherCandidate.id,
                applicationDate: new Date(),
                currentInterviewStep: fixtures.step1.id,
            }).save();
            try {
                await expect(
                    updateCandidateStage(fixtures.candidate.id, { applicationId: otherApplication.id, newStepId: fixtures.step2.id })
                ).rejects.toThrow('Application does not belong to candidate');
            } finally {
                await prisma.application.deleteMany({ where: { id: otherApplication.id } }).catch(() => {});
                await prisma.candidate.deleteMany({ where: { id: otherCandidate.id } }).catch(() => {});
            }
        });

        it('should throw Candidate not found when candidate does not exist', async () => {
            const { updateCandidateStage } = await import('../application/services/candidateService');
            await expect(
                updateCandidateStage(99999, { applicationId: fixtures.application.id, newStepId: fixtures.step2.id })
            ).rejects.toThrow('Candidate not found');
        });

        it('should throw error when newStepId does not exist', async () => {
            const { updateCandidateStage } = await import('../application/services/candidateService');
            await expect(
                updateCandidateStage(fixtures.candidate.id, { applicationId: fixtures.application.id, newStepId: 99999 })
            ).rejects.toThrow('Interview step not found');
        });
    });
});