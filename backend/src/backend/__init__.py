from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from piccolo.apps.user.tables import BaseUser
from piccolo_admin.endpoints import create_admin
from strawberry.fastapi import GraphQLRouter

from .apps.should_you_fly.rest.routes import router as should_you_fly_router
from .apps.users.rest.routes import router as users_router
from .db import close_database_connection_pool, open_database_connection_pool
from .schema import schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_database_connection_pool()
    admin = create_admin(tables=[BaseUser])
    app.mount("/admin/", admin)
    yield
    await close_database_connection_pool()


app = FastAPI(lifespan=lifespan)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
graphql_app = GraphQLRouter(schema, path="/graphql")
app.include_router(graphql_app)
app.include_router(users_router)
app.include_router(should_you_fly_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
