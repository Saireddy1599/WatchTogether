# 🗝️ API Keys and Secrets Quick Reference

This document provides a quick reference for all the API keys and secrets needed for the WatchTogether application.

## 📖 Documentation Overview

- **[README.md](./README.md)** - Project overview and quick start guide
- **[SETUP.md](./SETUP.md)** - Detailed step-by-step setup instructions for all API keys
- **[DEPLOY.md](./DEPLOY.md)** - Comprehensive deployment guide
- **[.env.example](./.env.example)** - Template for environment variables

## 🔑 Required API Keys & Secrets Summary

### Google Cloud Platform (GCP)

| Key | Description | Where to get |
|-----|-------------|--------------|
| **GCP_PROJECT_ID** | Your GCP project identifier | [GCP Console](https://console.cloud.google.com/) → Project dropdown |
| **GCP_SA_KEY** | Service account JSON credentials | GCP Console → IAM & Admin → Service Accounts → Create Key |
| **GCP_REGION** | Deployment region | Choose from [available regions](https://cloud.google.com/compute/docs/regions-zones) |
| **VERTEX_MODEL** | Vertex AI model resource name | GCP Console → Vertex AI → Model Garden |

### Firebase

| Key | Description | Where to get |
|-----|-------------|--------------|
| **CLIENT_API_KEY** | Firebase Web API Key | [Firebase Console](https://console.firebase.google.com) → Project Settings → General |
| **FIREBASE_SERVICE_ACCOUNT** | Firebase Admin SDK key | Firebase Console → Project Settings → Service Accounts |

### Application Security

| Key | Description | How to generate |
|-----|-------------|-----------------|
| **JWT_SECRET** | JWT token signing key | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **CLIENT_API_KEY** | Client auth key | Use `local-dev-key` for dev or generate random string |

### External APIs (Optional)

| Key | Description | Where to get |
|-----|-------------|--------------|
| **OPENAI_API_KEY** | OpenAI API access | [OpenAI Platform](https://platform.openai.com/account/api-keys) |

## ⚡ Quick Setup Commands

```bash
# 1. Clone and setup
git clone <your-repo>
cd WatchTogether

# 2. Copy environment template
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Build project
npm run build

# 5. Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Quick Deploy Checklist

- [ ] All API keys obtained and configured in `.env`
- [ ] Project builds successfully (`npm run build`)
- [ ] GitHub secrets configured for deployment
- [ ] Firebase project created and configured
- [ ] GCP project with required APIs enabled
- [ ] Service accounts created with proper permissions

## 📋 Verification Steps

### Local Development
```bash
# Test environment loading
node -e "require('dotenv').config(); console.log('✅ GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID)"

# Test health endpoint
curl http://localhost:3001/health
```

### Production Deployment
```bash
# Test deployed health endpoint
curl https://your-domain.web.app/health

# Test AI API
curl -X POST https://your-domain.web.app/api/ai \
  -H "Content-Type: application/json" \
  -H "x-client-key: your-client-key" \
  -d '{"input":"Test message"}'
```

## 🔗 External Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [OpenAI Platform](https://platform.openai.com/)
- [GCP Regions List](https://cloud.google.com/compute/docs/regions-zones)

---

**🔒 Security Reminder**: Never commit actual API keys to version control. Always use environment variables and keep your `.env` file private.