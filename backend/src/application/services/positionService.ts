import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCORE_DECIMAL_PLACES = 1;

export const findCandidatesByPosition = async (positionId: number) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true, title: true }
    });

    if (!position) {
        throw new Error(`Position with ID ${positionId} not found`);
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        select: {
            candidateId: true,
            candidate: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            interviewStep: {
                select: {
                    name: true
                }
            },
            interviews: {
                select: {
                    score: true
                }
            }
        },
        orderBy: {
            applicationDate: 'desc'
        }
    });

    const candidates = applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null);

        const averageScore = scores.length > 0
            ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(SCORE_DECIMAL_PLACES))
            : null;

        return {
            candidateId: app.candidate.id,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep?.name ?? null,
            averageScore
        };
    });

    return {
        position,
        candidates
    };
};