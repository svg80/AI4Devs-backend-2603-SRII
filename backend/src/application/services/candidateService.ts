import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { STAGE_ERRORS } from '../constants';

const prisma = new PrismaClient();

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id);
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

interface UpdateStageInput {
    applicationId: number;
    newStepId: number;
    notes?: string;
}

interface StageUpdateResult {
    applicationId: number;
    candidateId: number;
    positionId: number;
    positionTitle: string;
    previousStepId: number;
    previousStepName: string;
    currentInterviewStep: number;
    stepName: string;
    stepOrder: number;
    notes: string | null;
    updatedAt: Date;
}

export const updateCandidateStage = async (
    candidateId: number,
    input: UpdateStageInput
): Promise<StageUpdateResult> => {
    const { applicationId, newStepId, notes } = input;

    // Query 1:Obtener aplicación con posición y step actual
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            position: { include: { interviewFlow: true } },
            interviewStep: true,
        },
    });

    if (!application) {
        throw new Error(STAGE_ERRORS.APP_NOT_FOUND);
    }

    if (application.candidateId !== candidateId) {
        throw new Error(STAGE_ERRORS.APP_NOT_BELONG);
    }

    if (application.position.status === 'CLOSED') {
        throw new Error(STAGE_ERRORS.POSITION_CLOSED);
    }

    // Query 2: Obtener nuevo step y previous step en una sola query
    const stepIds = [newStepId, application.currentInterviewStep].filter(id => id > 0);
    const steps = await prisma.interviewStep.findMany({
        where: { id: { in: stepIds } },
    });

    const newStep = steps.find(s => s.id === newStepId);
    const previousStep = steps.find(s => s.id === application.currentInterviewStep);

    if (!newStep) {
        throw new Error(STAGE_ERRORS.STEP_NOT_FOUND);
    }

    if (newStep.interviewFlowId !== application.position.interviewFlowId) {
        throw new Error(STAGE_ERRORS.STEP_WRONG_FLOW);
    }

    // Query 3: Actualizar aplicación
    const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
            currentInterviewStep: newStepId,
            notes: notes !== undefined ? notes : application.notes,
        },
    });

    // Position viene del primer query - no necesita query adicional
    return {
        applicationId: updatedApplication.id,
        candidateId: updatedApplication.candidateId,
        positionId: updatedApplication.positionId,
        positionTitle: application.position.title,
        previousStepId: application.currentInterviewStep,
        previousStepName: previousStep?.name || 'Aplicación Recibida',
        currentInterviewStep: newStepId,
        stepName: newStep.name,
        stepOrder: newStep.orderIndex,
        notes: updatedApplication.notes,
        updatedAt: new Date(),
    };
};
