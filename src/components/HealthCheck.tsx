import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const HealthCheck: React.FC = () => {
  const envVars = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
  };

  const buildInfo = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h1 className="text-2xl font-bold">Health Check</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Environment Variables
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>VITE_SUPABASE_URL:</span>
                  <span className={envVars.supabaseUrl ? 'text-green-600' : 'text-red-600'}>
                    {envVars.supabaseUrl ? '✓ Present' : '✗ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VITE_SUPABASE_ANON_KEY:</span>
                  <span className={envVars.supabaseAnonKey ? 'text-green-600' : 'text-red-600'}>
                    {envVars.supabaseAnonKey ? '✓ Present' : '✗ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="text-blue-600">{envVars.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Development:</span>
                  <span className={envVars.dev ? 'text-green-600' : 'text-gray-600'}>
                    {envVars.dev ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Production:</span>
                  <span className={envVars.prod ? 'text-green-600' : 'text-gray-600'}>
                    {envVars.prod ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Build Information
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="text-gray-600">{buildInfo.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hostname:</span>
                  <span className="text-gray-600">{buildInfo.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className="text-gray-600">{buildInfo.protocol}</span>
                </div>
                <div>
                  <span>User Agent:</span>
                  <div className="text-xs text-gray-500 mt-1 break-all">
                    {buildInfo.userAgent}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {envVars.supabaseUrl && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Supabase URL Info</h3>
              <div className="text-sm text-gray-600">
                <div>Protocol: {new URL(envVars.supabaseUrl).protocol}</div>
                <div>Host: {new URL(envVars.supabaseUrl).hostname}</div>
                <div>Project: {new URL(envVars.supabaseUrl).hostname.split('.')[0]}</div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Next Steps
            </h3>
            <ul className="text-sm space-y-1">
              <li>• If environment variables are missing, check Netlify environment settings</li>
              <li>• If Supabase connection fails, verify the URL and key are correct</li>
              <li>• Check browser console for detailed error messages</li>
              <li>• Try visiting /surveys and /dashboard to test routing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 