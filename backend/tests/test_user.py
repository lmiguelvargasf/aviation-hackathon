"""
This test covers basic BaseUser functionality likely already tested
in piccolo_admin itself. Remove this test once actual application-specific
tests involving database transactions are implemented.
"""

import pytest
from piccolo.apps.user.tables import BaseUser
from piccolo.table import create_db_tables, drop_db_tables


@pytest.fixture(scope="function", autouse=True)
async def db_tables():
    await create_db_tables(BaseUser, if_not_exists=True)
    yield
    await drop_db_tables(BaseUser)


class TestBaseUser:
    async def test_create_user(self) -> None:
        test_username = "test@example.com"
        test_password = "TestPassword123"

        user = await BaseUser.create_user(
            username=test_username, password=test_password
        )

        assert user.id is not None
        assert user.username == test_username
        retrieved_user = await BaseUser.objects().get(
            BaseUser.username == test_username
        )

        assert retrieved_user is not None
        assert retrieved_user.id == user.id
        assert retrieved_user.username == test_username
