import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Better debugging for production
console.log('Supabase Environment Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'missing',
  environment: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseAnonKey) {
  const error = `Missing Supabase environment variables:
    - VITE_SUPABASE_URL: ${supabaseUrl ? 'present' : 'MISSING'}
    - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'present' : 'MISSING'}
    
    Please check your Netlify environment variables.`;
  console.error(error);
  throw new Error(error);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      researchers: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
      surveys: {
        Row: {
          id: string;
          title: string;
          description: string;
          version: string;
          source: string;
          schema: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          version?: string;
          source: string;
          schema: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          version?: string;
          source?: string;
          schema?: any;
          created_at?: string;
        };
      };
      survey_links: {
        Row: {
          id: string;
          survey_id: string;
          researcher_id: string;
          link_code: string;
          max_responses: number;
          expires_at: string | null;
          allow_anonymous: boolean;
          require_consent: boolean;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          researcher_id: string;
          link_code?: string;
          max_responses?: number;
          expires_at?: string | null;
          allow_anonymous?: boolean;
          require_consent?: boolean;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          researcher_id?: string;
          link_code?: string;
          max_responses?: number;
          expires_at?: string | null;
          allow_anonymous?: boolean;
          require_consent?: boolean;
          active?: boolean;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          survey_link_id: string;
          respondent_identifier: string | null;
          raw_responses: any;
          computed_scores: any;
          completed_at: string;
        };
        Insert: {
          id?: string;
          survey_link_id: string;
          respondent_identifier?: string | null;
          raw_responses: any;
          computed_scores: any;
          completed_at?: string;
        };
        Update: {
          id?: string;
          survey_link_id?: string;
          respondent_identifier?: string | null;
          raw_responses?: any;
          computed_scores?: any;
          completed_at?: string;
        };
      };
      response_counts: {
        Row: {
          survey_link_id: string;
          total_responses: number;
          last_updated: string;
        };
        Insert: {
          survey_link_id: string;
          total_responses?: number;
          last_updated?: string;
        };
        Update: {
          survey_link_id?: string;
          total_responses?: number;
          last_updated?: string;
        };
      };
    };
  };
};