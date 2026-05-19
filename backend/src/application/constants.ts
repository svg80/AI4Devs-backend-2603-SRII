// Constantes compartidas para el módulo de candidatos

export const STAGE_ERRORS = {
    APP_NOT_FOUND: 'Application not found',
    APP_NOT_BELONG: 'Application does not belong to candidate',
    POSITION_CLOSED: 'Cannot update stage for closed position',
    STEP_NOT_FOUND: 'Interview step not found',
    STEP_WRONG_FLOW: 'Interview step does not belong to position interview flow',
} as const;

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    INTERNAL_ERROR: 500,
} as const;