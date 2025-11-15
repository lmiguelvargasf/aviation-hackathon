from fastapi import APIRouter, HTTPException, status
from piccolo.apps.user.tables import BaseUser
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreateRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str


class UserResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: str

    @classmethod
    def from_model(cls, user: BaseUser) -> "UserResponse":
        return cls(
            id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Get user by ID."""
    user = await BaseUser.objects().get(BaseUser.id == user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return UserResponse.from_model(user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreateRequest):
    """Create a new user."""
    existing_user = await BaseUser.objects().get(
        BaseUser.username == user_data.username
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with username '{user_data.username}' already exists.",
        )

    user = BaseUser(**user_data.model_dump())
    await user.save()

    return UserResponse.from_model(user)
