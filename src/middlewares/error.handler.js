export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error!!!"
    const errorMessage = err.errorMessage || "no error message provided"
    let status = err.status || "error"

    if (message.includes("E11000")) {
        statusCode = 400,
            message = "DUPLICATE !!"
    }

    return res.status(statusCode).send({
        status: status,
        message: message,
        errorMessage
    })
}