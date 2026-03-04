<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Coding rules

- **NO comments in code**: Do not add comments to the code files. The code should be self-documenting.
- **NestJS Organization**: NestJS applications must be organized into modules, controllers, services, etc. For example, when creating a new module, create a new folder in `apps/api/src/app/`, define the module, controller, and service within it, and import the module into `app.module.ts`. Use tokens for dependency injection.
- **SOLID Compliance**: Do not break SOLID principles anywhere in the codebase.
- **Architectural Principles**: Inside `apps/`, adhere strictly to Hexagonal Architecture, Screaming Architecture, and DDD. Folders must be well-separated (e.g., `domain`, `application`, `infrastructure`).
- **Controller Testing**: All controllers must have corresponding E2E tests.

