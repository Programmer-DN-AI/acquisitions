# 🏗️ Acquisitions API - Architecture Deep Dive

_A comprehensive guide to understanding how this Node.js authentication API works_

---

## 🎯 1. The Big Picture

**What is this?**
This is a **REST API for user acquisition workflows** - essentially a modern authentication system that handles user registration, login, and session management. Think of it as the backend foundation for any app that needs secure user accounts.

**What problem does it solve?**
It provides a secure, production-ready authentication system with proper password hashing, JWT tokens, role-based access control, and comprehensive logging - all the boring-but-critical stuff you need before building user-facing features.

---

## 🏛️ 2. Core Architecture

This follows a **layered monolith architecture** with clean separation of concerns:

```
🌐 HTTP Request
     ↓
🛣️  Routes (auth.routes.js)
     ↓
🎮 Controllers (auth.controller.js)
     ↓
⚙️  Services (auth.service.js)
     ↓
🗃️  Models (user.model.js)
     ↓
🐘 PostgreSQL Database
```

**Why this architecture?**

- **Routes** handle HTTP routing and middleware
- **Controllers** manage request/response lifecycle and validation
- **Services** contain pure business logic (reusable across different interfaces)
- **Models** define data structure and database schema

---

## 🧩 3. Key Components Breakdown

### 🎮 **Controllers** (`src/controllers/`)

**Purpose**: HTTP request orchestrators

- Validate incoming requests using Zod schemas
- Coordinate between services and utilities
- Format responses and handle HTTP status codes
- Centralized error handling with proper logging

### ⚙️ **Services** (`src/services/`)

**Purpose**: Core business logic engine

- Password hashing and comparison (bcrypt)
- User creation and authentication logic
- Database operations (through Drizzle ORM)
- Independent of HTTP concerns (could work in CLI, GraphQL, etc.)

### 🗃️ **Models** (`src/models/`)

**Purpose**: Data structure definitions

- Drizzle ORM schemas that map to PostgreSQL tables
- Type-safe database operations
- Migration-driven schema changes

### 🛠️ **Utils** (`src/utils/`)

**Purpose**: Reusable tools

- `jwt.js` - JWT token signing/verification
- `cookies.js` - Secure cookie management
- `format.js` - Error message formatting

### ✅ **Validations** (`src/validations/`)

**Purpose**: Input sanitization and validation

- Zod schemas for type-safe request validation
- Consistent error messages across endpoints

---

## 📊 4. Data Flow & Communication

Here's how a typical **user registration** flows through the system:

```
📱 Client Request
     ↓
 POST /sign-up
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "user"
}
     ↓
🛣️ auth.routes.js → signup controller
     ↓
🎮 auth.controller.js
   ├── Validates with signupSchema (Zod)
   ├── Calls createUser service
   ├── Generates JWT token
   ├── Sets secure HTTP-only cookie
   └── Returns user data (no password)
     ↓
⚙️ auth.service.js
   ├── Checks if email already exists
   ├── Hashes password with bcrypt (10 rounds)
   ├── Inserts user into database
   └── Returns sanitized user object
     ↓
🗃️ user.model.js → PostgreSQL via Drizzle ORM
     ↓
📱 Response: 201 Created
{
  "message": "User registered",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
+ Set-Cookie: token=eyJhbGciOiJ...; HttpOnly; Secure
```

### 🔐 **Authentication Flow**

```
1. Login Request → Validate credentials → Generate JWT → Set cookie
2. Subsequent Requests → Read cookie → Verify JWT → Allow/Deny
3. Logout Request → Clear cookie → Invalidate session
```

---

## 🛠️ 5. Tech Stack & Dependencies

### **Core Framework & Server**

- **Express.js 5.1.0** - Fast, minimal web framework
- **Node.js ES Modules** - Modern JavaScript with `import/export`

### **Database & ORM**

- **PostgreSQL** (via Neon serverless) - Robust relational database
- **Drizzle ORM 0.44.5** - Type-safe, lightweight ORM
- **@neondatabase/serverless** - Serverless PostgreSQL driver

### **Security & Authentication**

- **bcrypt 6.0.0** - Password hashing (10 salt rounds)
- **jsonwebtoken 9.0.2** - JWT token generation/verification
- **helmet 8.0.0** - Security headers middleware
- **cors 2.8.5** - Cross-origin resource sharing

### **Validation & Logging**

- **Zod 4.1.8** - TypeScript-first schema validation
- **Winston 3.17.0** - Comprehensive logging solution
- **Morgan 1.10.0** - HTTP request logging middleware

### **Development Tools**

- **ESLint + Prettier** - Code quality and formatting
- **Drizzle Kit** - Database migrations and studio

**Why these choices?**

- **Drizzle ORM**: Type-safe, no magic strings, great TypeScript support
- **Zod**: Runtime type validation that matches TypeScript types
- **Winston**: Structured logging essential for production debugging
- **bcrypt**: Industry standard for password hashing
- **Neon**: Serverless PostgreSQL scales to zero, perfect for modern apps

---

## 🚀 6. Execution Flow - Step by Step

Let's trace a complete request lifecycle:

### **🌟 Application Startup**

1. `src/index.js` loads environment variables
2. `src/server.js` starts Express server on configured port
3. `src/app.js` configures middleware stack:
   ```javascript
   Helmet (security) → CORS → JSON parsing → Cookie parsing → Morgan (logging)
   ```

### **📥 Incoming Request: POST /sign-in**

1. **Route Matching** (`auth.routes.js`)

   ```javascript
   router.post('/sign-in', signIn);
   ```

2. **Controller Processing** (`auth.controller.js`)

   ```javascript
   - Parse request body
   - Validate with signInSchema (email, password)
   - If invalid → return 400 with formatted errors
   - If valid → call authenticateUser service
   ```

3. **Service Logic** (`auth.service.js`)

   ```javascript
   - Query database for user by email
   - If not found → throw "User not found"
   - Compare plain password with hashed password
   - If invalid → throw "Invalid password"
   - If valid → return sanitized user object
   ```

4. **Database Query** (via Drizzle ORM)

   ```javascript
   db.select().from(users).where(eq(users.email, email)).limit(1);
   ```

5. **Response Generation**
   ```javascript
   - Generate JWT with user payload
   - Set secure HTTP-only cookie
   - Return 200 with user data
   - Log successful authentication
   ```

### **⚡ Path Mapping Magic**

Notice the clean imports like `#config/logger.js`? This uses Node.js import maps:

```json
"imports": {
  "#config/*": "./src/config/*",
  "#controllers/*": "./src/controllers/*"
}
```

This avoids ugly relative paths like `../../../config/logger.js`

---

## ⚖️ 7. Strengths & Tradeoffs

### ✅ **Strengths**

- **Security First**: Proper password hashing, JWT tokens, HTTP-only cookies
- **Type Safety**: Zod validation + Drizzle ORM provide excellent type checking
- **Clean Architecture**: Clear separation between routes, controllers, services
- **Production Ready**: Comprehensive logging, error handling, security middleware
- **Modern JavaScript**: ES modules, async/await, clean import paths
- **Scalable Database**: Serverless PostgreSQL with migration-based schema management
- **Developer Experience**: Hot reload, linting, formatting, database GUI

### ⚠️ **Tradeoffs & Considerations**

- **Single Responsibility**: Currently only handles authentication (by design)
- **Database Dependency**: Requires PostgreSQL connection (could add Redis for sessions)
- **JWT in Cookies**: Stateless but harder to invalidate (could add blacklist)
- **No Rate Limiting**: Should add for production (express-rate-limit)
- **Basic Error Handling**: Could benefit from more sophisticated error types
- **Missing Middleware**: No authentication middleware for protecting routes yet

### 🎯 **What to Watch Out For**

- **Environment Variables**: Ensure `JWT_SECRET` is properly set in production
- **Database Migrations**: Always run migrations before deploying new schema changes
- **Cookie Security**: In production, ensure HTTPS for secure cookies to work
- **Logging Levels**: Adjust `LOG_LEVEL` for different environments

---

## 📝 8. Final Summary

**In 2-3 sentences for your teammate:**

_"This is a clean, modern authentication API built with Express and Drizzle ORM that handles user registration, login, and JWT-based session management. It follows a layered architecture where routes handle HTTP concerns, controllers orchestrate the flow, and services contain the business logic - all with proper validation, logging, and security built-in. The codebase is production-ready with type-safe database operations, secure password hashing, and a comprehensive development workflow."_

---

## 🚀 Quick Start Commands

```bash
# First time setup
cp .env.example .env
npm install
npm run db:migrate

# Daily development
npm run dev          # Start with hot reload
npm run db:studio    # Open database GUI
npm run lint         # Check code quality
```

**Key Environment Variables:**

```env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-here
NODE_ENV=development
```
