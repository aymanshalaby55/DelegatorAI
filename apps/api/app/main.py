from fastapi import FastAPI
from app.api.v1.router import router as v1_router
from app.core.config import get_settings

settings = get_settings()
print(settings)

v1_app = FastAPI(title="API v1", version="1.0.0")
v1_app.include_router(v1_router)


app = FastAPI(docs_url=None, redoc_url=None)
app.mount("/api/v1", v1_app)
