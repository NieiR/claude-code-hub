# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Changelog (AI Context Updates)

### 2025-12-24 - Auxiliary Module Documentation Complete
- Added complete documentation for 4 auxiliary modules:
  - **Dashboard UI** (`src/app/[locale]/dashboard/`) - User management, logs, sessions, quotas, monitoring
  - **I18n System** (`src/i18n/`, `messages/`) - Multi-language support and translation workflow
  - **UI Components** (`src/components/`) - Reusable component library with usage patterns
  - **API Endpoints** (`src/app/api/`) - REST API layer and OpenAPI documentation
- All 10 core modules now have detailed CLAUDE.md documentation
- Updated module index with direct documentation links
- Navigation breadcrumbs added to all module docs for easy traversal

### 2025-12-24 - Comprehensive Documentation Audit
- Verified all module-level documentation completeness
- Confirmed 6 core modules fully documented (Proxy Core, Core Services, Actions, Database, Repository, Testing)
- Validated cross-references and navigation breadcrumbs
- Generated comprehensive index with file statistics and coverage metrics
- All primary architectural components now have detailed module guides

### 2025-12-23 - Initial AI Context Generation
- Added comprehensive module structure documentation
- Created Mermaid diagram for module visualization
- Added detailed module index with responsibilities
- Documented proxy pipeline, core services, and data layer
- Established module-level documentation structure

---

## Project Vision

Claude Code Hub is an enterprise-grade proxy service for Claude AI and compatible APIs. It provides:
- Multi-format support (Claude, OpenAI, Codex, Gemini)
- Multi-provider load balancing with circuit breaker
- Fine-grained rate limiting and quota management
- Real-time monitoring and audit trail
- Session-aware context tracking
- Request/response manipulation engine

## Architecture Overview

### Request Flow

```
Client Request (Claude/OpenAI/Codex/Gemini format)
    ↓
Format Detection & Normalization
    ↓
Guard Pipeline (Auth → Filters → Rate Limit → Provider Selection)
    ↓
Format Conversion (to upstream provider format)
    ↓
Provider Forwarding (with retry & circuit breaker)
    ↓
Response Handling (streaming/non-streaming)
    ↓
Format Conversion Back (to client format)
    ↓
Client Response
```

### Technology Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Drizzle ORM
- **Cache/Queue**: Redis + IORedis
- **API Layer**: Hono (fast HTTP framework)
- **Testing**: Vitest
- **Linting**: Biome
- **Type Checking**: TypeScript 5
- **I18n**: next-intl (5 locales)

## Module Structure

```mermaid
graph TD
    ROOT["(Root) claude-code-hub"]

    ROOT --> SRC["src/"]
    ROOT --> TESTS["tests/"]
    ROOT --> MSGS["messages/"]
    ROOT --> DOCS["docs/"]
    ROOT --> DEPLOY["deploy/"]
    ROOT --> DRIZZLE_MIG["drizzle/"]

    SRC --> APP["app/"]
    SRC --> LIB["lib/"]
    SRC --> ACTIONS["actions/"]
    SRC --> DRIZZLE["drizzle/"]
    SRC --> REPO["repository/"]
    SRC --> COMPONENTS["components/"]
    SRC --> I18N["i18n/"]

    APP --> V1["v1/ (Proxy Core)"]
    APP --> API["api/"]
    APP --> DASHBOARD["[locale]/dashboard/"]
    APP --> SETTINGS["[locale]/settings/"]

    V1 --> CONVERTERS["_lib/converters/"]
    V1 --> PROXY["_lib/proxy/"]
    V1 --> CODEX["_lib/codex/"]
    V1 --> GEMINI["_lib/gemini/"]

    LIB --> RATE_LIMIT["rate-limit/"]
    LIB --> REDIS["redis/"]
    LIB --> PROVIDER_TESTING["provider-testing/"]
    LIB --> NOTIFICATION["notification/"]

    TESTS --> UNIT["unit/"]
    TESTS --> INTEGRATION["integration/"]
    TESTS --> E2E["e2e/"]
    TESTS --> API_TESTS["api/"]

    click V1 "./src/app/v1/CLAUDE.md" "Proxy Core Module"
    click LIB "./src/lib/CLAUDE.md" "Core Services Module"
    click ACTIONS "./src/actions/CLAUDE.md" "Server Actions Module"
    click DRIZZLE "./src/drizzle/CLAUDE.md" "Database Module"
    click REPO "./src/repository/CLAUDE.md" "Repository Module"
    click DASHBOARD "./src/app/[locale]/dashboard/CLAUDE.md" "Dashboard UI Module"
    click API "./src/app/api/CLAUDE.md" "API Endpoints Module"
    click COMPONENTS "./src/components/CLAUDE.md" "UI Components Module"
    click I18N "./src/i18n/CLAUDE.md" "I18n System Module"
    click TESTS "./tests/CLAUDE.md" "Testing Module"
```

## Module Index

| Module | Path | Responsibility | Documentation |
|--------|------|----------------|---------------|
| **Proxy Core** | `src/app/v1/` | Request routing, format detection/conversion, guard pipeline | [CLAUDE.md](./src/app/v1/CLAUDE.md) |
| **Core Services** | `src/lib/` | Session manager, circuit breaker, rate limiter, Redis, logger | [CLAUDE.md](./src/lib/CLAUDE.md) |
| **Server Actions** | `src/actions/` | 39 business logic actions for dashboard and API | [CLAUDE.md](./src/actions/CLAUDE.md) |
| **Database Schema** | `src/drizzle/` | Drizzle ORM schema and migrations | [CLAUDE.md](./src/drizzle/CLAUDE.md) |
| **Repository Layer** | `src/repository/` | Data access abstraction over Drizzle | [CLAUDE.md](./src/repository/CLAUDE.md) |
| **Testing** | `tests/` | Unit, integration, e2e, and API tests | [CLAUDE.md](./tests/CLAUDE.md) |
| **Dashboard UI** | `src/app/[locale]/dashboard/` | Admin dashboard pages and components | [CLAUDE.md](./src/app/[locale]/dashboard/CLAUDE.md) |
| **API Endpoints** | `src/app/api/` | REST API endpoints (admin, auth, availability, etc.) | [CLAUDE.md](./src/app/api/CLAUDE.md) |
| **UI Components** | `src/components/` | Shared React components (shadcn/ui based) | [CLAUDE.md](./src/components/CLAUDE.md) |
| **I18n** | `src/i18n/`, `messages/` | Internationalization routing and message files | [CLAUDE.md](./src/i18n/CLAUDE.md) |
| **Settings UI** | `src/app/[locale]/settings/` | System settings pages | (Inline documentation) |
| **Documentation** | `docs/` | Architecture, PRD, API guides | (Self-documenting) |
| **Deployment** | `deploy/`, `docker-compose.yaml` | Docker configs and deployment scripts | (Config files) |
| **Migrations** | `drizzle/` | Database migration SQL files | (SQL files) |

## Common Commands

```bash
bun install                    # Install dependencies
bun run dev                    # Dev server on port 13500
bun run build                  # Production build (copies VERSION to standalone)
bun run lint                   # Biome check
bun run lint:fix               # Biome auto-fix
bun run typecheck              # TypeScript check (uses tsgo for speed)
bun run test                   # Run Vitest tests
bun run test -- path/to/test   # Run single test file
bun run test:ui                # Vitest with browser UI
bun run db:generate            # Generate Drizzle migration (validates afterward)
bun run db:migrate             # Apply migrations
bun run db:studio              # Drizzle Studio GUI
```

### Docker Build & Push

Private registry: `registry.deephub.cc/claude-code-hub`

```bash
# Build and push
docker build -f deploy/Dockerfile -t registry.deephub.cc/claude-code-hub:latest .
docker push registry.deephub.cc/claude-code-hub:latest
```

## Architecture Details

### Proxy Request Pipeline (`src/app/v1/_lib/`)

Request flow through `proxy-handler.ts`:
1. `ProxySession.fromContext()` - Parse incoming request
2. `detectFormat()` - Identify API format (Claude/OpenAI/Codex)
3. `GuardPipelineBuilder.run()` - Execute guard chain:
   - `ProxyAuthenticator` - Validate API key
   - `SensitiveWordGuard` - Content filtering
   - `VersionGuard` - Client version check
   - `ProxySessionGuard` - Session allocation via Redis
   - `ProxyRateLimitGuard` - Multi-dimensional rate limiting
   - `ProxyProviderResolver` - Select provider (weight/priority/circuit breaker)
4. `ProxyForwarder.send()` - Forward with up to 3 retries on failure
5. `ProxyResponseHandler.dispatch()` - Handle streaming/non-streaming response

### Format Converters (`src/app/v1/_lib/converters/`)

Registry pattern in `registry.ts` maps conversion pairs:
- Claude <-> OpenAI bidirectional
- Claude <-> Codex (OpenAI Responses API)
- OpenAI <-> Codex
- Gemini CLI adapters

### Core Services (`src/lib/`)

**Session Manager** (`session-manager.ts`):
- 5-minute Redis context cache with sliding window
- Decision chain recording for audit trail
- Session ID extraction from metadata.user_id or messages hash

**Circuit Breaker** (`circuit-breaker.ts`):
- State machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
- Per-provider isolation with configurable thresholds
- Redis persistence for multi-instance coordination

**Rate Limiting** (`rate-limit/`):
- Dimensions: RPM, cost (5h/week/month), concurrent sessions
- Levels: User, Key, Provider
- Redis Lua scripts for atomic operations
- Fail-open when Redis unavailable

### Database (`src/drizzle/`, `src/repository/`)

Drizzle ORM with PostgreSQL. Key tables:
- `users`, `keys` - Authentication and quotas
- `providers` - Upstream config (weight, priority, proxy, timeouts)
- `message_request` - Request logs with decision chain
- `model_prices` - Token pricing for cost calculation
- `error_rules`, `request_filters` - Request/response manipulation

Repository pattern in `src/repository/` wraps Drizzle queries.

### Server Actions API (`src/app/api/actions/`)

39 Server Actions auto-exposed as REST endpoints via `[...route]/route.ts`:
- OpenAPI 3.1.0 spec auto-generated from Zod schemas
- Swagger UI: `/api/actions/docs`
- Scalar UI: `/api/actions/scalar`

## Development Workflow

### Running Locally

1. Copy `.env.example` to `.env.local` and configure:
   ```bash
   DSN=postgresql://user:pass@localhost:5432/claude_hub
   REDIS_URL=redis://localhost:6379
   ADMIN_TOKEN=your-secure-token
   ```

2. Start dependencies (PostgreSQL + Redis):
   ```bash
   docker-compose up -d
   ```

3. Run migrations:
   ```bash
   bun run db:migrate
   ```

4. Start dev server:
   ```bash
   bun run dev
   ```

5. Access:
   - Dashboard: http://localhost:13500/dashboard
   - API Docs: http://localhost:13500/api/actions/docs

### Testing Strategy

- **Unit tests** (`tests/unit/`): Core logic without external dependencies
- **Integration tests** (`tests/integration/`): Database + Redis interactions
- **API tests** (`tests/api/`): Server Actions validation
- **E2E tests** (`tests/e2e/`): Complete user flows

Run tests:
```bash
bun run test              # Unit tests only (fast)
bun run test:ui           # Interactive UI
bun run test:coverage     # With coverage report
```

## Code Style

- Biome: 2-space indent, double quotes, trailing commas, 100 char max line
- Path alias: `@/*` -> `./src/*`
- Icons: Use `lucide-react`, no custom SVGs
- UI components in `src/components/ui/` (excluded from typecheck)
- Strict mode enabled, no `any` types
- Server-only code marked with `"server-only"` import

## I18n

5 locales via next-intl: `en`, `ja`, `ru`, `zh-CN`, `zh-TW`
- Messages: `messages/{locale}/*.json`
- Routing: `src/i18n/`
- All user-facing text must be internationalized

## Environment Variables

See `.env.example` for all variables. Critical ones:
- `ADMIN_TOKEN` - Dashboard login (must change from default)
- `DSN` - PostgreSQL connection string
- `REDIS_URL` - Redis for rate limiting and sessions
- `AUTO_MIGRATE` - Run Drizzle migrations on startup (default: false)
- `SESSION_TTL` - Session cache TTL in seconds (default: 300)
- `LOG_LEVEL` - Logging level: trace, debug, info, warn, error (default: info)

## AI Development Guidelines

When working with this codebase:

1. **Read Before Write**: Always read existing files before modifying them
2. **Follow Patterns**: Use existing patterns for similar features (e.g., repository pattern, action structure)
3. **Type Safety**: Maintain strict TypeScript types, no `any`
4. **Error Handling**: Use ProxyError classes with proper error codes
5. **Logging**: Use structured logging via `logger` from `@/lib/logger`
6. **Redis Keys**: Follow naming convention in `src/lib/redis/`
7. **Database Changes**: Always generate migrations via `bun run db:generate`
8. **Testing**: Add tests for new features, maintain coverage thresholds
9. **I18n**: Add translations for all 5 locales when adding UI text
10. **Documentation**: Update module CLAUDE.md when changing architecture

## Contributing

See `CONTRIBUTING.md` for branch naming, commit format, and PR process.
All PRs target `dev` branch; `main` is release-only.

## Related Documentation

- [Architecture Overview](./docs/architecture-claude-code-hub-2025-11-29.md)
- [PRD Document](./docs/prd-claude-code-hub-2025-11-29.md)
- [API Authentication Guide](./docs/api-authentication-guide.md)
- [Agent Workflows](./AGENTS.md)
