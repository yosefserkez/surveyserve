# Netlify Client-Side Routing Troubleshooting Guide

## Problem Overview

When deploying a Single Page Application (SPA) to Netlify, direct navigation to client-side routes (like `/dashboard`, `/surveys`, etc.) results in 404 errors. This happens because Netlify tries to find physical files at these paths, but SPAs handle routing on the client side.

## 🔍 Step 1: Verify Your React Router Configuration

### Check App.tsx Router Setup
Ensure your React Router is properly configured:

```tsx
// ✅ Correct setup in App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/surveys" element={<SurveyLibrary />} />
        <Route path="/survey/:linkCode" element={<SurveyHost />} />
        {/* Add catch-all route for 404s */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
```

### Verify Route Components
Check that all route components are properly imported and exported:

```tsx
// ✅ Ensure proper exports
export const Dashboard = () => { /* component */ };
export const SurveyLibrary = () => { /* component */ };
```

## 🔧 Step 2: Implement Netlify Redirects

The primary solution is to create a `netlify.toml` file in your project root with proper redirect rules.

### Primary Redirect Rule
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This tells Netlify to serve `index.html` for any route that doesn't match a static file, allowing React Router to handle the routing.

## 🚀 Step 3: Deploy and Test

### Build and Deploy
```bash
# Ensure netlify.toml is in project root
npm run build
# Deploy via Netlify CLI or Git integration
```

### Test These URLs Directly
After deployment, test these URLs directly in the browser:
- `https://your-site.netlify.app/dashboard` ✅
- `https://your-site.netlify.app/surveys` ✅  
- `https://your-site.netlify.app/survey/demo-123` ✅

## 🔍 Common Issues and Solutions

### Issue 1: 404 Still Occurring
**Symptoms:** Direct URLs still return 404
**Solution:** 
- Verify `netlify.toml` is in the project root (not in `src/` or `public/`)
- Check that the `publish` directory in `netlify.toml` matches your build output (`dist` for Vite)
- Redeploy after adding the configuration

### Issue 2: API Routes Breaking
**Symptoms:** API calls return 404 after adding redirects
**Solution:** Add specific API redirects before the catch-all:

```toml
# Add BEFORE the /* redirect
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Issue 3: Static Assets Not Loading
**Symptoms:** CSS, JS, or images return 404
**Solution:** Ensure static assets are in the correct build directory and use relative paths:

```tsx
// ✅ Use relative paths for assets
<img src="/assets/logo.png" alt="Logo" />
// Not: <img src="assets/logo.png" alt="Logo" />
```

### Issue 4: Nested Routes Failing
**Symptoms:** Routes like `/manage/:id` don't work
**Solution:** Ensure nested routes are properly configured:

```tsx
// ✅ Proper nested route setup
<Routes>
  <Route path="/manage/:linkId" element={<SurveyManagementDetail />} />
  <Route path="/survey/:linkCode" element={<SurveyHost />} />
</Routes>
```

## 🔧 Alternative Solutions

### Option 1: _redirects File (Alternative to netlify.toml)
Create `public/_redirects` with:
```
/*    /index.html   200
```

### Option 2: HashRouter (Not Recommended)
Switch to HashRouter if redirects don't work:
```tsx
import { HashRouter as Router } from 'react-router-dom';
// URLs will be like: yoursite.com/#/dashboard
```

## 🧪 Testing Checklist

- [ ] Direct URL navigation works for all routes
- [ ] Browser back/forward buttons work correctly
- [ ] Page refresh doesn't break routing
- [ ] 404 page shows for invalid routes
- [ ] API calls still function correctly
- [ ] Static assets load properly

## 🔍 Debugging Commands

### Check Netlify Build Logs
```bash
netlify logs:build
```

### Test Locally with Netlify Dev
```bash
npm install -g netlify-cli
netlify dev
```

### Verify Build Output
```bash
# Check that index.html exists in build directory
ls dist/  # or ls build/ for Create React App
```

## 📋 Complete netlify.toml Template

```toml
[build]
  publish = "dist"
  command = "npm run build"

# Environment variables (if needed)
[build.environment]
  NODE_VERSION = "18"

# Client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"

# Cache optimization
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## 🆘 Need More Help?

If routing issues persist:

1. **Check Netlify Deploy Preview**: Look at the deploy preview URL to see if the issue exists there
2. **Review Build Logs**: Check for any build errors that might affect routing
3. **Test with Netlify Dev**: Use `netlify dev` to simulate the production environment locally
4. **Contact Netlify Support**: If all else fails, Netlify support can help diagnose deployment-specific issues

The most common solution is simply adding the `netlify.toml` file with the catch-all redirect rule. This should resolve 95% of client-side routing issues on Netlify.