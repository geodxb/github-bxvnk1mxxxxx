# Interactive Brokers Affiliate Dashboard

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/geodxb/github-jzncnyuo-rgexaz0000)

## Overview

A comprehensive React-based dashboard for managing Interactive Brokers affiliate operations, investor accounts, and financial transactions.

## Features

- **Investor Management**: Complete investor profile and account management
- **Withdrawal Processing**: Advanced withdrawal request handling with progress tracking
- **Commission Tracking**: Automated commission calculations and reporting
- **Real-time Messaging**: Enhanced communication system between admins and investors
- **Governor Controls**: Supreme administrative access for platform oversight
- **Security Features**: Account flagging, shadow bans, and compliance monitoring

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Chart.js + React Chart.js 2
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # Firebase and business logic services
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── contexts/           # React context providers
└── lib/                # Configuration and utilities
```

## Key Features

### Multi-Role Authentication
- **Admin**: Full platform management capabilities
- **Governor**: Supreme oversight and control functions
- **Investor**: Personal dashboard and account management

### Real-time Data
- Live updates for all financial data
- Real-time messaging system
- Instant notification system

### Security & Compliance
- Role-based access control
- Account flagging and restriction system
- Comprehensive audit trails
- W-8 BEN form integration for tax compliance

### Financial Management
- Automated commission calculations
- Withdrawal progress tracking
- Performance analytics
- Transaction history management

## Deployment

The application is configured for deployment on multiple platforms:

- **Firebase Hosting**: `npm run deploy`
- **Cloudflare Workers**: `npm run deploy` (via Wrangler)

## License

All rights reserved. Interactive Brokers LLC.