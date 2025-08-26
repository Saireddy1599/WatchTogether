# WatchTogether Setup Guide

This guide provides detailed step-by-step instructions for setting up the WatchTogether application with all required API keys and configuration.

## 📋 Prerequisites

- Node.js (v16+ recommended)
- A Google Cloud Platform account
- A Firebase account (same Google account as GCP)
- An OpenAI account (optional, for fallback AI model)

## 🔧 Quick Setup Checklist

- [ ] Set up Google Cloud Platform project
- [ ] Configure Firebase project  
- [ ] Obtain GCP Service Account key
- [ ] Get Firebase Service Account key
- [ ] Generate JWT secret
- [ ] Set up OpenAI API key (optional)
- [ ] Configure environment variables
- [ ] Install dependencies and build project

## 🌐 Google Cloud Platform (GCP) Setup

### 1. Create or Select GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one:
   - Click on the project dropdown at the top of the page
   - Click "NEW PROJECT" or select existing project
   - Note down your **Project ID** (not the project name)

### 2. Get GCP_PROJECT_ID
- Found at the top of the GCP Console
- Click on the project name to see the Project ID
- **Example**: `watchtogether-48c1e`

### 3. Create Service Account and Get GCP_SA_KEY

1. In GCP Console, go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Fill in the details:
   - **Service account name**: `watchtogether-service`
   - **Description**: `Service account for WatchTogether app`
4. Click **"Create and Continue"**
5. Grant the following roles:
   - **Cloud Run Admin** (for deploying to Cloud Run)
   - **Storage Admin** (for managing storage resources)
6. Click **"Continue"**, then **"Done"**
7. Find your new service account in the list and click on it
8. Go to the **"Keys"** tab
9. Click **"Add Key"** → **"Create new key"**
10. Select **JSON** format and click **"Create"**
11. A JSON file will download - **save this file securely**
12. The contents of this JSON file are your `GCP_SA_KEY`

### 4. Choose GCP_REGION
- Select your preferred region (e.g., `us-central1`, `us-east1`)
- For a full list, see: [GCP Regions and Zones](https://cloud.google.com/compute/docs/regions-zones)
- **Recommended**: `us-central1`

### 5. Set up Vertex AI Model (VERTEX_MODEL)

1. In GCP Console, go to **Vertex AI** → **Model Garden**
2. Enable the Vertex AI API if prompted
3. Select or create your model:
   - For text models: Look for **"text-bison"** or similar
   - Note the full model resource name
4. Format: `projects/YOUR_PROJECT_ID/locations/YOUR_REGION/publishers/google/models/text-bison@001`
5. **Example**: `projects/watchtogether-48c1e/locations/us-central1/publishers/google/models/text-bison@001`

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** or **"Add project"**
3. **Important**: Use the same GCP project you created above
4. Enable Google Analytics if desired
5. Click **"Create project"**

### 2. Get CLIENT_API_KEY

1. In Firebase Console, select your project
2. Go to **Project Settings** (gear icon)
3. In the **General** tab, scroll down to **"Your apps"**
4. If no web app exists:
   - Click **"Add app"** → Web icon (`</>`)
   - Enter app name: `WatchTogether Web`
   - Click **"Register app"**
5. Your **Web API Key** will be displayed
6. This is your `CLIENT_API_KEY`

### 3. Get FIREBASE_SERVICE_ACCOUNT

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click on the **"Service accounts"** tab
3. Click **"Generate New Private Key"**
4. Click **"Generate Key"** in the confirmation dialog
5. A JSON file will download - **save this file securely**
6. The contents of this JSON file are your `FIREBASE_SERVICE_ACCOUNT`

## 🔐 Security Configuration

### 1. Generate JWT_SECRET

You can generate a secure JWT secret using one of these methods:

**Method 1: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Method 2: OpenSSL**
```bash
openssl rand -hex 32
```

**Method 3: Online Generator**
- Use a secure password generator to create a 32+ character random string

### 2. Set CLIENT_API_KEY (Development)

For local development, you can use: `local-dev-key`
For production, generate a secure random string similar to JWT_SECRET.

## 🤖 OpenAI Setup (Optional)

### Get OPENAI_API_KEY

1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign in to your OpenAI account (create one if needed)
3. Click **"Create new secret key"**
4. Copy the key immediately (you won't be able to see it again)
5. **Important**: Keep this key secure and never commit it to version control

## 🔧 Environment Configuration

### 1. Create .env File

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and fill in your actual values:
   ```bash
   # Required GCP Configuration
   GCP_PROJECT_ID=your-actual-project-id
   GCP_SA_KEY={"type":"service_account","project_id":"your-project",...}
   GCP_REGION=us-central1
   VERTEX_MODEL=projects/your-project/locations/us-central1/publishers/google/models/text-bison@001
   
   # Required Firebase Configuration
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
   
   # Required Security Configuration
   JWT_SECRET=your-generated-jwt-secret-here
   CLIENT_API_KEY=local-dev-key
   
   # Optional OpenAI Configuration
   OPENAI_API_KEY=sk-your-openai-key-here
   ```

### 2. Important Notes

- **Never commit `.env` file to version control**
- The `.gitignore` file should include `.env`
- For JSON values (GCP_SA_KEY, FIREBASE_SERVICE_ACCOUNT), paste as single line
- Remove all newlines from JSON values

## 🚀 Installation and Build

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (frontend) with API at `http://localhost:3001` (backend).

## 🧪 Testing Your Setup

### 1. Test Environment Variables

Create a simple test script to verify your environment variables are loaded:

```bash
node -e "require('dotenv').config(); console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID); console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);"
```

### 2. Test API Endpoint

If the server is running, test the health endpoint:

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok"}`

### 3. Test AI Endpoint (with your CLIENT_API_KEY)

```bash
curl -X POST http://localhost:3001/api/ai \
  -H "Content-Type: application/json" \
  -H "x-client-key: your-client-api-key" \
  -d '{"model":"gpt-5-mini","input":"Hello, this is a test"}'
```

## 📝 GitHub Secrets Configuration

For GitHub Actions deployment, add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add the following repository secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GCP_PROJECT_ID` | Your project ID | GCP project identifier |
| `GCP_SA_KEY` | Service account JSON | Full JSON key (single line) |
| `GCP_REGION` | us-central1 | Deployment region |
| `VERTEX_MODEL` | Full model path | Vertex AI model resource name |
| `JWT_SECRET` | Generated secret | JWT signing key |
| `CLIENT_API_KEY` | Generated key | Client authentication key |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase JSON | Firebase service account (single line) |
| `OPENAI_API_KEY` | OpenAI key | Optional - OpenAI API key |

## 🛠️ Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all imports are correct
   - Check that all required files exist
   - Run `npm install` to ensure dependencies are installed

2. **Authentication Errors**
   - Verify JSON keys are valid and on single lines
   - Check that service accounts have correct permissions
   - Ensure API keys are active and not expired

3. **Environment Variable Issues**
   - Check `.env` file exists and is in project root
   - Verify no extra spaces around variable names or values
   - Ensure JSON values don't contain newlines

4. **Firebase Connection Issues**
   - Verify Firebase project is configured correctly
   - Check that service account has Firebase permissions
   - Ensure web app is registered in Firebase project

5. **GCP Permission Issues**
   - Verify service account has required roles
   - Check that Vertex AI API is enabled
   - Ensure billing is set up on GCP project

### Getting Help

If you encounter issues:

1. Check the application logs for error messages
2. Verify all environment variables are set correctly
3. Test individual components (Firebase, GCP, etc.) separately
4. Check the GitHub Issues for known problems
5. Review the deployment logs in GitHub Actions

## 📚 Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [OpenAI Platform](https://platform.openai.com/)
- [GCP Regions List](https://cloud.google.com/compute/docs/regions-zones)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)

---

**Security Notice**: Never share your actual API keys, service account files, or JWT secrets publicly. Always use environment variables and never commit sensitive data to version control.