# 🚀 WatchTogether Deployment Guide

This guide covers deploying the WatchTogether application to Google Cloud Run and Firebase Hosting using GitHub Actions.

## 📋 Prerequisites

Before deploying, ensure you have completed the setup from [SETUP.md](./SETUP.md), including:
- ✅ Google Cloud Platform project configured
- ✅ Firebase project configured  
- ✅ All required API keys and service accounts obtained
- ✅ Environment variables properly configured locally
- ✅ Application builds successfully (`npm run build`)

## 🏗️ Deployment Architecture

- **Backend**: Deployed to Google Cloud Run (serverless containers)
- **Frontend**: Deployed to Firebase Hosting (CDN)
- **Database**: Firebase Firestore (real-time database)
- **Authentication**: Firebase Auth
- **CI/CD**: GitHub Actions (automatic deployment on push to main)

## 🔐 GitHub Secrets Configuration

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | How to get it |
|-------------|-------------|---------------|
| `GCP_PROJECT_ID` | Your GCP project identifier | GCP Console → Project Info |
| `GCP_SA_KEY` | Service account JSON key | GCP Console → IAM & Admin → Service Accounts |
| `GCP_REGION` | Cloud Run deployment region | Choose: `us-central1`, `us-east1`, etc. |
| `VERTEX_MODEL` | Vertex AI model resource path | Format: `projects/PROJECT/locations/REGION/publishers/google/models/MODEL@VERSION` |
| `JWT_SECRET` | JWT token signing secret | Generate securely (32+ characters) |
| `CLIENT_API_KEY` | Client authentication key | Use for development or generate secure key |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON | Firebase Console → Project Settings → Service Accounts |

### Optional Secrets

| Secret Name | Description | When needed |
|-------------|-------------|-------------|
| `OPENAI_API_KEY` | OpenAI API key | Only if using OpenAI fallback |

### Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Enter the secret name and value
6. Click **"Add secret"**

**⚠️ Important**: 
- For JSON secrets (`GCP_SA_KEY`, `FIREBASE_SERVICE_ACCOUNT`), paste the entire JSON as a single line
- Remove all newlines from JSON values
- Test your secrets by checking deployment logs

## 🔄 GitHub Actions Workflows

The repository includes two deployment workflows:

### 1. Primary Workflow: `deploy.yml`
- **Triggers**: Push to `main` or `master` branch
- **Actions**: 
  - Builds frontend with Vite
  - Deploys backend to Cloud Run
  - Deploys frontend to Firebase Hosting
- **Configuration**: Uses hardcoded project settings

### 2. Alternative Workflow: `cloud-run-deploy.yml`
- **Triggers**: Push to `main` branch
- **Actions**: 
  - Builds and deploys backend to Cloud Run only
  - Uses secrets for all configuration

## 📝 Deployment Process

### Automatic Deployment

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Monitor deployment**:
   - Go to your repository → **Actions** tab
   - Watch the deployment progress
   - Check for any errors in the logs

3. **Verify deployment**:
   - Backend: Check Cloud Run URL in GCP Console
   - Frontend: Visit your Firebase Hosting URL

### Manual Deployment (if needed)

If automatic deployment fails, you can deploy manually:

#### Deploy Backend to Cloud Run

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push container
docker build -t gcr.io/YOUR_PROJECT_ID/watchtogether .
docker push gcr.io/YOUR_PROJECT_ID/watchtogether

# Deploy to Cloud Run
gcloud run deploy watchtogether-backend \
  --image gcr.io/YOUR_PROJECT_ID/watchtogether \
  --region us-central1 \
  --set-env-vars="VERTEX_MODEL=YOUR_VERTEX_MODEL,JWT_SECRET=YOUR_JWT_SECRET,CLIENT_API_KEY=YOUR_CLIENT_KEY"
```

#### Deploy Frontend to Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Build and deploy
npm run build
firebase deploy --only hosting
```

## 🔧 Configuration Files

### Firebase Hosting Configuration

The `firebase.json` file configures Firebase Hosting with rewrites:

```json
{
  "hosting": {
    "rewrites": [
      { "source": "/api/**", "run": { "serviceId": "watchtogether-backend", "region": "us-central1" } },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

This setup:
- Routes `/api/**` requests to Cloud Run backend
- Serves frontend for all other routes (SPA routing)

### Docker Configuration

The `Dockerfile` builds a production container:
- Installs Node.js dependencies
- Builds frontend with Vite
- Runs Express server serving both API and static files

## 🧪 Testing Deployment

### Health Checks

After deployment, test these endpoints:

```bash
# Replace YOUR_DOMAIN with your actual domain
export DOMAIN="https://your-app.web.app"

# Test health endpoint
curl $DOMAIN/health

# Test readiness
curl $DOMAIN/ready

# Test metrics
curl $DOMAIN/metrics
```

### AI Assistant Test

```bash
# Test AI endpoint (replace with your CLIENT_API_KEY)
curl -X POST $DOMAIN/api/ai \
  -H "Content-Type: application/json" \
  -H "x-client-key: your-client-key" \
  -d '{"model":"gpt-5-mini","input":"Hello from production test"}'
```

### Frontend Test

1. Open your Firebase Hosting URL in browser
2. Test user registration/login
3. Create a room
4. Test video sharing functionality
5. Try the AI assistant feature

## 🔍 Monitoring and Debugging

### Cloud Run Logs

View backend logs in GCP Console:
1. Go to **Cloud Run** → Select your service
2. Click **Logs** tab
3. Filter by severity level or search for errors

### Firebase Hosting Logs

Check Firebase Hosting in Firebase Console:
1. Go to **Hosting** section
2. View deployment history
3. Check for any deployment errors

### GitHub Actions Logs

Debug deployment issues:
1. Go to repository → **Actions** tab
2. Click on failed workflow run
3. Expand each step to see detailed logs
4. Look for authentication, build, or deployment errors

### Common Issues and Solutions

#### Authentication Errors
```
Error: Invalid service account key
```
**Solution**: Ensure JSON keys are properly formatted as single lines in GitHub secrets.

#### Build Errors
```
Error: Module not found
```
**Solution**: Check that all dependencies are in `package.json` and imports are correct.

#### Permission Errors
```
Error: Permission denied
```
**Solution**: Verify service account has required roles (Cloud Run Admin, Storage Admin).

#### Environment Variable Issues
```
Error: Environment variable not set
```
**Solution**: Confirm all required GitHub secrets are configured correctly.

## 🌍 Custom Domain Setup

### Firebase Hosting Custom Domain

1. In Firebase Console → **Hosting**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

### Cloud Run Custom Domain

1. In GCP Console → **Cloud Run**
2. Select your service → **Manage Custom Domains**
3. Click **"Add mapping"**
4. Configure domain and SSL certificate

## 📊 Performance Optimization

### Backend Optimization
- **Container resources**: Adjust CPU/memory in Cloud Run settings
- **Concurrency**: Configure max concurrent requests per container
- **Scaling**: Set min/max instances based on traffic

### Frontend Optimization
- **Caching**: Firebase Hosting provides automatic CDN caching
- **Bundle size**: Monitor build output and optimize if needed
- **Images**: Optimize image assets for web delivery

## 🔄 Environment Management

### Multiple Environments

For staging/production setup:

1. **Create separate projects**: 
   - `yourapp-staging`
   - `yourapp-production`

2. **Configure separate secrets**:
   - Use branch-based deployment
   - Different secret names for each environment

3. **Use environment-specific configs**:
   ```bash
   # Staging
   GCP_PROJECT_ID=yourapp-staging
   
   # Production
   GCP_PROJECT_ID=yourapp-production
   ```

### Rolling Back Deployments

#### Cloud Run Rollback
```bash
# List revisions
gcloud run revisions list --service=watchtogether-backend

# Rollback to previous revision
gcloud run services update-traffic watchtogether-backend \
  --to-revisions=REVISION_NAME=100
```

#### Firebase Hosting Rollback
```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

## 📈 Scaling Considerations

### Traffic Planning
- **Expected users**: Plan for concurrent users
- **Request patterns**: Consider peak usage times
- **Geographic distribution**: Deploy in multiple regions if needed

### Cost Management
- **Cloud Run pricing**: Pay per request + container time
- **Firebase pricing**: Hosting bandwidth + database operations
- **Monitoring**: Set up billing alerts

## 🆘 Support and Troubleshooting

### Deployment Support
- **GitHub Actions logs**: First place to check for issues
- **GCP Console**: Monitor Cloud Run metrics and logs
- **Firebase Console**: Check hosting deployment status

### Getting Help
- Review error messages carefully
- Check service account permissions
- Verify all environment variables are set
- Test locally before deploying
- Check GitHub Issues for similar problems

---

**🎉 Congratulations!** Once deployed successfully, your WatchTogether application will be available globally with automatic scaling and high availability.
