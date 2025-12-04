# Firebase Studio - Multifinger Caliper Application

This is a NextJS application with Firebase integration for multifinger caliper data analysis.

## Environment Setup

The application supports automatic switching between development and production environments based on the `NODE_ENV` variable.

### Development Mode
- **File Upload**: Direct upload to local backend (no Cloudflare R2)
- **Backend URL**: `http://localhost:8000`
- **Environment File**: `.env.development`

### Production Mode
- **File Upload**: Via Cloudflare R2 presigned URLs
- **Backend URL**: `https://studio-2lx4.onrender.com`
- **Environment File**: `.env.production`

### Environment Variables

Create the following files in the root directory:

#### `.env.development`
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key_here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-your_measurement_id"

# SendGrid for email notifications
SENDGRID_API_KEY=your_sendgrid_api_key
ADMIN_EMAIL=your-admin-email@domain.com

# Environment flag
NODE_ENV=development
```

#### `.env.production`
```bash
# Same Firebase configuration as development
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key_here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-your_measurement_id"

# SendGrid for email notifications
SENDGRID_API_KEY=your_sendgrid_api_key
ADMIN_EMAIL=your-admin-email@domain.com

# Environment flag
NODE_ENV=production

# Note: R2 configuration is handled in the backend deployment environment
```

### Backend Environment Variables

For the Python backend, set these environment variables in your deployment:

```bash
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_REGION=auto
PORT=8000
```

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment files** as described above
4. **Start development server**: `npm run dev`
5. **Start backend server**: Navigate to `backend/` and run `python main.py`

## Features

- **Automatic Environment Detection**: No code changes needed when switching between dev/prod
- **File Upload Optimization**: Direct upload in development, R2 in production
- **Data Downsampling**: Automatic reduction of large datasets for browser performance
- **Multifinger Caliper Analysis**: LAS file processing and visualization

## Architecture

- **Frontend**: Next.js with React, TypeScript
- **Backend**: FastAPI with Python
- **Storage**: Local files (dev) / Cloudflare R2 (prod)
- **Authentication**: Firebase Auth
- **Database**: Firebase (for user management)
