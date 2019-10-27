
interface dxOptions {
    targetusername?: string,
    path?: string,
    apexcodefile?: string,
    query?: string,
    [key: string]: any
}

interface csvLine {
    [key: string]: any
}

interface tranformationFunction {
    (lines: csvLine[]): csvLine[]
}

interface migrationStep {
    name: string,
    description?: string,
    query?: string,
    skip?: boolean,
    transformation?: tranformationFunction
    [key: string]: any
}

export {dxOptions, csvLine, migrationStep}

