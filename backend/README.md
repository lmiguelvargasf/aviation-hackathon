# Backend

This service is containerized via Docker Compose. See the [project root README](../README.md) for setup and running instructions.

## Access Backend

- [Backend Admin UI](http://localhost:8000/admin/)
- [Backend Health Check](http://localhost:8000/health)
- [GraphQL Endpoint (GraphiQL)](http://localhost:8000/graphql)

## Tooling

The following tools are used in this project:

- **[ruff][]:** Used for code linting and formatting.
- **[pytest][]:** Used for running tests.
- **[pytest-cov][]:** Used for measuring test coverage.
- **[pyrefly][]:** Used for static type checking.


## Development Tasks

This project uses [Task][] as a task runner to simplify common development workflows like linting, formatting, and testing.

To see all available tasks and their descriptions, run:

```bash
task --list
```

## AI Explanation Providers

The Go / No-Go endpoint can enrich deterministic scores with natural-language
advice using one (or both) of the following providers:

- `YOU_COM_API_KEY` (optional): Enables the You.com Express API. Requests are
  grounded on live web data and the backend instructs the model to return the
  JSON shape consumed by the frontend. You can override the default endpoint via
  `YOU_COM_API_URL` if needed.
- `GOOGLE_API_KEY` (optional): Enables the existing Gemini (pydantic-ai) agent
  that can also call the telemetry helper tools.

At least one key must be configured for the AI explanation step to succeed. If
both keys are present, the service tries You.com first and falls back to Gemini
when necessary.

[pyrefly]: https://pyrefly.org/
[pytest]: https://docs.pytest.org/
[pytest-cov]: https://pytest-cov.readthedocs.io/en/latest/readme.html
[ruff]: https://docs.astral.sh/ruff/
[Task]: https://taskfile.dev/
