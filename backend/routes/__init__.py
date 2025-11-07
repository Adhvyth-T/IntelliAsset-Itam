from .auth import router as auth_router
from .assets import router as assets_router
from .users import router as users_router
from .procurement import router as procurement_router
from .analytics import router as analytics_router
from .audit import router as audit_router
from .agent import router as agent_router

__all__ = [
    "auth_router",
    "assets_router",
    "users_router",
    "procurement_router",
    "analytics_router",
    "audit_router",
    "agent_router"
]
