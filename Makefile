# Parity developer entry points. Run `make help`.
SHELL := /bin/bash
.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Install all workspace dependencies
	pnpm install

env: ## Create .env from .env.example if missing
	@test -f .env || cp .env.example .env

up: env ## Start Postgres, Redis, MinIO in Docker
	docker compose up -d --wait

down: ## Stop the Docker stack (keeps data)
	docker compose down

nuke: ## Stop the Docker stack and delete all data volumes
	docker compose down -v

migrate: env ## Apply database migrations
	pnpm db:migrate

seed: env ## Load seed data (retailers, products, synthetic observations)
	pnpm db:seed

reset: env ## Drop and recreate the schema, migrate, seed
	pnpm db:reset

dev: install up migrate seed ## Full local stack with seed data, then run the API in watch mode
	pnpm dev:api

api: env ## Run only the API in watch mode (assumes services are up)
	pnpm dev:api

test: env ## Run unit and integration tests
	pnpm test

lint: ## Lint and check formatting
	pnpm lint && pnpm format:check

typecheck: ## Type-check every package
	pnpm typecheck

check: lint typecheck test ## Everything CI runs

.PHONY: help install env up down nuke migrate seed reset dev api test lint typecheck check
