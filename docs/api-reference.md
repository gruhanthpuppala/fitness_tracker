# API Reference

Base URL: `/api/v1/`

All authenticated endpoints require `Authorization: Bearer <access_token>` header.

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/` | No | Email/password registration |
| POST | `/auth/login/` | No | Email/password login (returns JWT pair) |
| POST | `/auth/google/` | No | Google OAuth login |
| POST | `/auth/token/refresh/` | No | Refresh access token |
| POST | `/auth/logout/` | Yes | Blacklist refresh token |
| POST | `/auth/verify-email/` | No | Verify email with token |
| POST | `/auth/verify-email/resend/` | Yes | Resend verification email |
| POST | `/auth/password-reset/` | No | Request password reset |
| POST | `/auth/password-reset/confirm/` | No | Confirm password reset |
| PUT | `/auth/password-change/` | Yes | Change password |

## User Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me/` | Yes | Get current user profile |
| PUT | `/users/me/` | Yes | Update profile |
| PATCH | `/users/me/` | Yes | Partial update profile |
| DELETE | `/users/me/` | Yes | Deactivate account (soft delete) |

## Onboarding

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/onboarding/profile/` | Yes | Submit profile data |
| POST | `/onboarding/targets/` | Yes | Submit targets + create initial log |
| GET | `/onboarding/status/` | Yes | Check onboarding status |

## Targets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/targets/` | Yes | Get current targets |
| PUT | `/targets/` | Yes | Update targets |

## Daily Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/logs/` | Yes | List logs (paginated, filterable) |
| POST | `/logs/` | Yes | Create daily log |
| GET | `/logs/today/` | Yes | Get today's log |
| GET | `/logs/{date}/` | Yes | Get log by date (YYYY-MM-DD) |
| PUT | `/logs/{date}/` | Yes | Update log (within 7 days) |
| DELETE | `/logs/{date}/` | Yes | Delete log (within 7 days) |

## Body Measurements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/measurements/` | Yes | List all measurements |
| POST | `/measurements/` | Yes | Create measurement (immutable) |
| GET | `/measurements/latest/` | Yes | Get most recent |
| GET | `/measurements/{id}/` | Yes | Get specific measurement |

## Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/summary/` | Yes | Today's data vs targets |
| GET | `/dashboard/trends/?days=7` | Yes | Weight trend (7/14/30) |
| GET | `/dashboard/streaks/` | Yes | Streak data |
| GET | `/dashboard/alerts/` | Yes | Active alerts |
| GET | `/dashboard/monthly/` | Yes | Monthly metrics |

## Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings/` | Yes | Aggregated profile + targets |
| PUT | `/settings/` | Yes | Update profile and/or targets |

## Response Format

```json
{
  "status": "success | error",
  "data": { },
  "message": "Human-readable message",
  "warning": "Optional warning",
  "errors": { "field": ["error"] },
  "meta": { "page": 1, "per_page": 20, "total": 100 }
}
```

## Rate Limits

- Auth endpoints: 5 requests/minute
- Write endpoints: 30 requests/minute
- Read endpoints: 120 requests/minute

## Pagination

- Default: 20 items per page
- Max: 100 (silently capped)
- Query params: `?page=1&page_size=50`
