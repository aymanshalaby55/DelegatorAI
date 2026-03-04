from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router

v1_app = FastAPI(title="API v1", version="1.0.0")
v1_app.include_router(v1_router)


@v1_app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0]
    raw_msg = first_error["msg"]
    message = raw_msg.replace("Value error, ", "")

    serializable_errors = [
        {
            **{
                k: (
                    str(v)
                    if not isinstance(
                        v, (str, int, float, bool, list, dict, type(None))
                    )
                    else v
                )
                for k, v in error.items()
                if k != "ctx"
            }
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": message,
            "data": None,
            "errors": serializable_errors,
        },
    )


@v1_app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    """Handles all HTTPExceptions raised in services/routes"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "data": None,
            "errors": None,
        },
    )


@v1_app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catches any unhandled exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "data": None,
            "errors": str(exc),
        },
    )


app = FastAPI(docs_url=None, redoc_url=None)
app.mount("/api/v1", v1_app)
