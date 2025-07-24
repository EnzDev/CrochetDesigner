# Crochet Pattern Designer Application

## Overview

This is a full-stack web application for designing and managing crochet patterns. The application features a React-based frontend with an interactive canvas for pattern creation and an Express.js backend with PostgreSQL database integration using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Priority: Fix top row drawing issues - critical for crochet pattern construction.

## Recent Changes

- **January 24, 2025**: Complete PWA implementation and JSON export functionality
  - Removed all backend dependencies (Drizzle, Express, PostgreSQL) completely
  - Created comprehensive PWA manifest with proper icons and metadata
  - Implemented service worker for offline functionality and caching
  - Added PWA installation prompts and standalone mode detection
  - Created JSON export/import functionality with complete pattern data
  - Added export buttons for both PNG images and JSON pattern files
  - Patterns can now be shared and imported across devices via JSON files
  - App works 100% offline with full PWA capabilities
  - Enhanced mobile experience with proper PWA icons and splash screens
  - All patterns persist locally using browser IndexedDB with JSON backup option

- **January 23, 2025**: Enhanced desktop experience and selection tools
  - Enhanced desktop scrolling with improved overflow handling and larger scrollbars
  - Added interactive corner resize handles to select tool with blue squares
  - Implemented color changing for selected symbols when selection is active
  - Fixed canvas scrolling experience for desktop users
  - Added proper cursor feedback for selection resize handles
  - Improved selection tool usability with visual hints

## System Architecture

### Frontend Architecture (Offline-First PWA)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Simple React state management (removed TanStack Query)
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom craft-themed color palette
- **Canvas**: HTML5 Canvas API for interactive pattern drawing
- **PWA Features**: Service worker, manifest, offline caching, installation prompts

### Data Storage (Fully Offline)
- **Primary Storage**: IndexedDB for local device storage
- **Pattern Export**: JSON format with complete pattern metadata and canvas data
- **Backup/Sharing**: JSON export/import functionality for pattern sharing
- **Offline First**: No internet connection required for any functionality

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