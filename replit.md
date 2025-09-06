# Overview

CivicConnect is a crowdsourced civic issue reporting and resolution system designed for citizens to report civic issues (potholes, streetlights, garbage, etc.) and for authorities to manage and resolve them. The platform consists of a React-based web application for both citizens and administrators, with a Node.js/Express backend providing REST APIs.

The system enables citizens to report issues with photos, GPS coordinates, and descriptions, while providing authorities with comprehensive dashboards for triaging, assigning, and tracking issue resolution. It includes features like status tracking, priority scoring, user management, and analytics dashboards.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: JWT-based authentication with refresh tokens stored in localStorage
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture  
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database ORM**: Drizzle ORM with PostgreSQL database
- **Database Provider**: Neon serverless PostgreSQL
- **File Uploads**: Multer for handling multipart/form-data with local storage
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Validation**: Zod schemas for request/response validation
- **Geolocation**: Mapbox/Google Maps integration for reverse geocoding

## Database Design
- **Users**: Role-based access (CITIZEN, OFFICER, SUPERVISOR, ADMIN) with ward assignments
- **Issues**: Complete lifecycle tracking with status enum (DRAFT → SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → PENDING_USER_INFO → RESOLVED → REJECTED)
- **Categories**: Departmental issue categorization with SLA configuration
- **Geographic Data**: Ward and department management with PostGIS support
- **Audit Trail**: Issue events, comments, and status changes tracking

## Authentication & Authorization
- **JWT Implementation**: Access tokens (15min) + refresh tokens (7d) 
- **Role-Based Access Control**: Different permissions for citizens vs. administrative users
- **Session Management**: Automatic token refresh with fallback to login
- **Security**: Password hashing with bcrypt, input validation with Zod

## File Management
- **Upload Strategy**: Local file system storage with configurable upload directory
- **File Validation**: Type checking (images only) and size limits (10MB)
- **Future-Ready**: Abstracted file service ready for S3/CDN integration

# External Dependencies

## Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries with schema migrations
- **Local File Storage**: Current implementation with plans for cloud storage migration

## UI & Styling
- **Radix UI**: Accessible component primitives for forms, dialogs, and navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Consistent iconography throughout the application

## Maps & Geolocation
- **Mapbox/Google Maps**: Configurable geocoding service abstraction
- **Browser Geolocation API**: GPS coordinates capture for issue reporting

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking across frontend and backend
- **Replit Integration**: Development environment with runtime error handling

## Authentication Services
- **JWT**: Self-contained token-based authentication
- **bcryptjs**: Password hashing and verification
- **Future SMS Integration**: Placeholder for OTP-based authentication