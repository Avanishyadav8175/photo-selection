# Image Selection App

Secure image selection and download management system for photographers and clients.

## Features

- **Admin Panel**: Upload up to 10GB of images, generate OTPs, manage client access
- **Client Gallery**: OTP-protected image viewing and selection
- **Secure Downloads**: Admin-controlled download access with signed URLs
- **Screenshot Protection**: Watermarked previews, disabled right-click, audit logging

## Tech Stack

- Next.js 14 (App Router)
- MongoDB Atlas
- Google Cloud Storage
- Tailwind CSS
- TypeScript

## Setup

### 1. Install Dependencies

```bash
cd image-selection-app
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Strong secret for JWT tokens
- `GCS_PROJECT_ID`: Google Cloud project ID
- `GCS_BUCKET`: GCS bucket name
- `GCS_CLIENT_EMAIL`: Service account email
- `GCS_PRIVATE_KEY`: Service account private key

### 3. Setup Google Cloud Storage

1. Create a GCS bucket
2. Create a service account with Storage Admin role
3. Download the JSON key file
4. Copy credentials to `.env.local`

### 4. Create Admin User

```bash
npm run setup-admin
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage

### Admin Workflow

1. Login at `/admin/login`
2. Create a new folder
3. Upload images (supports multiple files)
4. Generate OTP and client link
5. Share link with client
6. Monitor client selections
7. Grant download access when ready

### Client Workflow

1. Open shared link `/f/{token}`
2. Enter name, phone, and OTP
3. View and select images
4. Wait for admin to grant download
5. Download selected images

## API Endpoints

### Admin
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/folders` - Create folder
- `GET /api/admin/folders` - List folders
- `POST /api/admin/folders/:id/upload-url` - Get upload URL
- `POST /api/admin/folders/:id/images` - Save image metadata
- `POST /api/admin/folders/:id/generate-otp` - Generate OTP
- `GET /api/admin/folders/:id/clients` - List clients
- `POST /api/admin/clients/:id/grant-download` - Grant download

### Client
- `POST /api/client/validate-otp` - Validate OTP
- `GET /api/client/:token/images` - Get images
- `POST /api/client/:token/select` - Toggle selection
- `GET /api/client/:token/selections` - Get selections
- `GET /api/client/:token/downloads` - Get download URLs

## Security Features

- JWT authentication for admin
- Bcrypt password hashing
- OTP expiration (default 7 days)
- Signed GCS URLs with short expiry
- Rate limiting (recommended: add express-rate-limit)
- Audit logging for downloads
- CSS-based screenshot discouragement
- Watermarked thumbnails (implement via Cloud Function)

## Deployment

### Vercel + GCS

```bash
npm run build
vercel deploy
```

### Google Cloud Run

```bash
gcloud run deploy image-selection-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Database Collections

- `admins` - Admin users
- `folders` - Image folders
- `images` - Image metadata
- `otps` - OTP records
- `clients` - Client access records
- `selections` - Client image selections
- `downloads` - Download audit logs

## License

MIT
# photo-selection
