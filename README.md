# 🎬 WatchTogether

A synchronized movie watching experience with AI-powered features. Watch movies together with friends in real-time with chat, reactions, and intelligent recommendations.

## ✨ Features

- **Synchronized Video Playback**: Watch movies together in perfect sync
- **Real-time Chat**: Communicate with your watch party
- **AI Assistant**: Get movie recommendations and answer questions about content
- **Multiple Streaming Services**: Support for Netflix, Prime Video, Hotstar, and more
- **Room Management**: Create and join private watch rooms
- **Firebase Authentication**: Secure user authentication
- **Cloud Run Deployment**: Scalable serverless backend
- **WhatsApp Integration**: Easy room sharing

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v16+ recommended)
- Google Cloud Platform account
- Firebase account
- OpenAI account (optional, for AI fallback)

### 2. Setup Configuration

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your API keys and configuration in `.env` (see SETUP.md for detailed instructions)

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

### 3. Run Locally

**Development mode (with Vite dev server):**
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

**Production mode:**
```bash
node server.js
```
- Full app: http://localhost:3001

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GCP_PROJECT_ID` | Google Cloud Project ID | [GCP Console](https://console.cloud.google.com) |
| `GCP_SA_KEY` | Service Account JSON key | GCP Console → IAM & Admin → Service Accounts |
| `GCP_REGION` | Cloud Run deployment region | e.g., `us-central1` |
| `VERTEX_MODEL` | Vertex AI model resource name | GCP Console → Vertex AI |
| `JWT_SECRET` | JWT signing secret | Generate securely (32+ chars) |
| `CLIENT_API_KEY` | Client authentication key | Generate for development |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON | Firebase Console → Project Settings |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for fallback AI | - |
| `PORT` | Server port | 3001 |
| `DEFAULT_MODEL` | Default AI model | gpt-5-mini |

**📖 For step-by-step instructions on obtaining each key, see [SETUP.md](./SETUP.md)**

## 🏗️ Architecture

- **Frontend**: React + Vite for modern web development
- **Backend**: Express.js server with rate limiting and security
- **Database**: Firebase Firestore for real-time data
- **Authentication**: Firebase Auth with JWT tokens
- **AI**: Google Vertex AI (primary) + OpenAI (fallback)
- **Deployment**: 
  - Backend: Google Cloud Run
  - Frontend: Firebase Hosting
  - CI/CD: GitHub Actions

## 📡 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /ready` - Readiness check  
- `GET /metrics` - Application metrics

### Authentication
- `POST /auth/firebase-login` - Exchange Firebase ID token for JWT

### AI Assistant
- `POST /api/ai` - Chat with AI assistant (supports streaming)

## 🧪 Testing

### Test the AI Endpoint
```bash
# Test with client key
curl -X POST http://localhost:3001/api/ai \
  -H "Content-Type: application/json" \
  -H "x-client-key: local-dev-key" \
  -d '{"model":"gpt-5-mini","input":"Hello, this is a test"}'
```

### Test Health Endpoints
```bash
curl http://localhost:3001/health
curl http://localhost:3001/ready
curl http://localhost:3001/metrics
```

## 🚀 Deployment

### Automatic Deployment
The project includes GitHub Actions workflows for automatic deployment:

1. **Backend to Cloud Run**: Triggered on push to `main` branch
2. **Frontend to Firebase Hosting**: Included in the same workflow

### Required GitHub Secrets
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `GCP_REGION`
- `VERTEX_MODEL`
- `JWT_SECRET`
- `CLIENT_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT`
- `OPENAI_API_KEY` (optional)

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

## 🛡️ Security

- **Rate limiting**: 30 requests/minute per IP for AI endpoints
- **Authentication**: Multiple auth methods (Firebase, JWT, client keys)
- **Environment isolation**: All secrets in environment variables
- **Request validation**: JSON payload size limits (10KB)
- **CORS protection**: Configured for production domains

## 🤝 How to Use

1. **Create Account**: Sign up with email or join as guest
2. **Create Room**: Select a streaming service and video URL
3. **Invite Friends**: Share room link via WhatsApp or direct link
4. **Watch Together**: Video playback synced across all participants
5. **Chat & React**: Use built-in chat and reaction features
6. **Ask AI**: Get movie recommendations and content insights

## 📁 Project Structure

```
├── src/                    # React frontend source
├── components/            # Shared components
├── server.js             # Express backend server
├── firebase.js           # Firebase configuration
├── config.js             # Client-side configuration
├── SETUP.md              # Detailed setup instructions
├── DEPLOY.md             # Deployment guide
├── .env.example          # Environment variables template
└── .github/workflows/    # CI/CD configurations
```

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style
- ES6+ JavaScript/JSX
- React functional components with hooks
- Express.js with async/await
- Environment-based configuration

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Follow the setup instructions in [SETUP.md](./SETUP.md)
4. Make your changes and test thoroughly
5. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

- **Setup Issues**: Check [SETUP.md](./SETUP.md) for detailed instructions
- **Deployment Issues**: See [DEPLOY.md](./DEPLOY.md) for deployment troubleshooting
- **Bug Reports**: Open an issue on GitHub with detailed information
- **Feature Requests**: Create an issue with the enhancement label

---

**⚠️ Important**: Never commit your `.env` file or expose API keys in client-side code. Always use environment variables for sensitive configuration.
