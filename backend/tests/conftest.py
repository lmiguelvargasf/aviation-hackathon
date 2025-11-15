from collections.abc import AsyncIterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from backend import app


@pytest.fixture(scope="function")
def test_client() -> AsyncIterator[TestClient]:
    with TestClient(app=app) as client:
        yield client


class GraphQLClient:
    def __init__(self, client: TestClient):
        self.client = client
        self.endpoint = "/graphql"

    def query(self, query_string: str, variables: dict[str, Any] | None = None):
        """Execute a GraphQL query with variables"""
        payload: dict[str, Any] = {"query": query_string}
        if variables:
            payload["variables"] = variables

        response = self.client.post(self.endpoint, json=payload)
        return response.json()

    def mutation(self, mutation_string: str, variables: dict[str, Any] | None = None):
        """Execute a GraphQL mutation with variables"""
        return self.query(mutation_string, variables)


@pytest.fixture
def graphql_client(test_client: TestClient) -> GraphQLClient:
    """Provides a GraphQL client for testing"""
    return GraphQLClient(test_client)
