# ÓticaManager - SaaS for Optical Store Management

## Overview

ÓticaManager is a full-stack web application designed for optical store management. It's built with a modern tech stack using TypeScript throughout, featuring a React frontend with a Node.js/Express backend. The application provides comprehensive management tools for optical stores including product inventory, customer management, sales, prescriptions, appointments, and financial control.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Framework**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Design**: RESTful API with structured error handling
- **File Structure**: Modular route organization with separate storage layer

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Migration Strategy**: Drizzle Kit for database migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Authentication System
- JWT token-based authentication
- Secure password hashing with bcrypt
- Role-based access control (admin, user, manager)
- Protected routes with authentication middleware
- Persistent login state with localStorage

### Database Schema
The application includes comprehensive database tables:
- **Users**: Authentication and user management
- **Customers**: Patient/customer information with contact details
- **Products**: Inventory management with categories, SKU, and stock tracking
- **Product Categories**: Hierarchical product organization
- **Sales & Quotes**: Complete sales workflow from quote to sale
- **Prescriptions**: Optical prescription management with validation
- **Appointments**: Scheduling system for customer appointments
- **Financial Accounts**: Financial tracking and reporting

### UI Component System
- Consistent design system using Radix UI primitives
- Dark/light theme support with CSS variables
- Responsive design with mobile-first approach
- Accessible components following WCAG guidelines
- Reusable component library in `/client/src/components/ui/`

### Module Structure
The application is organized into functional modules:
- **Dashboard**: Overview and key metrics
- **Products & Inventory**: Stock management with low-stock alerts
- **Customers**: Patient management with prescription history
- **Sales & Quotes**: Sales workflow and quotation system
- **Financial**: Accounts payable/receivable and cash flow
- **Appointments**: Scheduling and calendar management
- **Prescriptions**: Optical prescription management
- **Reports**: Business intelligence and analytics

## Data Flow

### Client-Server Communication
1. React frontend makes API requests using TanStack Query
2. Express.js backend processes requests with authentication middleware
3. Drizzle ORM handles database operations
4. Structured JSON responses with error handling
5. Real-time updates through query invalidation

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Server validates credentials and generates JWT token
3. Token stored in localStorage and included in subsequent requests
4. Protected routes verify token before processing requests
5. Automatic logout on token expiration

### Database Operations
1. Shared schema definitions ensure type safety
2. Drizzle ORM provides type-safe database operations
3. Connection pooling for optimal performance
4. Migration system for schema updates
5. Structured queries with proper error handling

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Components**: Radix UI component library
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Form Validation**: Zod
- **Date Handling**: date-fns

### Backend Dependencies
- **Server Framework**: Express.js
- **Database**: Drizzle ORM, Neon Database client
- **Authentication**: bcrypt, jsonwebtoken
- **Development**: tsx for TypeScript execution
- **Build Tools**: esbuild for production builds

### Development Tools
- **Build System**: Vite with React plugin
- **TypeScript**: Full TypeScript support across the stack
- **Linting**: ESLint configuration
- **Development Server**: Vite dev server with HMR

## Deployment Strategy

### Development Environment
- Vite development server for frontend
- tsx for running TypeScript backend
- Hot module replacement for rapid development
- Integrated development workflow

### Production Build Process
1. Vite builds optimized frontend bundle
2. esbuild creates backend distribution
3. Static assets served from `/dist/public`
4. Server bundle in `/dist/index.js`
5. Environment-based configuration

### Database Management
- Drizzle Kit for schema migrations
- Environment variable configuration
- Connection string management
- Production-ready connection pooling

### Environment Configuration
- Development: Local development with file watching
- Production: Optimized builds with proper caching
- Database: Environment-specific connection strings
- Security: JWT secrets and secure configurations

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 01, 2025. Initial setup
- July 03, 2025. Migration from Replit Agent to Replit environment completed
- July 03, 2025. Fixed sales module error with null checks for customer properties
- July 03, 2025. Added missing DELETE route for quotes functionality 
- July 03, 2025. Enhanced quote to sale conversion with payment method selection (PIX, cartão, dinheiro, crediário)
- July 03, 2025. Integrated automatic accounts receivable creation from sales module with installment support
- July 03, 2025. Updated payment methods to distinguish between debit and credit cards with automatic installment calculations
- July 03, 2025. Transformed accounts receivable interface from card format to table format for improved data visualization
- July 03, 2025. Completed migration from Replit Agent to Replit environment with database schema fixes for sales module
- July 03, 2025. Verified accounts payable module maintains consistent layout pattern with sidebar menu and modal for new entries
- July 04, 2025. Fixed purchase orders module with proper API integration for suppliers and products dropdowns
- July 04, 2025. Corrected apiRequest function calls to include HTTP method parameter (GET requests)
- July 04, 2025. Implemented complete purchase receipts functionality with real API integration replacing mock data
- July 04, 2025. Fixed purchase receipts API to handle optional items parameter for simple receipt registration
- July 04, 2025. Completed migration from Replit Agent to Replit environment with full database setup
- July 04, 2025. Created PostgreSQL database and ran Drizzle migrations to create all required tables
- July 04, 2025. Fixed supplier dropdown issue in purchase orders by resolving missing database tables
- July 04, 2025. Seeded sample supplier data for testing purchase order functionality
- July 04, 2025. Completed migration from Replit Agent to Replit environment, fixed missing purchase order database tables
- July 04, 2025. Created and executed scripts to create missing purchase_orders, purchase_order_items, purchase_receipts, and purchase_receipt_items tables
- July 04, 2025. Fixed purchase order creation error by ensuring all required database tables exist
- July 04, 2025. Implemented automatic integration between purchase receipts and accounts payable module
- July 04, 2025. Fixed frontend endpoints to use correct accounts payable API (/api/accounts-payable) instead of financial accounts
- July 04, 2025. Purchase receipts now automatically create accounts payable entries with 30-day payment terms
- July 04, 2025. Synchronized purchase module with database by creating sample purchase orders and receipts data
- July 04, 2025. Verified purchase orders and receipts are displaying correctly in the system with proper API integration
- July 04, 2025. Completed comprehensive module synchronization analysis - all 12 modules working correctly with Neon database
- July 04, 2025. Corrected database connection to use original Neon database instead of local PostgreSQL
- July 04, 2025. Verified all API endpoints responding correctly with JWT authentication and real data from Neon database
- July 04, 2025. Fixed purchase orders automatic categorization - all new purchase orders now create accounts payable with "Fornecedores" category
- July 04, 2025. Implemented automatic overdue status update - accounts payable past due date automatically change from "pending" to "overdue"
- July 04, 2025. Enhanced accounts payable module with real-time status management and proper visual indicators for overdue accounts
- July 05, 2025. Migration from Replit Agent to Replit environment completed successfully
- July 05, 2025. Fixed database schema by adding missing purchase_order_id column to accounts_payable table
- July 05, 2025. Connected application to existing Neon database and seeded sample data for testing
- July 05, 2025. Fixed quotes module to properly display converted quotes with "Convertido em Venda" status instead of hiding them
- July 05, 2025. Enhanced purchase orders form with payment configuration fields: payment date and installments (1-36)
- July 05, 2025. Implemented automatic installment calculation showing value per installment based on total amount
- July 05, 2025. Reorganized purchase orders form layout with payment configuration section after items for better user flow