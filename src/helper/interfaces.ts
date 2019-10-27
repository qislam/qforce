
interface dxOptions {
    targetusername?: string,
    path?: string,
    apexcodefile?: string,
    query?: string,
    [key: string]: any
}

interface looseObject {
    [key: string]: any
}

interface tranformationFunction {
    (lines: looseObject[]): looseObject[]
}

interface migrationStep {
    name: string,
    description?: string,
    query?: string,
    skip?: boolean,
    transformation?: tranformationFunction
    [key: string]: any
}

export {dxOptions, looseObject, migrationStep}

