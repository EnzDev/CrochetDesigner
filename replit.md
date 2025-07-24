# Crochet Pattern Designer Application

## Overview

This is a full-stack web application for designing and managing crochet patterns. The application features a React-based frontend with an interactive canvas for pattern creation and an Express.js backend with PostgreSQL database integration using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Priority: Fix top row drawing issues - critical for crochet pattern construction.

## Recent Changes

- **January 23, 2025**: Complete conversion to offline-only crochet pattern designer
  - Removed all backend dependencies and server-side logic completely
  - Implemented IndexedDB storage for fully offline pattern management
  - Updated scripts to use client-only Vite development server
  - Fixed save/load functionality to work with local device storage
  - Removed references to users table and server packages
  - App now works 100% offline with no internet connection required
  - All patterns persist locally using browser IndexedDB
  - Replaced complex DDD with simple, reliable pattern management
  - Fixed top row drawing issues with straightforward approach
  - Simplified state management for better reliability
  - Fixed mobile responsiveness and touch scrolling support
  - Added grid numbering at 10s and 50s for enhanced grid styles
  - Set chain as default symbol and removed unreliable freehand drawing
  - Pen tool now only works with crochet symbols for consistent behavior
  - Implemented negative column numbering system with leftward expansion
  - Added startCol tracking and proper symbol shifting for left column operations
  - Purple "START" line marks column 0 reference point
  - Add/Remove Left buttons properly shift existing stitches physically
  - Enhanced canvas scrolling with proper desktop scrollbar styling
  - Added corner resize handles on selections with cursor feedback
  - Implemented color changing for selected symbols when color picker changes
  - Added raw JSON export functionality for pattern data exchange
  - Made app a Progressive Web App (PWA) with offline capability and app installation

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom craft-themed color palette
- **Canvas**: HTML5 Canvas API for interactive pattern drawing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **API Design**: RESTful endpoints for pattern CRUD operations
- **Development**: Hot reload with Vite integration in development mode

### Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema**: Two main tables - `users` and `patterns`
- **Pattern Storage**: Canvas data stored as base64 encoded strings, pattern metadata as JSONB
- **Fallback**: In-memory storage implementation for development/testing

## Key Components

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Patterns Table**: Comprehensive pattern storage including:
  - Pattern metadata (title, hook size, yarn weight, difficulty)
  - Canvas data (base64 encoded image data)
  - Pattern elements (JSONB for flexible schema)
  - Canvas configuration (dimensions, grid size)

### Frontend Components
- **PatternDesigner**: Main application page with canvas and controls
- **PatternCanvas**: Interactive drawing canvas with tool support
- **ToolSidebar**: Drawing tools and crochet symbol selection
- **PatternInfoPanel**: Pattern metadata editing interface
- **SavePatternModal**: Pattern save/load functionality

### API Endpoints
- `GET /api/patterns` - Retrieve all patterns
- `GET /api/patterns/:id` - Get specific pattern by ID
- `POST /api/patterns` - Create new pattern
- `PUT /api/patterns/:id` - Update existing pattern
- `DELETE /api/patterns/:id` - Delete pattern

## Data Flow

1. **Pattern Creation**: User interacts with canvas tools to draw patterns
2. **Canvas State Management**: Canvas operations managed through React state
3. **Pattern Persistence**: Canvas data serialized to base64, metadata collected from form inputs
4. **API Communication**: TanStack Query handles server communication with optimistic updates
5. **Database Storage**: Drizzle ORM provides type-safe database operations
6. **Pattern Retrieval**: Saved patterns loaded and restored to canvas state

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, TanStack Query for frontend
- **Backend**: Express.js, Drizzle ORM, Neon Database serverless driver
- **Development**: Vite, TypeScript, TSX for development server

### UI and Styling
- **Component Library**: Extensive Radix UI component set via Shadcn/ui
- **Styling**: Tailwind CSS with PostCSS for processing
- **Icons**: Lucide React for consistent iconography

### Specialized Libraries
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date manipulation
- **Canvas**: Embla Carousel for UI carousels

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations managed via `drizzle-kit push`

### Environment Configuration
- **Development**: Hot reload with Vite dev server and Express backend
- **Production**: Static frontend served by Express with API routes
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Key Build Commands
- `npm run dev` - Development server with hot reload
- `npm run build` - Production build for both frontend and backend
- `npm run start` - Production server startup
- `npm run db:push` - Apply database schema changes

The application is designed as a modern full-stack TypeScript application with strong type safety, responsive design, and efficient development workflows. The architecture supports both development and production deployments with minimal configuration changes.