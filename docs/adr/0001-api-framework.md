# 0001. Fastify for the API

Status: accepted, 2026-09-22

## Decision
The API and workers are one TypeScript codebase (`apps/api`) built on Fastify 5, with Zod for validation and pino for logs.

## Why
- Fastify is the fastest mainstream Node framework and has first-class schema validation, hooks, and plugin encapsulation. `/check` must serve at p95 under 300 ms; framework overhead matters.
- It is small enough that a non-engineer can read a route file and see what it does. NestJS adds decorators, DI containers, and module wiring that hide behaviour and double the concept count for the same result.
- Plugins give us clean service boundaries (health, observations, check, playbooks, admin) inside one process, so extraction into services later is a file move, not a rewrite.

## Alternatives considered
- **NestJS**: better for large teams that want enforced structure; too much ceremony for a two-person company and slower per request.
- **Hono / Elysia**: attractive, but smaller ecosystems for OpenTelemetry, auth, and rate limiting. Revisit if we ever move to edge runtimes.
- **Express**: no built-in validation, weak typing, slower. No.

## Consequences
- Route schemas are Zod, converted to JSON Schema for Fastify where needed.
- Every dependency is injected into `buildApp` so unit tests run without Postgres or Redis.
