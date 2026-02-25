# MASTER VISION DOCUMENT — PERSONAL FITNESS TRACKING WEB APP

**Version:** 2.4
**Last Updated:** 2026-02-25
**Status:** Approved for Development
**Changelog:**
- v2.4 — Major feature expansion: Food logging system (Food + FoodEntry models, seed data, meal-based logging), custom daily metrics, workout type system (replaces cardio boolean), weekly review, body type visual model, expanded UserTarget (carbs/fats/fibre/water/sleep/steps targets), 4 diet types (Vegetarian, Non-Vegetarian, Vegan, Eggetarian), Mailpit for dev email testing. Sprint plan restructured for new features.
- v2.3 — Fixed 21 technical gaps: onboarding weight storage, settings facade, div-by-zero guard, OAuth linking fix, duplicate endpoint removal, management command placement, email config, Django admin fields, body_measurements immutability, simplejwt blacklist, field naming, streak rules, future date blocking, refresh failure handling, lockout scope, rate limit response format, deactivation behavior, dashboard models.py, password field rename, google-auth library, cron for MVP
- v2.2 — Added DB CHECK constraints, UNIQUE on body_measurements, timezone policy (UTC), pagination limits, validation notes
- v2.1 — Applied 10-section technical corrections (DB schema, auth strategy, rate limiting, business rules, frontend architecture, DevOps, testing, admin roles, hosting, development rules)

---

## PRODUCT GOAL

Build a **serious, minimal, behavior-driven fitness tracking web application** that helps users **log daily health data quickly**, **see honest trends**, and **improve consistency over time**.

This is **not a generic fitness app**.
This is a **control system for personal discipline and progress tracking**.

---

## CORE PRODUCT PRINCIPLES

1. **Speed over features**
   Logging daily data must take **< 15 seconds**

2. **Zero friction input**
   * Smart text inputs with auto-focus and tab-through
   * Smart defaults (today's date auto-selected)
   * Minimal required fields
   * Auto-fill from yesterday's values where sensible

3. **Truth > motivation**
   * Show streaks, misses, and trends honestly
   * No fake encouragement
   * No gamification gimmicks

4. **Minimal, premium UI**
   * Dark charcoal base
   * Bone/off-white text
   * Bronze/gold primary accent, muted olive secondary
   * No bright colors, no clutter

5. **Scalable from Day 1**
   * Multi-user architecture
   * Secure per-user data isolation
   * Per-user targets and analytics
   * Admin panel for system-wide management

6. **API-First Architecture**
   * Every feature accessible via REST API
   * Frontend is a pure consumer of the API
   * Enables future mobile apps, integrations, and third-party access

7. **DRY & SDLC Best Practices**
   * Don't Repeat Yourself across backend and frontend
   * Reusable components, services, and utilities
   * Consistent coding standards and patterns
   * Code reviews, testing, and CI/CD from day one

---

## TECH STACK

### Frontend
* **Next.js 14+ (App Router)**
* **Tailwind CSS** for utility-first responsive styling
* **Framer Motion** for animations and micro-interactions
* **Recharts** for data visualization — **must use `"use client"` directive**, lazy-loaded via `next/dynamic`
* **Zod** for form validation schemas and `.env` type validation
* **Axios** for API client with interceptors
* React Server Components for static data display
* Client components for forms, charts, and interactive elements

### Backend
* **Python + Django REST Framework (DRF)**
* **Django Jazzmin** admin theme (dark theme matching app aesthetic)
* **djangorestframework-simplejwt** for JWT authentication
* **drf-yasg** for Swagger/OpenAPI documentation
* **django-cors-headers** for CORS management
* **django-environ** for environment configuration (typed, with defaults)
* **django-filter** for API filtering
* **psycopg2-binary** for PostgreSQL connection
* **google-auth** for Google OAuth token verification
* **django.core.mail** for email sending

### Database
* **PostgreSQL 16** (local via Docker Compose)
* Django ORM for all database operations
* Migrations managed via Django's migration system

### DevOps & Tooling
* **Docker Compose** for local development — separate `docker-compose.dev.yml`
* **GitHub Actions** for CI/CD (lint, test, build)
* **pytest + pytest-django** for backend testing
* **React Testing Library** for frontend testing
* **ESLint + Prettier** for frontend code quality
* **Black + isort + flake8** for Python code quality

### Hosting (Production — Free/Minimal Cost Stack)
* **Frontend:** Vercel free tier
* **Backend:** Railway free tier OR Render free tier
* **Database:** Railway PostgreSQL free tier OR Supabase PostgreSQL free tier (database-only, no Supabase SDK)
* **Local development:** Docker Compose (PostgreSQL + Django backend only; frontend runs via `npm run dev`)

---

## AUTHENTICATION & AUTHORIZATION

### Auth Strategy: JWT via Authorization Header + Dual Login (Email/Password + Google OAuth)

#### Token Strategy (Single Clean Approach)
* **Authorization header ONLY** — `Authorization: Bearer <access_token>`
* **NO httpOnly cookies** — eliminates CSRF complexity entirely
* **NO CSRF protection needed** — header-based JWT is immune to CSRF attacks
* Access token stored in **memory** (React state/context)
* Refresh token stored in **sessionStorage** (cleared on tab close)
* On page reload: use refresh token to silently get new access token

#### JWT Token Policy
* **Access token expiry:** 15 minutes
* **Refresh token expiry:** 7 days
* **Refresh token rotation:** Enabled (new refresh token issued on each refresh)
* **Blacklist on logout:** Refresh token added to blacklist table
* **Blacklist cleanup:** Expired tokens purged via scheduled management command

#### Registration Options
1. **Email + Password** — Registration with mandatory email verification
2. **Google OAuth** — One-click sign-in with Google account (email auto-verified)

#### Email Verification Flow (Required for Email/Password Registration)
1. User registers with email + password
2. `is_email_verified` set to `FALSE`
3. Backend sends verification email with signed token link
4. User clicks link → hits `/api/v1/auth/verify-email/` endpoint
5. `is_email_verified` set to `TRUE`
6. **Only verified users can access main app** (enforced at API middleware level)
7. Resend verification email endpoint available

#### Google OAuth Account Linking Rule
* If a user already exists with the same email → **add** Google to existing account: store `google_id`, but **do NOT change `auth_provider`**. User retains both login methods.
* **NEVER create duplicate users** with the same email
* Google-authenticated users are auto-verified (`is_email_verified = TRUE`)
* **Login logic must:** check password for email/password login regardless of `auth_provider`; check `google_id` for Google login regardless of `auth_provider`.

#### Login Flow
1. User chooses login method (email/password OR Google)
2. Backend validates credentials and issues JWT token pair:
   * **Access Token** — Short-lived (15 minutes), sent with every API request
   * **Refresh Token** — Long-lived (7 days), used to get new access tokens
3. Frontend stores access token in memory, refresh token in sessionStorage
4. All API requests include `Authorization: Bearer <access_token>` header

#### Logout Flow
1. Frontend calls `/api/v1/auth/logout/` endpoint with refresh token
2. Backend blacklists the refresh token
3. Frontend clears stored tokens (memory + sessionStorage) and redirects to login page

#### Password Management
* Password reset via email link (signed token, 1-hour expiry)
* Password change from settings page (requires current password)
* Minimum 8 characters, at least 1 number and 1 special character

#### Security Rules
* JWT tokens are stateless (verified via signature, no DB lookup for access tokens)
* Refresh token rotation on each use (old token invalidated)
* All endpoints require authentication except: register, login, verify-email, password-reset, Google OAuth
* Users can only access their own data (enforced at API level via queryset filtering)

---

## USER ONBOARDING FLOW (MANDATORY)

Users MUST complete onboarding before accessing any app features.
Enforced at API middleware level: if `is_onboarded = FALSE`, all non-onboarding endpoints return `403`.

### Step 1 — Account Creation
User registers via email/password (then verifies email) OR signs in with Google

### Step 2 — Profile Setup
Collect (all required):
* Name
* Age
* Gender (Male / Female / Other)
* Height (cm) — metric only
* Current Weight (kg) — metric only
* Average Sitting Hours per day
* Diet Type (Vegetarian / Non-Vegetarian / Vegan / Eggetarian)

### Step 3 — Target Setup + Backend Processing
User submits (required):
* Daily Calorie Target (kcal)
* Daily Protein Target (g)
* Goal Weight (kg)

User may also submit (optional):
* Carbs Target (g)
* Fats Target (g)
* Fibre Target (g)
* Water Target (liters)
* Sleep Target (hours)
* Steps Target (count)

Backend auto-processes on target submission:
* Creates initial `daily_log` entry for today with the collected weight (calories/protein/steps/water/sleep set to 0, workout/fruit set to FALSE). This serves as the baseline weight for BMI calculation.
* BMI = weight / (height in meters)^2 — uses weight from the freshly created daily_log entry
* BMI Category (Underweight < 18.5 / Normal 18.5-24.9 / Overweight 25-29.9 / Obese >= 30)
* Sets `is_onboarded = TRUE`

**Frontend shows 3 user-facing steps:** Profile → Targets → Review & Confirm
* The "Review & Confirm" step is **frontend-only** — it reads back computed BMI from the backend response. No additional API call needed.

### Onboarding UI
* Multi-step form with progress indicator
* Simple styled inputs for MVP (fancy scroll widgets deferred to Phase 2+)
* Framer Motion slide transitions between steps
* Validation on each step before proceeding
* Mobile-optimized layout (single column, large touch targets)

---

## DATABASE SCHEMA

### users
```
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
email               VARCHAR(255) UNIQUE NOT NULL
password            VARCHAR(255) NULL (null for OAuth-only users; Django manages hashing internally via set_password())
name                VARCHAR(100) NOT NULL
age                 INTEGER NOT NULL CHECK (age > 0 AND age <= 120)
gender              VARCHAR(10) NOT NULL
height_cm           DECIMAL(5,1) NOT NULL CHECK (height_cm > 0)
diet_type           VARCHAR(20) NOT NULL
avg_sitting_hours   DECIMAL(3,1) NOT NULL CHECK (avg_sitting_hours >= 0)
auth_provider       VARCHAR(20) DEFAULT 'email' — tracks original registration method only. Does NOT restrict login methods. A user with auth_provider='email' and a non-null google_id can login via either method.
google_id           VARCHAR(255) NULL
is_email_verified   BOOLEAN DEFAULT FALSE
is_onboarded        BOOLEAN DEFAULT FALSE
is_active           BOOLEAN DEFAULT TRUE
is_staff            BOOLEAN DEFAULT FALSE
is_superuser        BOOLEAN DEFAULT FALSE
failed_login_attempts INTEGER DEFAULT 0
locked_until        TIMESTAMP NULL
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### user_targets
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
calorie_target  INTEGER NOT NULL CHECK (calorie_target > 0)
protein_target  INTEGER NOT NULL CHECK (protein_target > 0)
goal_weight     DECIMAL(5,1) NOT NULL CHECK (goal_weight > 0)
carbs_target    INTEGER NULL                — optional macro target
fats_target     INTEGER NULL                — optional macro target
fibre_target    INTEGER NULL                — optional macro target
water_target    DECIMAL(3,1) NULL           — liters
sleep_target    DECIMAL(3,1) NULL           — hours
steps_target    INTEGER NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id)
```

### daily_logs
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
date            DATE NOT NULL
weight          DECIMAL(5,1) NOT NULL CHECK (weight > 0)
calories        INTEGER NOT NULL CHECK (calories >= 0)
protein         INTEGER NOT NULL CHECK (protein >= 0)
carbs           INTEGER NULL CHECK (carbs >= 0)
fats            INTEGER NULL CHECK (fats >= 0)
fibre           INTEGER NOT NULL DEFAULT 0 CHECK (fibre >= 0)
steps           INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0)
water           DECIMAL(3,1) NOT NULL DEFAULT 0 CHECK (water >= 0)
sleep           DECIMAL(3,1) NOT NULL DEFAULT 0 CHECK (sleep >= 0 AND sleep <= 24)
workout         BOOLEAN DEFAULT FALSE
workout_type    VARCHAR(30) NULL (weight_training | cardio | bodyweight_training) — only set when workout=TRUE
fruit           BOOLEAN DEFAULT FALSE
protein_hit     BOOLEAN DEFAULT FALSE
calories_ok     BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, date)
```

**IMPORTANT — `protein_hit` and `calories_ok` are NOT generated columns.**
These are **normal boolean fields** computed in the **Django service/serializer layer** at create/update time:
```python
# In serializer create() / update() or service layer:
protein_hit = validated_data['protein'] >= user_target.protein_target
calories_ok = abs(validated_data['calories'] - user_target.calorie_target) <= (user_target.calorie_target * 0.10)
```
This is required because PostgreSQL generated columns cannot reference other tables.

**Validation Strategy:** All CHECK constraints above are implemented as **both**:
1. **Django model validators** (`MinValueValidator`, `MaxValueValidator`) — validated at serializer/form level first
2. **Database-level CHECK constraints** — created via Django migrations as the safety net
Double validation ensures data integrity even if someone bypasses the API (e.g., Django shell, admin, direct DB access).

**Date Validation (API-enforced):**
- `date` must be <= today (UTC). Future dates are rejected with 400 error.
- Date scroller shows future dates as dimmed/non-selectable (frontend visual only, backend is authority).

**Edit Rule:** Logs editable within 7 days of the log date. After 7 days, logs are locked. **Enforced at API level:**
```python
# In DailyLog view/permission:
if (timezone.now().date() - log.date).days > 7:
    raise PermissionDenied("Logs older than 7 days cannot be modified.")
```
Frontend displays locked state but **backend is the authority** — never trust frontend-only enforcement.

### body_measurements
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
date            DATE NOT NULL
neck            DECIMAL(5,1) NULL
chest           DECIMAL(5,1) NULL
shoulders       DECIMAL(5,1) NULL
bicep           DECIMAL(5,1) NULL
forearm         DECIMAL(5,1) NULL
waist           DECIMAL(5,1) NULL
hips            DECIMAL(5,1) NULL
thigh           DECIMAL(5,1) NULL
created_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, date)
```

**Immutability Rule:** Body measurements are **immutable once saved**. No PUT/PATCH endpoints exist. If a user makes an error, they delete and re-create. This is intentional — body measurement data should not be retroactively altered. `updated_at` intentionally omitted.

**Measurement Rule (API-enforced):**
If last measurement was < 30 days ago:
* API **accepts** the request (saves to DB)
* API response includes `"warning": "Last measurement was X days ago. Recommended frequency: every 30 days."`
* Frontend displays warning banner based on response flag

### monthly_metrics (Normal Table — NOT materialized view)
```
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID REFERENCES users(id) ON DELETE CASCADE
month               DATE NOT NULL (first day of month)
avg_weight          DECIMAL(5,1)
bmi                 DECIMAL(4,1)
bmi_category        VARCHAR(20)
weight_change       DECIMAL(5,1) (vs previous month)
consistency_score   INTEGER (0-100)
days_logged         INTEGER
protein_hit_days    INTEGER
workout_days        INTEGER
total_days_in_month INTEGER
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, month)
```

**Computation Strategy:**
* Implemented as a **normal Django model** (not a materialized view)
* Updated via **Django management command**: `python manage.py compute_monthly_metrics`
* Scheduled via **system cron** (MVP) or **Celery beat** (future). For MVP, add a cron entry on the server: `0 0 * * * cd /app && python manage.py compute_monthly_metrics`. Celery is a future extension only.
* Also computed **on-demand** when dashboard loads and data is stale (> 24 hours old)
* Management command processes current month + previous month (to catch late entries)

### token_blacklist
Use `djangorestframework-simplejwt`'s built-in token blacklist app (`rest_framework_simplejwt.token_blacklist`). Add `'rest_framework_simplejwt.token_blacklist'` to `INSTALLED_APPS`. No custom token_blacklist model needed — simplejwt handles its own schema and indexes.

### audit_logs
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE SET NULL
action          VARCHAR(50) NOT NULL (login | logout | password_change | password_reset | account_deactivation | failed_login)
ip_address      INET NOT NULL
user_agent      TEXT NULL
details         JSONB NULL
created_at      TIMESTAMP DEFAULT NOW()
```

### foods
```
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
name                VARCHAR(255) NOT NULL
category            VARCHAR(50) NOT NULL (grain | protein_source | vegetable | fruit | dairy | snack | beverage | condiment | other)
diet_type           VARCHAR(20) NOT NULL (vegetarian | non_vegetarian | vegan | eggetarian)
calories_per_100g   INTEGER NOT NULL CHECK (calories_per_100g >= 0)
protein_per_100g    DECIMAL(5,1) NOT NULL CHECK (protein_per_100g >= 0)
carbs_per_100g      DECIMAL(5,1) NOT NULL CHECK (carbs_per_100g >= 0)
fats_per_100g       DECIMAL(5,1) NOT NULL CHECK (fats_per_100g >= 0)
fibre_per_100g      DECIMAL(5,1) NOT NULL CHECK (fibre_per_100g >= 0)
is_custom           BOOLEAN DEFAULT FALSE
created_by          UUID NULL REFERENCES users(id) ON DELETE CASCADE  — null for system foods
created_at          TIMESTAMP DEFAULT NOW()
```

### food_entries
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
daily_log_id    UUID REFERENCES daily_logs(id) ON DELETE CASCADE
food_id         UUID REFERENCES foods(id) ON DELETE PROTECT
meal_type       VARCHAR(20) NOT NULL (breakfast | lunch | snack | dinner)
quantity_grams  DECIMAL(6,1) NOT NULL CHECK (quantity_grams > 0)
— denormalized, computed on save:
calories        INTEGER NOT NULL DEFAULT 0
protein         DECIMAL(5,1) NOT NULL DEFAULT 0
carbs           DECIMAL(5,1) NOT NULL DEFAULT 0
fats            DECIMAL(5,1) NOT NULL DEFAULT 0
fibre           DECIMAL(5,1) NOT NULL DEFAULT 0
created_at      TIMESTAMP DEFAULT NOW()
```

### custom_metric_definitions
```
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
name        VARCHAR(100) NOT NULL
unit        VARCHAR(50) NOT NULL
is_active   BOOLEAN DEFAULT TRUE
created_at  TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, name)
```

### custom_metric_entries
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
definition_id   UUID REFERENCES custom_metric_definitions(id) ON DELETE CASCADE
daily_log_id    UUID REFERENCES daily_logs(id) ON DELETE CASCADE
value           DECIMAL(8,2) NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
UNIQUE(definition_id, daily_log_id)
```

### DATABASE INDEXES (Mandatory)
```sql
-- Performance-critical indexes
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, date);
CREATE INDEX idx_monthly_metrics_user_month ON monthly_metrics(user_id, month);
-- token_blacklist indexes handled by simplejwt's built-in blacklist app
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_diet_type ON foods(diet_type);
CREATE INDEX idx_foods_created_by ON foods(created_by);
CREATE INDEX idx_food_entries_log_meal ON food_entries(daily_log_id, meal_type);
```
These are implemented as Django model `Meta.indexes` and created via migrations.

---

## REST API DESIGN

### Base URL: `/api/v1/`

All endpoints return JSON. All authenticated endpoints require `Authorization: Bearer <token>` header.

### Auth Endpoints
```
POST   /api/v1/auth/register/              — Email/password registration
POST   /api/v1/auth/login/                 — Email/password login (returns JWT pair)
POST   /api/v1/auth/google/                — Google OAuth login (returns JWT pair)
POST   /api/v1/auth/token/refresh/         — Refresh access token (rotation enabled)
POST   /api/v1/auth/logout/                — Blacklist refresh token
POST   /api/v1/auth/verify-email/          — Verify email with signed token
POST   /api/v1/auth/verify-email/resend/   — Resend verification email
POST   /api/v1/auth/password-reset/        — Request password reset email
POST   /api/v1/auth/password-reset/confirm/ — Confirm password reset with token
PUT    /api/v1/auth/password-change/       — Change password (authenticated, requires current password)
```

### User Endpoints
```
GET    /api/v1/users/me/               — Get current user profile
PUT    /api/v1/users/me/               — Update profile info
PATCH  /api/v1/users/me/               — Partial update profile
DELETE /api/v1/users/me/               — Deactivate account (soft delete: is_active=FALSE)
```

**Post-deactivation behavior:**
- `is_active` set to `FALSE`
- All user's refresh tokens blacklisted immediately
- Subsequent login attempts rejected ("Account deactivated")
- No self-reactivation flow in MVP (admin can reactivate via Django admin)
- User data retained (soft delete), not purged

### Onboarding Endpoints
```
POST   /api/v1/onboarding/profile/     — Submit initial profile data
POST   /api/v1/onboarding/targets/     — Submit initial targets, creates initial daily_log with weight, triggers BMI calculation using weight from initial daily_log, sets is_onboarded=TRUE
GET    /api/v1/onboarding/status/      — Check onboarding completion status
```

### Targets Endpoints
```
GET    /api/v1/targets/                — Get current targets
PUT    /api/v1/targets/                — Update targets
```

### Daily Logs Endpoints
```
GET    /api/v1/logs/                   — List logs (paginated, filterable by date range)
POST   /api/v1/logs/                   — Create daily log (computes protein_hit, calories_ok)
GET    /api/v1/logs/{date}/            — Get log for specific date (YYYY-MM-DD)
PUT    /api/v1/logs/{date}/            — Update log (API-enforced: only within 7 days)
DELETE /api/v1/logs/{date}/            — Delete log (API-enforced: only within 7 days)
GET    /api/v1/logs/today/             — Shortcut: get today's log
```

### Food Endpoints
```
GET    /api/v1/foods/                     — Search/list foods (filter: ?search=, ?diet_type=, ?category=)
POST   /api/v1/foods/                     — Create custom food (is_custom=True, created_by=request.user)
GET    /api/v1/foods/{id}/                — Food detail
DELETE /api/v1/foods/{id}/delete/         — Delete custom food (owner only)
```

### Meal (Food Entry) Endpoints
```
GET    /api/v1/logs/{date}/meals/         — List food entries for a daily log
POST   /api/v1/logs/{date}/meals/         — Add food entry to daily log (auto-recomputes daily totals)
GET    /api/v1/logs/{date}/meals/{id}/    — Get specific food entry
PUT    /api/v1/logs/{date}/meals/{id}/    — Update food entry (auto-recomputes daily totals)
DELETE /api/v1/logs/{date}/meals/{id}/    — Remove food entry (auto-recomputes daily totals)
```

### Custom Metrics Endpoints
```
GET    /api/v1/logs/custom-metrics/       — List user's active metric definitions
POST   /api/v1/logs/custom-metrics/       — Create new metric definition
DELETE /api/v1/logs/custom-metrics/{id}/  — Soft-delete (is_active=False)
GET    /api/v1/logs/{date}/custom-entries/ — Get custom metric values for a day
POST   /api/v1/logs/{date}/custom-entries/ — Log custom metric values for a day
```

### Body Measurements Endpoints
```
GET    /api/v1/measurements/           — List all measurements (paginated)
POST   /api/v1/measurements/           — Create new measurement (returns warning flag if < 30 days)
GET    /api/v1/measurements/latest/    — Get most recent measurement
GET    /api/v1/measurements/{id}/      — Get specific measurement
```

### Dashboard / Analytics Endpoints
```
GET    /api/v1/dashboard/summary/      — Today's summary (weight, calories, protein vs targets)
GET    /api/v1/dashboard/trends/       — Weight trend data (7/14/30 day)
GET    /api/v1/dashboard/streaks/      — All streak data (protein, calorie, workout)
GET    /api/v1/dashboard/alerts/       — Active alerts/warnings (includes workout variety check)
GET    /api/v1/dashboard/weekly-review/ — Weekly summary (last 7 days: avg calories/protein, workouts, weight change, consistency)
GET    /api/v1/dashboard/monthly/      — Monthly metrics (current + historical, triggers on-demand compute if stale)
```

### Settings Endpoints
```
GET    /api/v1/settings/               — Get user settings/preferences
PUT    /api/v1/settings/               — Update settings
```
**Note:** Settings is a **read-only aggregation facade**. `GET /api/v1/settings/` returns combined data from `users/me` and `targets`. `PUT /api/v1/settings/` is a convenience endpoint that delegates writes to users and targets models internally. No separate settings model exists.

### API Response Format (Standardized)
```json
{
  "status": "success | error",
  "data": { },
  "message": "Human-readable message",
  "warning": "Optional warning message (e.g., measurement frequency)",
  "errors": { "field": ["error message"] },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

**Rate Limited Response (429):**
```json
{
  "status": "error",
  "message": "Request was throttled. Expected available in X seconds.",
  "data": null,
  "errors": null
}
```
Header: `Retry-After: <seconds>`

### Pagination Policy
* Default page size: **20**
* Maximum page size: **100**
* Query params: `?page=1&page_size=50`
* Requests exceeding max page size are **capped to 100** (no error, silently capped)
* Implemented via DRF `PageNumberPagination` subclass in `core/pagination.py`
* All list endpoints (logs, measurements, monthly metrics) are paginated

### API Documentation
* **Swagger UI** available at `/api/docs/` (interactive testing)
* **ReDoc** available at `/api/redoc/` (read-only reference)
* **Postman Collection** exported and maintained in `/docs/postman/`

---

## APPLICATION STRUCTURE (PAGES)

### Navigation: Bottom Tab Bar (Mobile) / Sidebar (Desktop)

Tabs:
1. **Dashboard** (home icon)
2. **Log** (plus icon)
3. **Measurements** (ruler icon)
4. **Settings** (gear icon)

---

### 1. LOGIN / REGISTER PAGE

**Purpose:** Entry point for unauthenticated users

**Displays:**
* App logo and tagline
* Two auth options:
  * Email + Password form (login/register toggle)
  * "Continue with Google" button
* Forgot password link
* Framer Motion fade-in animations

**Post-Registration (Email):** Redirect to "Check your email" verification page

**Mobile:** Full-screen, centered card layout

---

### 2. EMAIL VERIFICATION PAGE

**Purpose:** Prompt user to verify email before proceeding

**Displays:**
* "Check your email" message with envelope icon
* Resend verification email button (with cooldown timer)
* Link to change email / go back to register

---

### 3. ONBOARDING PAGES (Multi-step)

**Purpose:** Collect required user data before app access

**Steps (3 user-facing):**
1. Profile Setup (name, age, gender, height, weight, sitting hours, diet type)
2. Target Setup (calorie target, protein target, goal weight) — submission triggers backend processing (initial daily_log, BMI calculation, is_onboarded=TRUE)
3. Review & Confirm (frontend-only — reads back computed BMI from backend response, shows summary)

**UX:**
* Progress bar at top
* Slide transitions between steps (Framer Motion)
* Back button on each step
* Validation per step before allowing next

---

### 4. DASHBOARD (Home)

**Purpose:** Show current status and trends (read-only)

**Displays:**
* Today's weight (large number)
* Weight trend chart (7 / 14 / 30 day toggle) — Recharts line chart
* Calories vs target (today) — progress bar
* Protein vs target (today) — progress bar
* Current streaks:
  * Protein hit streak (days)
  * Calorie compliance streak (days)
  * Workout streak (days)
* Macro progress circles (protein / carbs / fats / fibre vs targets) — circular progress bars
* Body type visual model — static silhouette mapped from (gender, bmi_category), 8 SVG images
* Alerts section:
  * "3 days off calorie target"
  * "No workouts in 5 days"
  * "Try different workout types for variety" (weekly workout variety rule)
  * "No body measurement in 30+ days"
* Weekly review link — navigates to weekly summary (avg calories/protein, workouts, weight change, consistency score)
* Banner: "You haven't logged today" (if applicable)

**Primary CTA:** "Log Today" button (navigates to daily log with today pre-selected)

**Mobile:** Single column, scrollable cards, large tap targets

---

### 5. DAILY LOG PAGE

**Purpose:** Fast daily entry (< 15 seconds)

**Date Selection:** Horizontal date scroller
* Scrollable row of recent dates (past 14 days + today + next 7 days visible but dimmed/non-selectable)
* Today centered and highlighted by default
* Dots below dates showing logged (filled) / missed (empty) / future (dimmed, non-selectable)
* Tap any date to select — Framer Motion scale animation

**REQUIRED SECTION (always visible):**
* Weight (kg) — number input, auto-focused
* Calories (kcal) — number input (auto-computed from food entries if using meal logging)
* Protein (g) — number input (auto-computed from food entries if using meal logging)
* Steps — number input
* Water (liters) — number input with 0.5 increments
* Sleep (hours) — number input with 0.5 increments
* Workout (toggle switch)
* Workout Type (radio: Weight Training / Cardio / Bodyweight Training) — only shown when Workout is ON

**FOOD LOGGING SECTION (4 meals):**
* Breakfast, Lunch, Snack, Dinner — each expandable
* Food search bar → search foods API → select food → enter quantity (grams)
* Each entry shows computed calories/protein/carbs/fats/fibre
* Per-meal subtotals, daily totals auto-computed
* Adding/editing/removing food entries auto-recomputes DailyLog macro totals

**Smart Input Behavior (Frontend UX Rules — Mandatory):**
* Auto-focus on first empty field when page loads
* Tab/Enter moves to next field (sequential flow)
* Quick-fill button: "Copy yesterday's values" (prefills from previous day's log)
* Number inputs with increment/decrement buttons on mobile
* Toggle switches for all boolean values (workout, fruit)
* Date auto-selected to today (zero taps for today's log)

**OPTIONAL SECTION (collapsible, hidden by default):**
* Carbs (g)
* Fats (g)
* Fibre (g)
* Fruit (toggle)

**CUSTOM METRICS SECTION:**
* User-defined metrics with custom names and units
* Create/manage metric definitions via "Manage Metrics" button
* Log daily values for each active metric

**AUTO-CALCULATED (displayed, not editable):**
* Protein Hit? — olive green check if protein >= target, muted red X if not
* Calories OK? — olive green check if within +/-10% of target, muted red X if not
* Computed from API response data (backend is source of truth)

**Edit Restriction:** Past logs older than 7 days show "locked" state with view-only mode. Backend enforces this — frontend lock is purely visual.

**Mobile:** Single column, large input fields, sticky save button at bottom

---

### 6. BODY MEASUREMENTS PAGE

**Purpose:** Periodic body tracking

**Fields (all in cm):**
* Neck, Chest, Shoulders, Bicep, Forearm, Waist, Hips, Thigh

**Rules:**
* Soft 30-day warning: If API response includes `warning` field, display warning banner but allow submission
* If 30+ days since last measurement: show reminder banner
* Historical measurements listed below form with date and comparison to previous

**Mobile:** Single column form, collapsible history section

---

### 7. SETTINGS PAGE

**Purpose:** User profile management and app preferences

**Sections:**
* **Profile Information** — Edit name, age, height, weight, sitting hours, diet type (4 options)
* **Targets** — Edit calorie target, protein target, goal weight, carbs target, fats target, fibre target, water target, sleep target, steps target
* **Account** — Change password (email users), view email, auth provider info
* **About** — App version, BMI info display
* **Danger Zone** — Deactivate account (with confirmation)
* **Logout** — Logout button with confirmation

**Implementation note:** Settings page reads from `GET /api/v1/settings/` (facade) and writes via `PUT /api/v1/settings/` which delegates to users and targets models internally.

**Mobile:** Full-width sections with expandable cards

---

## SYSTEM CALCULATIONS & LOGIC

### Daily Evaluations
For each daily log, computed in **Django serializer/service layer** at create/update time:
```python
# Service layer: apps/logs/services.py
def compute_daily_evaluations(log_data, user_target):
    protein_hit = log_data['protein'] >= user_target.protein_target
    calories_ok = abs(log_data['calories'] - user_target.calorie_target) <= (user_target.calorie_target * 0.10)
    return protein_hit, calories_ok
```
Stored as normal boolean fields on the `daily_logs` table.

### Streak Calculations
Computed on dashboard load via **dashboard service layer**:
```
protein_streak = consecutive days where protein_hit = true (ending today or yesterday)
calorie_streak = consecutive days where calories_ok = true (ending today or yesterday)
workout_streak = consecutive days where workout = true (ending today or yesterday)
```
"Today or yesterday" allows users to see their streak before logging today's entry. Dashboard service layer handles all streak computation (single source: `GET /api/v1/dashboard/streaks/`).

### Consistency Score (Monthly)
```
consistency_score:
  if days_logged == 0: return 0
  else:
    (days_logged / total_days_in_month) * 40
  + (protein_hit_days / days_logged) * 30
  + (workout_days / days_logged) * 30
```
Score out of 100. Guard clause prevents division by zero when no logs exist for the month. Computed via Django management command (`compute_monthly_metrics`).

### Food Entry Auto-Computation
When a FoodEntry is created, updated, or deleted:
1. Nutrient values are computed from food's per-100g values × (quantity_grams / 100)
2. DailyLog totals (calories, protein, carbs, fats, fibre) are recomputed as SUM of all food entries
3. `protein_hit` and `calories_ok` are recomputed via existing `compute_daily_evaluations()`
Manual macro entry still supported — user can create a "custom food" with manual values.

### Workout Weekly Variety Rule
Computed on dashboard load:
```
types_done = distinct workout_type values this week (Mon-Sun) where workout=True
meets_rule = len(types_done) >= 2
```
If fewer than 2 workout types done this week, dashboard shows a warning alert.

### Weekly Review
Computed on-demand via `GET /api/v1/dashboard/weekly-review/`:
* Period: last 7 days
* avg_calories, avg_protein, workouts_done, workout_types_used
* weight_change (first vs last logged weight in period)
* consistency_score (7-day version of monthly formula)
* protein_hit_days

### Body Type Visual Model
Static mapping — no new DB model needed:
* 8 static SVG images: 4 BMI categories × 2 genders
* Images: `frontend/public/images/body-models/{gender}-{bmi_category}.svg`
* Backend already computes BMI + category in onboarding and monthly metrics
* Frontend maps `(gender, bmi_category)` → image path

### Monthly Metrics
Computed per user per month via management command + on-demand:
* Average Weight (from daily logs)
* Weight Change vs previous month
* BMI (recalculated using latest weight and stored height)
* BMI Category
* Consistency Score

---

## UI DESIGN SYSTEM

### Color Palette
```
Background Primary:    #0D0D0D  (near black)
Background Surface:    #1A1A1A  (card/section backgrounds)
Background Elevated:   #242424  (hover states, elevated cards)
Border:                #2A2A2A  (subtle borders)

Text Primary:          #F5F0EB  (bone white — headings, numbers)
Text Secondary:        #8A8A8A  (labels, descriptions)
Text Muted:            #5A5A5A  (placeholders, disabled)

Accent Primary:        #C9A96E  (bronze/gold — CTAs, active states, highlights)
Accent Primary Hover:  #D4B97E  (hover state)
Accent Secondary:      #8B9D77  (muted olive — success, targets hit)

Status Success:        #8B9D77  (olive green — protein hit, goals met)
Status Warning:        #D4A843  (warm amber — approaching limit)
Status Error:          #B85C5C  (muted red — missed targets, alerts)
Status Info:           #6B8CA6  (slate blue — informational)

Toggle On:             #C9A96E  (bronze)
Toggle Off:            #2A2A2A  (dark gray)
```

### Design Rules
* No gradients
* No bright/neon colors
* No clutter or decorative elements
* No unnecessary icons — only functional icons
* Border-radius: 8px for cards, 6px for inputs, 20px for pills/badges
* Consistent 8px spacing grid

### Typography
* Font: Inter (Google Fonts) — clean sans-serif
* Headings: Semi-bold, #F5F0EB
* Numbers/Data: Bold, larger size — numbers are the hero
* Labels: Regular, #8A8A8A, smaller size
* Hierarchy: Numbers > Labels always

### Animations (Framer Motion)
* Page transitions: Slide left/right (150ms ease-out)
* Card entrance: Fade up (200ms)
* Toggle switches: Spring animation
* Number changes: Count-up animation
* Date scroller: Smooth horizontal scroll with snap
* Charts: Draw-in animation on load

---

## UX RULES (CRITICAL)

* Logging must be possible in **under 15 seconds**
* Today's entry should require **zero date selection** (auto-selected)
* No modal spam — use inline banners only
* No forced scrolling for required fields on mobile
* Optional fields hidden by default (collapsible)
* All interactive elements must have minimum 44x44px touch target on mobile
* Form inputs must show clear focus states (bronze border)
* Error states must be inline, below the field, in muted red
* Success feedback: brief toast notification (auto-dismiss 2 seconds)
* Loading states: Skeleton screens, not spinners

---

## REMINDERS & BEHAVIOR LOOPS

### Passive Reminders (non-intrusive, in-app only)
* Banner on dashboard if no log today (dismissible)
* Banner on measurements page if no measurement in 30+ days
* No email notifications
* No push notifications
* No popup modals

### Behavioral Signals
* Streak counters (displayed prominently on dashboard)
* Missed-day indicators on date scroller (empty dots)
* Trend arrows (up/down) next to weight and monthly metrics
* Color-coded progress bars (olive = on track, red = off track)

---

## API SECURITY (Enhanced — Endpoint-Specific)

### Authentication
* JWT access tokens (15-minute expiry)
* JWT refresh tokens (7-day expiry, rotated on use)
* Token blacklisting on logout
* Google OAuth token verification via Google API
* No CSRF protection needed (header-based JWT only, no cookies)

### Rate Limiting (Endpoint-Specific)
```
Auth endpoints (login, register, password-reset):    5 requests/minute
Write endpoints (POST, PUT, PATCH, DELETE):          30 requests/minute
Read endpoints (GET):                                120 requests/minute
```
Implemented via DRF throttle classes with custom rates per view.

### Request Security
* CORS whitelist (only frontend domain allowed)
* Input validation on all endpoints (Django serializer validation)
* SQL injection prevention (Django ORM parameterized queries)
* XSS prevention (Django auto-escaping + React's built-in protection)

### Data Security
* Per-user data isolation (Django queryset filtering — users only see their own data)
* Password hashing (Django's PBKDF2 with SHA256)
* Sensitive fields excluded from API responses (password, google_id)
* Audit logging for sensitive operations (login, logout, password_change, password_reset, failed_login, account_deactivation)

### IP & Abuse Protection
* IP-based blocking for repeated failed login attempts
* Account lockout after 5 failed login attempts (15-minute cooldown)
* `failed_login_attempts` counter on user model, reset on successful login
* `locked_until` timestamp checked before processing login
* **Scope:** Account lockout applies to **email/password login only**. Google OAuth login is NOT affected by lockout — it bypasses the password check entirely. `failed_login_attempts` is only incremented on email/password login failures.

---

## ADMIN PANEL (Django + Jazzmin)

### Theme
* Jazzmin dark theme matching app aesthetic
* Custom branding (app name, logo)

### Roles & Access Control
| Role | Access Level |
|------|-------------|
| **superadmin** | Full access — manage all users, data, settings, audit logs |
| **staff** | Read-only analytics — view users, logs, metrics, audit logs (no edit/delete) |
| **user** | No admin access — regular app user only |

Implemented via Django's built-in `is_superuser` and `is_staff` flags + custom permissions where needed.

### Admin Capabilities
* View/manage all users (superadmin: full CRUD, staff: read-only)
* View/edit user targets (superadmin only)
* View daily logs (read-only for all admin roles)
* View body measurements (read-only)
* View monthly metrics (read-only)
* User account activation/deactivation (superadmin only)
* View audit logs (both roles)
* System health dashboard (total users, logs today, active users)

### Future Admin Expansion
* Custom branded admin dashboard (Next.js)
* Trainer role (access to assigned users' data)
* Data analytics and reporting
* Bulk data operations

---

## MEASUREMENT UNITS

* **Metric only** (no imperial support)
* Weight: kg (decimal to 1 place)
* Height: cm (decimal to 1 place)
* Water: liters (decimal to 1 place)
* Sleep: hours (decimal to 1 place — e.g., 7.5)
* Body measurements: cm (decimal to 1 place)
* Calories: kcal (integer)
* Protein/Carbs/Fats/Fibre: grams (integer)
* Steps: count (integer)

---

## FRONTEND ARCHITECTURE RULES

### Recharts SSR Handling
Recharts is **client-side only** and will break with Next.js server rendering.
* All chart components MUST use `"use client"` directive at top of file
* Lazy load charts via `next/dynamic` with `ssr: false`:
```tsx
const WeightTrendChart = dynamic(() => import('@/components/charts/WeightTrendChart'), { ssr: false });
```

### Centralized API Client (`lib/api.ts`)
Single Axios instance with:
* `baseURL` configuration from environment variable
* `Authorization: Bearer <token>` header injection via request interceptor
* **Automatic token refresh on 401:** intercept 401 response → call `/api/v1/auth/token/refresh/` → retry original request once
* **Single retry** on failed requests (no infinite loops)
* **Refresh failure handling:** If refresh endpoint returns 401 (expired refresh token), clear all stored tokens and redirect to /login. Do NOT retry. This is a full session expiry.
* Response interceptor for standardized error handling
* Request/response type safety via TypeScript generics

### Environment Validation (Frontend)
* `.env.local` for environment variables
* All env vars validated at build time via **Zod schema** in `lib/env.ts`
* Required vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Form UX Rules (Mandatory Implementation)
These are not optional — they define the core <15 second logging experience:
1. Auto-focus first empty field on page load
2. Enter/Tab moves to next input (sequential field flow)
3. Prefill from yesterday's values via "Copy yesterday" button
4. Toggle switches for boolean values (workout, fruit), workout type radio when workout=True
5. Date auto-selected to today (zero interaction needed for today's log)
6. Sticky save button at bottom on mobile
7. Inline validation errors (no alert dialogs)

---

## DEVOPS & ENVIRONMENT CONFIGURATION

### Backend Environment (`django-environ`)
```python
# config/settings/base.py
import environ
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)
environ.Env.read_env()  # reads .env file
```
All secrets and config via `.env` file. Never hardcode.

### Frontend Environment (`.env.local` + Zod)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```
Validated at build time. TypeScript types auto-generated from Zod schema.

### Docker Compose Structure
```
docker-compose.dev.yml       # Development only
```
Services:
* `postgres` — PostgreSQL 16 container (port 5432)
* `backend` — Django dev server (port 8000)
* `mailpit` — Email testing UI (SMTP port 1025, web UI port 8025)
* `pgadmin` — pgAdmin web UI (optional, port 5050)

**Frontend runs separately** via `npm run dev` (port 3000) — NOT in Docker.
Reason: Faster HMR, better DX, Tailwind/Next.js dev server works best natively.

### Timezone Policy
* Django: `TIME_ZONE = 'UTC'`, `USE_TZ = True` in all settings files
* All timestamps stored in **UTC** in PostgreSQL
* All API responses return UTC timestamps in **ISO 8601 format**: `2026-02-13T14:30:00Z`
* Frontend converts UTC to user's local timezone for **display only** (using `Intl.DateTimeFormat` or `date-fns`)
* Streak and monthly metric calculations use **UTC dates** — consistent regardless of user location
* Daily log `date` field is a `DATE` (no timezone) — represents the calendar day the user is logging for

### Email Configuration
**Development:**
- Django `EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'` pointed at Mailpit (localhost:1025)
- Mailpit container in `docker-compose.dev.yml` provides visual email testing at http://localhost:8025
- Password reset and verification emails are viewable in Mailpit web UI
- Fallback: Switch to `console.EmailBackend` if running without Docker (emails print to Django terminal)

**Production:**
- Django `EMAIL_BACKEND = 'django.core.mail.backends.smtp.SMTPBackend'`
- Service: SendGrid free tier (100 emails/day) OR Mailgun free tier
- SMTP credentials via `.env`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`

### Environment Files
```
.env                  — Backend secrets (DB credentials, JWT secret, Google OAuth keys, EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, DEFAULT_FROM_EMAIL)
frontend/.env.local   — Frontend config (API URL, Google client ID)
.env.example          — Template with all required variables (no secrets)
```

---

## TESTING STRATEGY

### Coverage Target: 70-80% on Core Business Logic
Not 90% on everything. Focus testing effort where it matters.

### Test Priority (Highest → Lowest)
1. **Authentication flows** — register, login, logout, token refresh, email verification, Google OAuth
2. **Daily log creation/update** — including protein_hit/calories_ok computation
3. **7-day edit restriction** — ensure API rejects edits on old logs
4. **Permission checks** — users can only access their own data
5. **Streak calculation logic** — ensure correct consecutive day counting
6. **Monthly metrics computation** — consistency score, BMI calculation
7. **Measurement soft warning** — 30-day rule returns correct warning flag
8. **Rate limiting** — verify endpoint-specific throttling works

### What NOT to Test
* UI styling / CSS classes
* Static page rendering
* Third-party library internals (Recharts, Framer Motion)
* Django admin panel customization

### Backend Tests (pytest + pytest-django)
* API endpoint tests (status codes, response format, data integrity)
* Service layer unit tests (calculations, business logic)
* Permission tests (unauthorized access attempts)
* Throttling tests (rate limit enforcement)

### Frontend Tests (React Testing Library)
* Form submission flows (daily log, onboarding, measurements)
* Auth guard behavior (redirect when unauthenticated)
* Component interaction tests (toggle, date scroller, collapsible sections)
* API error handling (toast display on failure)

---

## PROJECT STRUCTURE

### Backend (Django)
```
backend/
├── config/                     # Django project settings
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py            # Common settings (django-environ)
│   │   ├── development.py     # Dev: DEBUG=True, loose CORS
│   │   └── production.py      # Prod: DEBUG=False, strict CORS
│   ├── urls.py                # Root URL configuration
│   └── wsgi.py
├── apps/
│   ├── authentication/        # Auth app (register, login, OAuth, JWT, email verification)
│   │   ├── models.py          # (uses User from users app)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py        # Auth business logic (token management, OAuth linking)
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── cleanup_expired_tokens.py
│   │   └── tests/
│   │       ├── test_register.py
│   │       ├── test_login.py
│   │       ├── test_oauth.py
│   │       └── test_tokens.py
│   ├── users/                 # User profile management
│   │   ├── models.py          # Custom User model (AbstractBaseUser)
│   │   ├── managers.py        # Custom UserManager
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py           # Jazzmin admin config
│   │   └── tests/
│   ├── foods/                 # Food catalog + meal logging
│   │   ├── models.py          # Food, FoodEntry
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py        # Recompute daily log totals from food entries
│   │   ├── admin.py
│   │   ├── fixtures/
│   │   │   └── foods_seed.json  # ~100 curated Indian + international foods
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── seed_foods.py
│   │   └── tests/
│   ├── logs/                  # Daily logs CRUD + custom metrics
│   │   ├── models.py          # DailyLog, CustomMetricDefinition, CustomMetricEntry
│   │   ├── serializers.py
│   │   ├── custom_serializers.py  # Custom metric serializers
│   │   ├── views.py
│   │   ├── custom_views.py    # Custom metric views
│   │   ├── urls.py
│   │   ├── services.py        # protein_hit, calories_ok, workout variety
│   │   └── tests/
│   ├── measurements/          # Body measurements
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py        # 30-day warning logic
│   │   └── tests/
│   ├── dashboard/             # Analytics & computed data
│   │   ├── models.py          # MonthlyMetrics model
│   │   ├── services.py        # Streaks, alerts, monthly metrics
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── compute_monthly_metrics.py
│   │   └── tests/
│   └── core/                  # Shared utilities (DRY)
│       ├── permissions.py     # IsOwner, IsOnboarded, IsEmailVerified
│       ├── pagination.py      # Standard pagination class
│       ├── throttling.py      # AuthRateThrottle, WriteRateThrottle, ReadRateThrottle
│       ├── mixins.py          # OwnerQuerySetMixin (filters by user)
│       ├── renderers.py       # Standardized API response format
│       └── exceptions.py      # Custom exception handler
├── manage.py
├── requirements/
│   ├── base.txt              # Includes google-auth for OAuth token verification
│   ├── development.txt
│   └── production.txt
├── pytest.ini
└── Dockerfile
```

### Frontend (Next.js)
```
frontend/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (auth)/                 # Auth route group (unauthenticated)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (onboarding)/           # Onboarding route group
│   │   │   └── setup/page.tsx
│   │   ├── (app)/                  # Authenticated app route group
│   │   │   ├── layout.tsx          # App layout with nav (BottomTabBar/Sidebar)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── log/page.tsx
│   │   │   ├── measurements/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Banner.tsx
│   │   ├── forms/                  # Form components
│   │   │   ├── DailyLogForm.tsx
│   │   │   ├── MeasurementForm.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── TargetForm.tsx
│   │   │   └── AuthForm.tsx
│   │   ├── charts/                 # Recharts wrappers — ALL "use client"
│   │   │   ├── WeightTrendChart.tsx
│   │   │   ├── CalorieProgressBar.tsx
│   │   │   └── ConsistencyChart.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── BottomTabBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageTransition.tsx
│   │   └── shared/                 # Shared/composite components
│   │       ├── DateScroller.tsx
│   │       ├── StreakCounter.tsx
│   │       ├── AlertBanner.tsx
│   │       └── MetricCard.tsx
│   ├── lib/                        # Utilities and services
│   │   ├── api.ts                  # Centralized Axios client (interceptors, refresh, retry)
│   │   ├── auth.ts                 # Auth helpers (token storage, guards)
│   │   ├── env.ts                  # Zod-validated environment variables
│   │   ├── validators.ts           # Form validation schemas (Zod)
│   │   └── utils.ts                # Shared utility functions
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDailyLog.ts
│   │   ├── useDashboard.ts
│   │   └── useMeasurements.ts
│   ├── types/                      # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── log.ts
│   │   └── measurement.ts
│   └── styles/                     # Tailwind config and design tokens
│       └── theme.ts
├── public/
│   └── images/
│       └── body-models/          # 8 SVG body silhouettes (gender × bmi_category)
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
├── Dockerfile
└── .env.local
```

### Infrastructure
```
docker-compose.dev.yml              # Dev: PostgreSQL + Django backend + pgAdmin (optional)
docs/
├── postman/
│   └── fitness-tracker.postman_collection.json
├── api-reference.md
└── setup-guide.md
.github/
└── workflows/
    ├── backend-ci.yml              # Lint (black, isort, flake8) + Test (pytest)
    └── frontend-ci.yml             # Lint (eslint, prettier) + Build (next build)
.env.example                        # Template with all required env vars
README.md
```

---

## SPRINT PLAN (4 Sprints)

### SPRINT 1 — Foundation & Authentication ✅ DONE
**Goal:** Project scaffolding, database setup, full auth system working end-to-end

**Completed:**
- [x] Django project with split settings (base/dev/prod), Docker Compose, Custom User model
- [x] Email/password registration + email verification, Google OAuth with account linking
- [x] JWT token refresh with rotation, logout with blacklisting
- [x] Password reset/change, account lockout (5 attempts, 15-min cooldown)
- [x] Core utilities: permissions, pagination, throttling, renderers, exception handler
- [x] Swagger/OpenAPI, Django Jazzmin admin, CORS, database indexes
- [x] Onboarding endpoints (profile + targets), DailyLog CRUD with 7-day edit restriction
- [x] Dashboard endpoints (summary, trends, streaks, alerts, monthly metrics)
- [x] Body measurements with immutability and 30-day soft warning
- [x] Settings facade, account deactivation, audit logging

---

### SPRINT 2 — Food System + Daily Log Expansion + Onboarding Updates
**Goal:** Full food logging system, expanded daily logs with workout types and fibre, updated onboarding with 4 diet types and expanded targets

**Backend Tasks:**
- [x] Add Mailpit to docker-compose.dev.yml for visual email testing
- [x] Expand DietTypeChoices: add Vegan, Eggetarian (4 total)
- [x] Expand UserTarget model: add carbs_target, fats_target, fibre_target, water_target, sleep_target, steps_target
- [x] Expand DailyLog: add fibre field, workout_type field (weight_training/cardio/bodyweight_training), remove cardio boolean
- [x] Create `foods` app: Food model, FoodEntry model with denormalized nutrients
- [x] Food CRUD API: search/filter, create custom foods, detail, delete (owner only)
- [x] Meal logging API: add/update/delete food entries per daily log with auto-recompute of daily totals
- [x] Seed data: `seed_foods` management command with ~100 curated Indian + international foods
- [x] Update onboarding serializers/views for 4 diet types and expanded targets
- [x] Update settings facade for expanded target fields
- [ ] Write tests for food CRUD, meal logging, auto-recompute, expanded targets

**Frontend Tasks:**
- [ ] Build food search + meal logging UI on daily log page (4 meals: breakfast/lunch/snack/dinner)
- [ ] Build workout type selector (radio buttons when workout=True)
- [ ] Build fibre field in daily log form
- [ ] Update onboarding forms: 4 diet types, expanded target fields (simple styled inputs)
- [ ] Update settings page: expanded target editing

**Deliverable:** Users can search foods, log meals by quantity, see auto-computed daily totals. Workout types tracked. Expanded targets for macros/water/sleep/steps.

---

### SPRINT 3 — Custom Metrics + Workout System + Dashboard + Weekly Review + Body Visual
**Goal:** Custom daily metrics, workout variety rule, weekly review, body type visual on dashboard

**Backend Tasks:**
- [x] Custom metric system: CustomMetricDefinition + CustomMetricEntry models
- [x] Custom metrics API: CRUD definitions, log daily values
- [x] Workout weekly variety rule: check_weekly_workout_variety() service function
- [x] Dashboard alerts: add workout variety warning
- [x] Weekly review: get_weekly_review() service + WeeklyReviewView + URL
- [x] Body type visual: 8 SVG placeholders (4 BMI categories × 2 genders)
- [ ] Write tests for custom metrics, workout variety, weekly review

**Frontend Tasks:**
- [ ] Build custom metrics manager (create/delete definitions + daily value entry)
- [ ] Build macro progress circles component (protein/carbs/fats/fibre circular progress bars)
- [ ] Build body type visual display component (maps gender + bmi_category → SVG)
- [ ] Build weekly review page/modal (avg calories/protein, workouts, weight change, consistency)
- [ ] Build workout variety alert display on dashboard

**Deliverable:** Users can create custom daily metrics, see workout variety alerts, view weekly review summaries, and see body type visual on dashboard.

---

### SPRINT 4 — Settings, Polish, Testing & Production Readiness
**Goal:** Mobile optimization, comprehensive testing, deployment readiness.

**Backend Tasks:**
- [ ] Complete audit logging coverage for all sensitive operations
- [ ] Performance optimization (verify indexes, query optimization with `django-debug-toolbar`)
- [ ] Core logic test coverage: 70-80% (auth, logs, foods, calculations, permissions, streaks)
- [ ] Security audit (OWASP top 10 checklist)
- [ ] Generate final Postman collection (all endpoints)
- [ ] Document API in `/docs/api-reference.md`

**Frontend Tasks:**
- [ ] Build bottom tab bar navigation (mobile)
- [ ] Build sidebar navigation (desktop)
- [ ] Build responsive breakpoints (mobile-first)
- [ ] Mobile optimization pass (44px touch targets, scroll behavior, input sizing)
- [ ] Add skeleton loading screens for all pages
- [ ] Add page transition animations (Framer Motion)
- [ ] Accessibility pass (ARIA labels, keyboard navigation, contrast ratios)
- [ ] Frontend component tests (form flows, auth guards, API error handling)
- [ ] Cross-browser testing (Chrome, Safari, Firefox mobile)
- [ ] Performance audit (Lighthouse score target: 90+)

**DevOps:**
- [ ] Finalize docker-compose.dev.yml
- [ ] Document deployment guide for free hosting (Vercel + Railway/Render + Railway Postgres)
- [ ] Environment variable documentation
- [ ] Final CI/CD pipeline verification
- [ ] Create setup-guide.md (local dev setup instructions)

**Deliverable:** Production-ready application. All features working, tested, mobile-optimized, and deployment-ready.

---

## MVP DEFINITION

The MVP is complete when a user can:

1. Register with email/password (with email verification) OR sign in with Google
2. Google OAuth links to existing account if email matches (no duplicates)
3. Complete mandatory onboarding (profile + targets with 4 diet types and expanded macro targets)
4. Log daily health data in < 15 seconds
5. Log food by meal (breakfast/lunch/snack/dinner) with auto-computed daily totals
6. Track workout type (weight training / cardio / bodyweight training)
7. Create and track custom daily metrics
8. Edit/delete logs within 7 days (API-enforced)
9. See weight and nutrition trends on dashboard with macro progress circles
10. View streaks and alerts for missed targets (including workout variety)
11. View weekly review summary (avg calories/protein, workouts, consistency)
12. See body type visual model on dashboard based on BMI
13. Log body measurements with 30-day soft warning (API-driven)
14. Update profile and expanded targets in settings
15. Logout securely (token blacklisted)
16. Access all features on mobile with responsive design
17. All business rules enforced at backend (frontend is display-only)

---

## DEVELOPMENT RULES (MANDATORY)

### DO NOT:
* Add unnecessary UI features beyond what's defined in this document
* Add gamification (badges, points, levels, achievements)
* Add social features (leaderboards, sharing, challenges)
* Add profile photos
* Add email/push notifications
* Add dark/light theme toggle (dark only for MVP)
* Add imperial unit support
* Trust frontend for business rule enforcement
* Use generated columns that reference other tables
* Mix authentication strategies (header-only JWT)
* Test UI styling or CSS classes
* Over-engineer abstractions for single-use code

### DO:
* Keep logging under 15 seconds
* Maintain minimal, premium UI as defined
* Keep API clean and versioned (`/api/v1/`)
* Enforce ALL business rules at backend (API level)
* Compute derived fields in Django service layer
* Use endpoint-specific rate limiting
* Validate environment variables at startup (backend + frontend)
* Write tests for core business logic (70-80% coverage)
* Follow DRY — reuse components, services, utilities
* Follow this vision document exactly — if it's not in here, discuss before implementing

---

## FUTURE EXTENSIONS (Phase 2+ — NOT in MVP but architecturally supported)

* **Phone/OTP authentication** — deferred to Phase 2+
* **Interactive onboarding widgets** — fancy scroll pickers, date wheels (MVP uses simple styled inputs)
* **Advanced body type visuals** — animated/interactive 3D models (MVP uses static SVG silhouettes)
* **Smart nutrition systems** — barcode scanning, AI food recognition, recipe builder
* Data export (CSV + PDF reports)
* Profile photo upload
* Multi-device sync
* Mobile PWA install (offline support)
* Coach / trainer access mode (role-based)
* Wearable step sync (Fitbit, Apple Health)
* Email/push notifications (opt-in)
* Custom admin dashboard (branded, Next.js)
* Dark/light theme toggle
* Imperial unit support
* Social features (leaderboards, challenges)
* AI-powered insights and recommendations
* Celery for background task processing (monthly metrics, email sending)
* Settings versioning (track config changes per user over time)

---

## FINAL DIRECTIVE

Build the system exactly as defined in this vision document.

* **Keep it minimal** — no feature bloat
* **Keep it fast** — < 15 second logging
* **Keep it honest** — truth over motivation
* **Keep it DRY** — reusable components and services
* **Keep it tested** — core logic at 70-80% coverage
* **Keep it secure** — endpoint-specific security from day one
* **Keep it mobile** — mobile-first responsive design
* **Keep it backend-enforced** — frontend is display, backend is authority

If a feature **adds friction**, remove it.
If a feature **doesn't change behavior**, don't build it.
If a decision **isn't in this document**, discuss before implementing.

---

*This document is the single source of truth for all development decisions. All sprints must reference and follow this vision. Any changes require updating this document first.*
