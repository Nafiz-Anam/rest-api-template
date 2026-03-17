# Centralized API Response & Error Handling Implementation

## 🎯 What's Been Implemented

### 1. Standardized API Response Structure
All API responses now follow a consistent format:

```typescript
{
  "success": boolean,
  "data": any,           // Only present if success = true
  "message": string,     // Optional success/error message
  "error": {             // Only present if success = false
    "code": string,
    "message": string,
    "details": any,      // Optional error details
    "stack": string      // Only in development
  },
  "meta": {
    "timestamp": string,
    "requestId": string,
    "pagination": {      // Only for paginated responses
      "page": number,
      "limit": number,
      "totalPages": number,
      "totalResults": number,
      "hasNext": boolean,
      "hasPrev": boolean
    }
  }
}
```

### 2. Centralized Error Handling
- Automatic error classification and mapping
- Structured error logging with request context
- Development vs production error detail handling
- Support for Prisma, JWT, and validation errors

### 3. Input Sanitization
- XSS protection using xss-filters
- Recursive object sanitization
- Request body, query, and parameter sanitization
- Validation helpers for common data types

### 4. Request Tracking
- Unique request IDs for all API calls
- Request ID included in response headers
- Enhanced debugging and monitoring capabilities

## 📁 New Files Created

```
src/
├── utils/
│   ├── apiResponse.ts          # Standardized response builders
│   ├── errorHandler.ts         # Centralized error handling
│   └── responseHelpers.ts      # Migration helpers
├── middlewares/
│   ├── requestId.ts            # Request ID middleware
│   └── sanitize.ts             # Input sanitization middleware
```

## 🚀 Usage Examples

### In Controllers

#### Before (Old Way)
```typescript
const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send({ user });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.loginUserWithEmailAndPassword(email, password, req);
  res.send({ tokens });
});
```

#### After (New Way)
```typescript
import { sendCreated, sendSuccess } from '../utils/apiResponse';

const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  return sendCreated(res, { user }, 'User registered successfully', req.requestId);
});

const login = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.loginUserWithEmailAndPassword(email, password, req);
  return sendSuccess(res, { tokens }, 'Login successful', httpStatus.OK, req.requestId);
});
```

#### Quick Migration (Helper Function)
```typescript
import { migrateResponse } from '../utils/responseHelpers';

const existingController = catchAsync(async (req: Request, res: Response) => {
  const data = await someService.getData();
  return migrateResponse(data, res);  // Automatically converts to new format
});
```

### Response Helper Functions

```typescript
import { 
  respondWithCreated, 
  respondWithSuccess, 
  respondWithUpdated, 
  respondWithDeleted,
  respondWithPaginated 
} from '../utils/responseHelpers';

// Create resource
return respondWithCreated(res, user, 'User created successfully');

// Success response
return respondWithSuccess(res, data, 'Operation completed');

// Update resource
return respondWithUpdated(res, updatedUser, 'User updated successfully');

// Delete resource
return respondWithDeleted(res, 'User deleted successfully');

// Paginated response
return respondWithPaginated(res, users, pagination, 'Users retrieved');
```

### Error Handling

#### Automatic Error Classification
```typescript
// Prisma errors are automatically classified
throw new Prisma.PrismaClientKnownRequestError('P2002', {}, 'Unique constraint failed');
// Automatically becomes: { code: 'DUPLICATE_RESOURCE', statusCode: 409 }

// JWT errors are automatically classified
throw new JsonWebTokenError('Invalid token');
// Automatically becomes: { code: 'TOKEN_INVALID', statusCode: 401 }
```

#### Custom Errors
```typescript
import { ErrorCode } from '../utils/apiResponse';
import ApiError from '../utils/ApiError';

// Create custom error with details
throw new ApiError(
  httpStatus.BAD_REQUEST,
  'Validation failed',
  true,
  undefined,
  { field: 'email', reason: 'Invalid format' }
);
```

### Input Sanitization

#### Automatic Sanitization
All incoming requests are automatically sanitized:
- Request body
- Query parameters  
- URL parameters

#### Manual Sanitization
```typescript
import { sanitizeHtml, sanitizeStrict, validatePasswordStrength } from '../middlewares/sanitize';

// Sanitize HTML content
const cleanHtml = sanitizeHtml(userInput);

// Strict sanitization
const cleanText = sanitizeStrict(userInput);

// Password validation
const passwordValidation = validatePasswordStrength(password);
if (!passwordValidation.valid) {
  throw new ApiError(400, 'Weak password: ' + passwordValidation.errors.join(', '));
}
```

## 🔧 Migration Strategy

### Phase 1: Core Infrastructure (✅ Done)
- [x] Create response utilities
- [x] Create error handling system
- [x] Add input sanitization
- [x] Add request tracking

### Phase 2: Gradual Controller Updates
1. Update auth controllers (partially done)
2. Update user controllers
3. Update other controllers
4. Use migration helpers for quick conversion

### Phase 3: Advanced Features
1. Add response caching
2. Add request/response logging
3. Add performance monitoring
4. Add API analytics

## 📊 Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "User created successfully",
  "meta": {
    "timestamp": "2026-03-18T01:30:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  },
  "meta": {
    "timestamp": "2026-03-18T01:30:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "User 1" },
    { "id": "2", "name": "User 2" }
  ],
  "message": "Users retrieved",
  "meta": {
    "timestamp": "2026-03-18T01:30:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalResults": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🛡️ Security Improvements

1. **XSS Protection**: All string inputs are sanitized
2. **Request Tracking**: Every request has a unique ID for audit trails
3. **Error Information Leakage**: Sensitive details only exposed in development
4. **Input Validation**: Built-in validation helpers for common data types

## 📈 Benefits Achieved

1. **Consistency**: All API responses follow the same format
2. **Debugging**: Request IDs make troubleshooting easier
3. **Security**: Automatic input sanitization prevents XSS attacks
4. **Maintainability**: Centralized error handling reduces code duplication
5. **Monitoring**: Structured logging enables better observability
6. **Developer Experience**: Clear error codes and messages

## 🔄 Next Steps

1. Update remaining controllers to use new response format
2. Add comprehensive error codes for all business scenarios
3. Implement response caching for frequently accessed data
4. Add API documentation updates reflecting new response format
5. Set up monitoring and alerting for error patterns
