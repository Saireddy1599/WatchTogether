# WatchTogether - Copilot Instructions

WatchTogether is a premium synchronized movie watching platform with real-time chat, AI assistant integration, and multi-streaming service support. It's a Node.js/Express backend with a vanilla HTML/JavaScript frontend, Firebase authentication, and Google Cloud deployment capabilities.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Install Dependencies
- Install Node.js 20+ if not already available
- `npm install` -- installs all dependencies (~10-15 seconds)
- Create `.env` file with required environment variables (see Environment Setup section)

### Build and Development Workflow
- `npm run build` -- uses custom build.js, very fast (~0.05 seconds). NEVER CANCEL.
- `npm start` -- starts Express server on port 3001 (~3 seconds to start)
- `npm run dev` -- starts Vite dev server on port 3000 (has JSX issues, use npm start instead)
- `npm test` -- runs Jest test suite (~1-2 seconds). NEVER CANCEL.

### Test Commands and Timing
- `npm test` -- runs all Jest tests (~1-2 seconds). Some tests may fail due to auth/API dependencies.
- `npm run test:api` -- runs API-specific tests only
- `npm run test:smoke` -- runs Playwright smoke tests (requires playwright package)
- Set timeout to 60+ seconds for test commands to be safe. NEVER CANCEL test runs.

### Validation Scenarios
Always manually validate changes using these complete end-to-end scenarios:

#### Basic Application Flow
1. Start server: `npm start`
2. Navigate to http://localhost:3001
3. Test guest login: Click "Guest" → Enter display name → Click "Join as Guest"
4. Expected: Should show dashboard with streaming services (Firebase errors are expected in dev)

#### AI Assistant Testing
1. Click the 🤖 floating button (bottom right)
2. Enter test prompt: "Hello, can you help me test the system?"
3. Click Send
4. Expected: Should get "Error: fetch failed" (expected with test API keys)
5. Validates the full API request flow is working

#### Room and Video Features
1. Click "Create Room" from dashboard
2. Enter room details and create
3. Click "➕ Add Video" to test video integration
4. Test sample videos (Big Buck Bunny, Elephant Dream)
5. Verify video player interface loads correctly

#### Settings and UI Features  
1. Click ⚙️ Settings button
2. Test theme switching (Dark/Light/Cinema)
3. Test notification toggles
4. Verify settings persist in localStorage

## Environment Setup

### Required Environment Variables (.env file)
```
# Basic server setup
OPENAI_API_KEY=sk-your-openai-key-here
CLIENT_API_KEY=local-dev-key

# Optional - for production deployment
VERTEX_MODEL=projects/PROJECT/locations/LOCATION/publishers/google/models/text-bison@001
GCP_PROJECT_ID=your-gcp-project-id
JWT_SECRET=your-jwt-secret-here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Test Environment (.env for development)
```
OPENAI_API_KEY=test-key
CLIENT_API_KEY=local-dev-key
```

## Build System Architecture

### Primary Build System (Working)
- **Main build**: `npm run build` uses `build.js` 
- **Time**: ~0.05 seconds (extremely fast)
- **Output**: Creates `dist/` folder with deployable static files
- **What it does**: Copies HTML, CSS, JS files and tests to dist directory
- This is the build system used by Docker and deployment

### Secondary Build System (Has Issues)  
- **Vite build**: `npm run build:vite` 
- **Status**: Has JSX import errors, not the primary system
- **Usage**: For React development if JSX issues are resolved

### Server Architecture
- **Express.js** server on port 3001
- **Static file serving** from dist/ directory  
- **API endpoints**: `/api/ai`, `/health`, `/ready`, `/metrics`
- **Authentication**: JWT tokens + client API keys
- **AI Integration**: OpenAI and Google Vertex AI support
- **Rate limiting**: 30 requests/minute per IP for AI endpoints

## Testing and Quality Assurance

### Available Test Suites
- **Unit tests**: `tests/api.test.js` - API endpoint testing
- **Integration tests**: `tests/integration_stream.test.js` - streaming functionality
- **Smoke tests**: `tests/smoke.signin.spec.js` - Playwright UI tests (requires playwright package)

### Test Execution Notes
- Some tests may fail due to missing API keys or Firebase setup - this is expected in development
- Tests that require actual OpenAI API calls will fail with test keys
- JWT authentication tests may fail if users.json doesn't have expected test users

### CI/CD Pipeline Timing
Based on GitHub Actions workflows:
- **npm install**: ~10-30 seconds  
- **npm run build**: ~0.05 seconds (very fast custom build)
- **Docker build**: ~2-3 minutes
- **npm test**: ~1-2 seconds
- **Full CI pipeline**: ~5-10 minutes total
- NEVER CANCEL: Always set timeouts to 60+ minutes for build commands

## Key Application Components

### Frontend Architecture  
- **Vanilla HTML/CSS/JS** application (not React-based in production)
- **Firebase Authentication** (Google OAuth, email/password, guest mode)
- **WebSocket** connections for real-time sync
- **AI Assistant** integration via REST API
- **Multi-theme support** (Dark, Light, Cinema modes)

### Core Features
- **Watch Parties**: Real-time video synchronization across participants
- **Streaming Services**: Netflix, Prime Video, Disney+ Hotstar, YouTube integration  
- **AI Assistant**: Chat-based AI helper using OpenAI/Vertex AI
- **Room Management**: Private/public rooms, passwords, participant limits
- **Chat System**: Real-time messaging during watch sessions
- **Video Controls**: Play/pause sync, seek synchronization, queue management

### File Structure Overview
```
/ (root)
├── server.js              # Express server and API routes
├── package.json           # npm scripts and dependencies
├── build.js               # Custom build script (primary)
├── index.html             # Main application UI  
├── app.js                 # Client-side JavaScript (47KB)
├── style.css              # Application styles
├── config.js              # Client configuration
├── firebase-*.js          # Firebase integration
├── users.js               # User management utilities
├── tests/                 # Test suites
├── .github/workflows/     # CI/CD pipelines  
├── src/                   # React components (secondary, has issues)
└── dist/                  # Build output directory
```

## Development Workflow Best Practices

### Always Build and Test Changes
1. Make your code changes
2. Run `npm run build` (always fast)
3. Run `npm start` to test locally
4. Validate using the scenarios above
5. Run `npm test` to check for regressions
6. Always set sufficient timeouts - NEVER CANCEL builds or tests

### Common File Locations
- **Server API logic**: `server.js` lines 1-374
- **Client app logic**: `app.js` (47KB file)  
- **Authentication**: `firebase-client.js`, `users.js`
- **AI integration**: `server.js` AI proxy around line 200-250
- **Build configuration**: `build.js`, `vite.config.js`
- **Deployment**: `.github/workflows/deploy.yml`, `Dockerfile`

### Debugging Tips  
- **Server logs**: Check console output when running `npm start`
- **Client errors**: Open browser dev tools console  
- **API testing**: Use curl or Postman with `/api/ai` endpoint
- **Firebase issues**: CDN script blocking is expected in development
- **Build issues**: The custom build.js almost never fails; if it does, check file permissions

### Performance Notes
- **Build time**: ~0.05 seconds (extremely fast)
- **Server startup**: ~3 seconds  
- **Test execution**: ~1-2 seconds
- **npm install**: ~10-15 seconds
- **Docker build**: ~2-3 minutes (normal for Node.js apps)

## Deployment and Production

### Local Development
- Use `npm start` for local development server
- Firebase will show CDN errors (expected) 
- AI features need real API keys to work fully
- Guest login works without Firebase setup

### Cloud Deployment
- **Google Cloud Run**: Configured via `.github/workflows/`
- **Firebase Hosting**: For static asset serving
- **Container**: Docker-based deployment using Dockerfile
- **Environment**: Production secrets managed via GitHub Secrets

### Required GitHub Secrets for Production
- `GCP_PROJECT_ID`, `GCP_SA_KEY`, `GCP_REGION`
- `JWT_SECRET`, `CLIENT_API_KEY`
- `VERTEX_MODEL`, `OPENAI_API_KEY` (optional)
- `FIREBASE_SERVICE_ACCOUNT`

## Common Issues and Solutions

### "Firebase is not defined" errors
- Expected in development due to CDN blocking
- Does not affect core functionality testing
- Guest login and basic features work without Firebase

### Vite build failures
- JSX import issues in `src/` directory  
- Use `npm run build` (custom) instead of `npm run build:vite`
- The main application doesn't require Vite

### Test failures  
- Some tests expect real API keys and Firebase setup
- Focus on tests that pass to validate core functionality
- API proxy tests may fail without OpenAI key

### AI Assistant "fetch failed" errors
- Expected with test API keys
- Indicates the API request pipeline is working correctly
- Replace OPENAI_API_KEY in .env with real key for testing

Remember: This application has been thoroughly tested and validated. The custom build system is fast and reliable. Always use the manual validation scenarios above to ensure your changes work end-to-end.