# Authentication Structure

This document explains how authentication and token handling are implemented in this backend project. It is intended as a reference for new developers joining the team.

---

## Overview

The project uses **JWT (JSON Web Tokens)** for authentication and authorization. There are two main types of tokens:
- **Access Token**: Short-lived, used for authenticating API requests.
- **Refresh Token**: Long-lived, used to obtain new access tokens without requiring the user to log in again.

Authentication is enforced consistently across all protected endpoints using middleware.

---

## Token Lifecycle

### 1. **Login Flow**
- User submits credentials to the login endpoint.
- If valid, the backend:
  - Generates an **access token** (JWT, expires in 24h by default).
  - If "remember me" is selected, generates a **refresh token** (JWT, expires in 15 days) and sets it as an HTTP-only cookie.
  - Creates a session in the database for refresh token management.
- The access token is returned in the response body.

### 2. **Accessing Protected Endpoints**
- The client includes the access token in the `Authorization` header as `Bearer <token>`.
- The backend uses the `authenticateToken` middleware to:
  - Extract and verify the token.
  - Attach the decoded user info to `req.user`.
  - Reject requests with missing, expired, or invalid tokens.

### 3. **Refreshing Tokens**
- When the access token expires, the client can call the `/auth/refresh-token` endpoint.
- The backend:
  - Reads the refresh token from the HTTP-only cookie.
  - Verifies the token and checks the session in the database.
  - If valid, issues a new access token (and optionally a new refresh token).

### 4. **Logout**
- On logout, the session is invalidated in the database and the refresh token cookie is cleared.

---

## Guest Authentication
- Guest users have a similar flow, with special endpoints and guest-specific access tokens.
- Guest tokens are generated and validated using similar JWT logic.

---

## Middleware & Consistency
- **`authenticateToken` middleware** is used on all protected routes to enforce authentication.
- **Role-based and property-based access** is enforced using additional middleware (e.g., `checkPermissions`, `checkPropertyAccess`).
- **Socket connections** use a similar token authentication middleware for real-time features.
- All endpoints requiring authentication are protected in a consistent manner.

---

## Security Practices
- **Access tokens** are short-lived and only sent in the `Authorization` header.
- **Refresh tokens** are long-lived, stored as HTTP-only cookies, and never exposed to JavaScript.
- **Sessions** are stored in the database and checked for validity on each refresh.
- **Custom error handling** is used for expired, invalid, or missing tokens.
- **Production cookies** are set as `secure` and `sameSite=strict`.

---

## Summary
- The authentication system is robust, secure, and consistent.
- All protected endpoints use the same middleware, making it easy for new developers to understand and extend.
- For more details, see the code in `src/middlewares/jwt.middleware.js`, `src/controllers/auth.controller.js`, and `src/services/auth.service.js`.

If you have questions or need to extend authentication, follow the established patterns in the codebase. 