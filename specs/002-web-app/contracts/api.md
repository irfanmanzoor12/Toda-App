# API Contracts: Phase II REST API

**Feature**: 002-web-app
**Created**: 2025-12-28
**Status**: Draft
**Base URL**: `/api`

---

## Overview

This document defines the complete REST API contract for Phase II. All endpoints, request/response formats, status codes, and error handling are specified here.

**API Characteristics**:
- RESTful design principles
- JSON request/response bodies
- JWT token authentication (except auth endpoints)
- Standard HTTP status codes
- OpenAPI/Swagger documentation at `/docs`

---

## Authentication Flow

### 1. Register New User → 2. Login → 3. Access Protected Resources

**Token Format**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Token Structure** (JWT payload):
```json
{
  "sub": "123",
  "email": "user@example.com",
  "exp": 1704153600,
  "iat": 1704067200
}
```

---

## Authentication Endpoints

### POST /api/auth/register

**Purpose**: Create a new user account

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Request Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format (RFC 5322) |
| `password` | string | Yes | Min 8 characters, at least 1 letter and 1 number |

**Success Response** (201 Created):
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Error Responses**:

**400 Bad Request** - Email already registered:
```json
{
  "detail": "Email already registered",
  "error_code": "EMAIL_EXISTS"
}
```

**422 Unprocessable Entity** - Invalid email format:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

**422 Unprocessable Entity** - Password too short:
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "ensure this value has at least 8 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

---

### POST /api/auth/login

**Purpose**: Authenticate user and receive JWT token

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Request Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Any string (checked against hash) |

**Success Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Response Schema**:
| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | JWT token (valid for 24 hours) |
| `token_type` | string | Always "bearer" |

**Error Responses**:

**401 Unauthorized** - Invalid credentials:
```json
{
  "detail": "Invalid email or password",
  "error_code": "INVALID_CREDENTIALS"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "detail": "Too many login attempts. Please try again later.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'

# Response:
# {"access_token":"eyJhbGc...","token_type":"bearer"}

# Use token in subsequent requests:
export TOKEN="eyJhbGc..."
```

---

### GET /api/auth/me

**Purpose**: Get current authenticated user's information

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Response Schema**:
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | User's unique identifier |
| `email` | string | User's email address |
| `created_at` | string | ISO 8601 timestamp of account creation |

**Error Responses**:

**401 Unauthorized** - Missing token:
```json
{
  "detail": "Not authenticated",
  "error_code": "MISSING_TOKEN"
}
```

**401 Unauthorized** - Invalid token:
```json
{
  "detail": "Invalid authentication credentials",
  "error_code": "INVALID_TOKEN"
}
```

**401 Unauthorized** - Expired token:
```json
{
  "detail": "Token has expired",
  "error_code": "TOKEN_EXPIRED"
}
```

**Example**:
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Todo Endpoints

### POST /api/todos

**Purpose**: Create a new todo for the authenticated user

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, coffee"
}
```

**Request Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | Min 1 char, max 500 chars (trimmed) |
| `description` | string | No | Max 2000 chars, defaults to "" |

**Success Response** (201 Created):
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, coffee",
  "status": "pending",
  "created_at": "2025-01-15T10:00:00Z",
  "user_id": 1
}
```

**Response Schema**:
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique todo identifier |
| `title` | string | Todo title (trimmed) |
| `description` | string | Todo description |
| `status` | string | Always "pending" on creation |
| `created_at` | string | ISO 8601 timestamp |
| `user_id` | integer | Owner's user ID |

**Error Responses**:

**400 Bad Request** - Empty title:
```json
{
  "detail": "Title cannot be empty",
  "error_code": "VALIDATION_ERROR",
  "field": "title"
}
```

**400 Bad Request** - Title too long:
```json
{
  "detail": "Title cannot exceed 500 characters",
  "error_code": "VALIDATION_ERROR",
  "field": "title"
}
```

**400 Bad Request** - Description too long:
```json
{
  "detail": "Description cannot exceed 2000 characters",
  "error_code": "VALIDATION_ERROR",
  "field": "description"
}
```

**401 Unauthorized** - Missing/invalid token:
```json
{
  "detail": "Not authenticated",
  "error_code": "MISSING_TOKEN"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk, eggs, bread"}'
```

---

### GET /api/todos

**Purpose**: List all todos for the authenticated user

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**: None (Phase II does not support filtering/pagination)

**Success Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "created_at": "2025-01-15T10:00:00Z",
    "user_id": 1
  },
  {
    "id": 2,
    "title": "Finish report",
    "description": "",
    "status": "complete",
    "created_at": "2025-01-14T15:30:00Z",
    "user_id": 1
  }
]
```

**Response Schema**: Array of Todo objects (see POST /api/todos response)

**Ordering**: Todos ordered by `created_at DESC` (newest first)

**Empty List** (200 OK):
```json
[]
```

**Error Responses**:

**401 Unauthorized** - Missing/invalid token:
```json
{
  "detail": "Not authenticated",
  "error_code": "MISSING_TOKEN"
}
```

**Example**:
```bash
curl -X GET http://localhost:8000/api/todos \
  -H "Authorization: Bearer $TOKEN"
```

---

### GET /api/todos/{id}

**Purpose**: Get a specific todo by ID (only if owned by authenticated user)

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID to retrieve |

**Success Response** (200 OK):
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, coffee",
  "status": "pending",
  "created_at": "2025-01-15T10:00:00Z",
  "user_id": 1
}
```

**Response Schema**: Todo object (see POST /api/todos response)

**Error Responses**:

**404 Not Found** - Todo doesn't exist:
```json
{
  "detail": "Todo not found",
  "error_code": "TODO_NOT_FOUND"
}
```

**403 Forbidden** - Todo belongs to different user:
```json
{
  "detail": "Not authorized to access this todo",
  "error_code": "FORBIDDEN"
}
```

**401 Unauthorized** - Missing/invalid token:
```json
{
  "detail": "Not authenticated",
  "error_code": "MISSING_TOKEN"
}
```

**422 Unprocessable Entity** - Invalid ID format:
```json
{
  "detail": [
    {
      "loc": ["path", "id"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
}
```

**Example**:
```bash
curl -X GET http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### PUT /api/todos/{id}

**Purpose**: Update a todo's title and/or description

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID to update |

**Request Body**:
```json
{
  "title": "Buy groceries and supplies",
  "description": "Milk, eggs, bread, coffee, cleaning supplies"
}
```

**Request Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | No | If provided: min 1 char, max 500 chars |
| `description` | string | No | If provided: max 2000 chars |

**Note**: At least one field (title or description) must be provided

**Success Response** (200 OK):
```json
{
  "id": 1,
  "title": "Buy groceries and supplies",
  "description": "Milk, eggs, bread, coffee, cleaning supplies",
  "status": "pending",
  "created_at": "2025-01-15T10:00:00Z",
  "user_id": 1
}
```

**Response Schema**: Updated Todo object

**Error Responses**:

**400 Bad Request** - No fields provided:
```json
{
  "detail": "At least one field (title or description) must be provided",
  "error_code": "NO_FIELDS_PROVIDED"
}
```

**400 Bad Request** - Validation error:
```json
{
  "detail": "Title cannot be empty",
  "error_code": "VALIDATION_ERROR",
  "field": "title"
}
```

**404 Not Found** - Todo doesn't exist:
```json
{
  "detail": "Todo not found",
  "error_code": "TODO_NOT_FOUND"
}
```

**403 Forbidden** - Todo belongs to different user:
```json
{
  "detail": "Not authorized to modify this todo",
  "error_code": "FORBIDDEN"
}
```

**401 Unauthorized** - Missing/invalid token:
```json
{
  "detail": "Not authenticated",
  "error_code": "MISSING_TOKEN"
}
```

**Example**:
```bash
curl -X PUT http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title","description":"Updated description"}'
```

---

### PATCH /api/todos/{id}/complete

**Purpose**: Mark a todo as complete (idempotent operation)

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID to mark complete |

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "complete",
  "created_at": "2025-01-15T10:00:00Z",
  "user_id": 1
}
```

**Response Schema**: Updated Todo object with `status: "complete"`

**Idempotent Behavior**:
- Marking an already complete todo returns 200 OK with no changes
- No error thrown for duplicate complete operations

**Error Responses**:

**404 Not Found** - Todo doesn't exist:
```json
{
  "detail": "Todo not found",
  "error_code": "TODO_NOT_FOUND"
}
```

**403 Forbidden** - Todo belongs to different user:
```json
{
  "detail": "Not authorized to modify this todo",
  "error_code": "FORBIDDEN"
}
```

**401 Unauthorized** - Missing/invalid token:
```json
{
  "detail": "Not authenticated",
  "error_code": "MISSING_TOKEN"
}
```

**Example**:
```bash
curl -X PATCH http://localhost:8000/api/todos/1/complete \
  -H "Authorization: Bearer $TOKEN"
```

---

### DELETE /api/todos/{id}

**Purpose**: Permanently delete a todo

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID to delete |

**Request Body**: None

**Success Response** (204 No Content):
```
(empty body)
```

**Error Responses**:

**404 Not Found** - Todo doesn't exist:
```json
{
  "detail": "Todo not found",
  "error_code": "TODO_NOT_FOUND"
}
```

**403 Forbidden** - Todo belongs to different user:
```json
{
  "detail": "Not authorized to delete this todo",
  "error_code": "FORBIDDEN"
}
```

**401 Unauthorized** - Missing/invalid token:
```json
{
  "detail": "Not authenticated",
  "error_code": "MISSING_TOKEN"
}
```

**Example**:
```bash
curl -X DELETE http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer $TOKEN"

# Success: HTTP 204, no response body
```

---

## Error Response Format

All error responses follow this consistent format:

**Standard Error** (400, 401, 403, 404, 500):
```json
{
  "detail": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE"
}
```

**Validation Error** (422):
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "Human-readable error",
      "type": "error_type"
    }
  ]
}
```

**Error Codes**:
| Code | Description |
|------|-------------|
| `EMAIL_EXISTS` | Email already registered |
| `INVALID_CREDENTIALS` | Wrong email/password |
| `MISSING_TOKEN` | Authorization header missing |
| `INVALID_TOKEN` | JWT token invalid or malformed |
| `TOKEN_EXPIRED` | JWT token expired (> 24 hours) |
| `TODO_NOT_FOUND` | Todo ID doesn't exist |
| `FORBIDDEN` | User doesn't own this resource |
| `VALIDATION_ERROR` | Input validation failed |
| `NO_FIELDS_PROVIDED` | Update request with no fields |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## HTTP Status Codes

**Success Codes**:
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST (resource created)
- `204 No Content`: Successful DELETE

**Client Error Codes**:
- `400 Bad Request`: Validation error (business logic)
- `401 Unauthorized`: Missing/invalid/expired token
- `403 Forbidden`: Valid token, insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `422 Unprocessable Entity`: Schema validation error (Pydantic)
- `429 Too Many Requests`: Rate limit exceeded

**Server Error Codes**:
- `500 Internal Server Error`: Unexpected server error

---

## OpenAPI Documentation

**Interactive Docs**: `GET /docs`
- Swagger UI with all endpoints
- Try-it-out functionality
- Schema definitions
- Example requests/responses

**OpenAPI Spec**: `GET /openapi.json`
- Machine-readable API specification
- Importable into Postman, Insomnia, etc.

**Example**:
```bash
# Access in browser
open http://localhost:8000/docs

# Download OpenAPI spec
curl http://localhost:8000/openapi.json > api-spec.json
```

---

## Rate Limiting

**Authentication Endpoints**:
- `POST /api/auth/login`: 10 requests per minute per IP
- `POST /api/auth/register`: 5 requests per minute per IP

**Other Endpoints**:
- No rate limiting in Phase II
- Future: 100 requests per minute per user

**Rate Limit Headers** (When implemented):
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1704067200
```

---

## CORS Configuration

**Allowed Origins**:
- Development: `http://localhost:3000` (Next.js dev server)
- Production: Configured via `CORS_ORIGINS` environment variable

**Allowed Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers**: Content-Type, Authorization

**Credentials**: Allowed (for cookie-based auth if used)

**Preflight**: Automatic OPTIONS handling

**Example Preflight**:
```bash
curl -X OPTIONS http://localhost:8000/api/todos \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"

# Response includes CORS headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: POST
# Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## API Testing Examples

### Complete User Flow

**1. Register**:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**2. Login**:
```bash
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}' \
  | jq -r '.access_token')
```

**3. Create Todo**:
```bash
curl -X POST http://localhost:8000/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test todo","description":"Test description"}'
```

**4. List Todos**:
```bash
curl -X GET http://localhost:8000/api/todos \
  -H "Authorization: Bearer $TOKEN"
```

**5. Mark Complete**:
```bash
curl -X PATCH http://localhost:8000/api/todos/1/complete \
  -H "Authorization: Bearer $TOKEN"
```

**6. Update Todo**:
```bash
curl -X PUT http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title"}'
```

**7. Delete Todo**:
```bash
curl -X DELETE http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Security Considerations

**Token Security**:
- JWT tokens transmitted in Authorization header (not URL)
- Tokens expire after 24 hours
- No token refresh in Phase II (re-login required)

**Password Security**:
- Passwords never logged or exposed in responses
- Bcrypt hashing with cost factor 12
- Minimum password requirements enforced

**Input Validation**:
- All inputs validated at multiple layers (Pydantic, business logic, database)
- SQL injection prevented (ORM with parameterized queries)
- XSS prevented (JSON responses, no HTML rendering)

**Authorization**:
- All todo endpoints check ownership (user_id match)
- 403 Forbidden returned for unauthorized access attempts
- No cross-user data leakage

---

## Related Documents

- **Specification**: `specs/002-web-app/spec.md`
- **Implementation Plan**: `specs/002-web-app/plan.md`
- **Research Decisions**: `specs/002-web-app/research.md`
- **Data Model**: `specs/002-web-app/data-model.md`
