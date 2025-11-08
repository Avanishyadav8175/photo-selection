# Quick Start Guide

## Prerequisites

1. Node.js 18+ installed
2. MongoDB Atlas account (free tier works)
3. Google Cloud account with billing enabled

## Step-by-Step Setup

### 1. MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for testing)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### 2. Google Cloud Storage Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Cloud Storage API
4. Create a bucket:
   - Name: `your-bucket-name`
   - Location: Choose nearest region
   - Storage class: Standard
   - Access control: Uniform
5. Create service account:
   - IAM & Admin → Service Accounts → Create
   - Grant "Storage Admin" role
   - Create JSON key → Download
6. Make bucket publicly readable (for signed URLs):
   ```bash
   gsutil iam ch allUsers:objectViewer gs://your-bucket-name
   ```

### 3. Install & Configure

```bash
cd image-selection-app
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/imageselection
JWT_SECRET=generate-a-random-32-char-string-here
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
UPLOAD_MAX_SIZE_BYTES=10737418240
OTP_EXPIRY_HOURS=168
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create Admin User

```bash
npm run setup-admin
```

Enter:
- Name: Your Name
- Email: admin@example.com
- Password: (choose a strong password)

### 5. Run the App

```bash
npm run dev
```

Open http://localhost:3000

### 6. Test the Flow

**As Admin:**
1. Login at `/admin/login`
2. Create a folder (e.g., "Wedding Photos")
3. Upload some test images
4. Click "Generate OTP"
5. Copy the OTP and client link

**As Client:**
1. Open the client link in incognito/private window
2. Enter name, phone, and the OTP
3. Select some images
4. Go back to admin panel
5. See the client's selections
6. Click "Grant Download"
7. Client can now download selected images

## Production Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel
```

Add environment variables in Vercel dashboard.

### Google Cloud Run

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud run deploy image-selection-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI="...",JWT_SECRET="...",GCS_PROJECT_ID="...",GCS_BUCKET="...",GCS_CLIENT_EMAIL="...",GCS_PRIVATE_KEY="..."
```

## Troubleshooting

**MongoDB connection fails:**
- Check IP whitelist
- Verify connection string
- Ensure database user has correct permissions

**GCS upload fails:**
- Verify service account has Storage Admin role
- Check bucket name matches .env
- Ensure private key is properly formatted (with \n)

**OTP validation fails:**
- Check OTP hasn't expired (default 7 days)
- Verify MongoDB time is correct
- Try generating a new OTP

**Images don't display:**
- Check GCS bucket permissions
- Verify signed URL generation
- Check browser console for CORS errors

## Next Steps

- Add rate limiting with `express-rate-limit`
- Implement watermarking via Cloud Functions
- Add email/SMS notifications with SendGrid/Twilio
- Set up monitoring with Google Cloud Monitoring
- Configure CDN for faster image delivery
- Add bulk download as ZIP file
- Implement folder expiration automation
