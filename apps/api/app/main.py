from fastapi import FastAPI
from app.api.routes.v1.router import router as v1_router





settings = get_settings();



# api integrations
v1_app = FastAPI(title="API v1", version="1.0.0")
v1_app.include_router(v1_router)


app = FastAPI(docs_url=None, redoc_url=None)
app.mount("/api/v1", v1_app)
