# Custom Domain Setup Guide

This guide helps resolve Supabase connection issues when using custom domains instead of Netlify/Vercel default domains.

## Problem
When using a custom domain, the app cannot connect to Supabase, but it works fine with Netlify/Vercel default domains.

## Root Cause
The issue is typically caused by:
1. **Supabase Project Settings**: Custom domains not added to allowed origins
2. **CORS Configuration**: Missing or incorrect CORS headers
3. **Environment Variables**: Not properly configured for the custom domain

## Solutions

### 1. Update Supabase Project Settings

**This is the most important step:**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. In the **API Settings** section, find **Additional Allowed Origins**
5. Add your custom domain(s):
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
6. Click **Save**

### 2. Update CORS Configuration

The CORS configuration has been updated in `supabase/functions/_shared/cors.ts`. You need to:

1. Add your custom domain to the `allowedOrigins` array:
   ```typescript
   const allowedOrigins = [
     'http://localhost:5173',
     'http://localhost:3000',
     'https://surveyserve.netlify.app',
     'https://surveyserve.vercel.app',
     'https://yourdomain.com',  // Add your custom domain here
   ];
   ```

2. Deploy the updated Edge Functions:
   ```bash
   supabase functions deploy
   ```

### 3. Environment Variables

Ensure your environment variables are properly set in your hosting platform:

**For Netlify:**
1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Verify these variables are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**For Vercel:**
1. Go to your Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify these variables are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 4. DNS Configuration

Ensure your custom domain is properly configured:

1. **A Record**: Point to your hosting provider's IP
2. **CNAME Record**: Point to your hosting provider's domain
3. **SSL Certificate**: Ensure HTTPS is enabled

### 5. Testing

After making these changes:

1. **Clear browser cache** and cookies
2. **Test the connection** by visiting your app
3. **Check browser console** for any CORS errors
4. **Use the Health Check page** at `/health` to verify environment variables

### 6. Debugging

If issues persist:

1. **Check browser console** for specific error messages
2. **Verify Supabase URL** in the browser console logs
3. **Test with curl** to verify CORS:
   ```bash
   curl -H "Origin: https://yourdomain.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://your-project.supabase.co/rest/v1/
   ```

### 7. Common Issues

**Issue**: "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Solution**: Add domain to Supabase allowed origins

**Issue**: "Failed to fetch" errors
- **Solution**: Check environment variables and network connectivity

**Issue**: Authentication errors
- **Solution**: Verify Supabase URL and anon key are correct

## Verification Steps

1. ✅ Custom domain added to Supabase allowed origins
2. ✅ CORS configuration updated
3. ✅ Environment variables set correctly
4. ✅ DNS properly configured
5. ✅ SSL certificate active
6. ✅ Browser cache cleared
7. ✅ Health check page shows all green

## Support

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Verify all steps above have been completed
3. Test with a simple curl request to isolate the issue
4. Contact support with specific error messages and domain information 