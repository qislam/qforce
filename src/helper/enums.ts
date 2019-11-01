enum Database {
    UPSERT = "UPSERT",
    DELETE = "DELETE",
}

enum StepStage {
    START = 1,
    EXTRACT,
    TRANSFORM,
    LOAD,
    COMPLETE,
}

export {Database, StepStage}