# WildShield AI - Production Deployment Guide

This guide outlines instructions to build, configure, and deploy the WildShield AI Digital Twin frontend application to production environments.

---

## 🛠️ Step 1: Generate the Production Build

Before deploying, run the bundler to compile and optimize assets.

```bash
# 1. Install dependencies (if not already completed)
npm install

# 2. Build the optimized static assets
npm run build
```

This compiles files into the `./dist` directory:
* `dist/index.html`: Entry points.
* `dist/assets/*.css`: Bundled and minified Tailwind/CSS styles.
* `dist/assets/*.js`: Optimized, code-split React components and libraries.

---

## 🚀 Step 2: Deployment Platforms

Since this is a client-side Single Page Application (SPA), it can be hosted on any static hosting provider. Below are step-by-step methods for popular platforms:

### Option A: Vercel (Recommended)
Vercel offers serverless global CDN hosting with automatic routing config.

#### Method 1: Vercel CLI (Instant)
```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Deploy from the project root directory
vercel
```
*Follow the interactive prompts to link your workspace and deploy. Select `./dist` as the build output directory.*

#### Method 2: Git Integration
1. Push your workspace files to a repository on **GitHub**, **GitLab**, or **Bitbucket**.
2. Log into the [Vercel Dashboard](https://vercel.com).
3. Click **New Project** and import your Git repository.
4. Vercel automatically detects Vite. Ensure settings match:
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Click **Deploy**.

---

### Option B: Netlify
Netlify provides instant drag-and-drop deployment or build pipelines.

#### Method 1: Netlify CLI
```bash
# 1. Install Netlify CLI globally
npm install -g netlify-cli

# 2. Deploy to production
netlify deploy --prod --dir=dist
```

#### Method 2: Netlify Dashboard
1. Connect your repository to Netlify.
2. In build settings, configure:
   * **Build command**: `npm run build`
   * **Publish directory**: `dist`
3. Click **Deploy Site**.

---

### Option C: Docker (Nginx Container)
For self-hosted instances (e.g., AWS EC2, DigitalOcean, or private servers), run the app using an Nginx container.

1. Create a `Dockerfile` in the project root:
```dockerfile
# Stage 1: Build the React Application
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:1.25-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Custom routing rule for SPA
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Build and run the Docker image:
```bash
# Build the docker container
docker build -t wildshield-digital-twin .

# Run container on port 8080
docker run -d -p 8080:80 wildshield-digital-twin
```

---

## 🐍 Step 3: Backend FastAPI Deployment Options

### Option A: Vercel Serverless Backend (Instant & Integrated)
Deploy both the React frontend and FastAPI backend together on Vercel in a single command.

1. Ensure [`vercel.json`](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/vercel.json) routes `/api/(.*)` to [`api/index.py`](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/api/index.py):
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/index.py" },
       { "source": "/static-test-images/(.*)", "destination": "/api/index.py" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. Set Environment Variables in Vercel Dashboard:
   - `DATABASE_URL`: `postgresql://neondb_owner:...@ep-floral-resonance...neon.tech/neondb?sslmode=require`
3. Deploy:
   ```bash
   vercel --prod
   ```

---

### Option B: Render Web Service (For Persistent WebSockets `/ws`)
If you require persistent, bi-directional WebSocket streaming (`wss://.../ws`) without serverless timeouts:

1. Push your code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) -> **New Web Service**.
3. Connect your repository and configure:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.server:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variable:
   - `DATABASE_URL`: `postgresql://neondb_owner:...@ep-floral-resonance...neon.tech/neondb?sslmode=require`
5. Click **Create Web Service**.
6. Copy your Render backend URL (e.g., `https://wildshield-backend.onrender.com`).
7. Update your Vercel Frontend environment variables:
   ```env
   VITE_API_BASE_URL=https://wildshield-backend.onrender.com
   VITE_WS_URL=wss://wildshield-backend.onrender.com/ws
   ```

---

## ⚙️ Diagnostics & Verification

To verify the production build locally before uploading:
```bash
# Preview build assets on local web server
npm run preview
```

