# TaskFlow API

![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Swagger](https://img.shields.io/badge/swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

A robust backend API built with NestJS featuring JWT authentication, queue processing, and comprehensive documentation.

## ✨ Features

### ✅ Implemented

- **User Management**
  - Full CRUD operations with validation
  - Pagination & filtering (`/users?name=John&limit=10&page=1`)
  - Role-based access control
  - Secure password hashing (bcrypt)
- **Authentication**

  - JWT-based auth system
  - Protected routes with guards
  - Swagger API documentation with auth support

- **Code Quality**

  - TypeScript with strict typing
  - DTO validation with `class-validator`
  - Response serialization
  - Comprehensive code comments

- **Testing**
  - Unit & integration tests (Jest)
  - Test coverage for edge cases
  - Supertest for HTTP assertions

### ⚠️ Pending (Roadmap)

- Rate limiting for API endpoints
- BullMQ queue processing implementation

## 📚 API Documentation

Interactive Swagger documentation available at `/api` when running the server.

![Swagger UI Preview](https://example.com/path-to-your-swagger-screenshot.png)

## 📊 Status Summary

| Section                | Status       | Notes                            |
| ---------------------- | ------------ | -------------------------------- |
| User CRUD              | ✅ Completed | Full implementation              |
| Input Validation       | ✅ Completed | `class-validator` usage          |
| Filtering & Pagination | ✅ Completed | On user listing route            |
| Auth + JWT             | ✅ Completed | Fully working                    |
| Swagger Docs           | ✅ Completed | Tagged and live                  |
| Code Comments          | ✅ Completed | Included in all logic            |
| Serialization          | ✅ Completed | Passwords hidden                 |
| Testing                | ✅ Completed | With edge cases                  |
| Rate Limiting          | ⚠️ Pending   | Mentioned as future improvement  |
| Queue Processing       | ⚠️ Pending   | Will be tested with BullMQ setup |
