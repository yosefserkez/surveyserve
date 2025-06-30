import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export const DiagnosticInfo: React.FC = () => {
  const { user, researcher, loading } = useAuth();
  const [supabaseTest, setSupabaseTest] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('surveys').select('count').limit(1);
      if (error) throw error;
      setSupabaseTest('success');
    } catch (error: any) {
      setSupabaseTest('error');
      setErrorDetails(error.message || 'Unknown error');
    }
  };

  const hasEnvVars = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md border border-gray-200 rounded-lg p-4 shadow-lg max-w-sm text-xs">
      <div className="flex items-center space-x-2 mb-2">
        <Info className="h-4 w-4 text-blue-500" />
        <span className="font-semibold">System Status</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span>Environment Variables:</span>
          {hasEnvVars ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span>Supabase Connection:</span>
          {supabaseTest === 'testing' ? (
            <div className="animate-spin h-4 w-4 border border-gray-300 border-t-blue-500 rounded-full" />
          ) : supabaseTest === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span>Auth Loading:</span>
          {loading ? (
            <div className="animate-spin h-4 w-4 border border-gray-300 border-t-blue-500 rounded-full" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span>User Status:</span>
          {user ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span>Researcher Status:</span>
          {researcher ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {supabaseTest === 'error' && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
          <div className="flex items-start space-x-1">
            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="text-xs">{errorDetails}</span>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        <div>Mode: {import.meta.env.MODE}</div>
        <div>URL: {window.location.pathname}</div>
      </div>
    </div>
  );
}; 