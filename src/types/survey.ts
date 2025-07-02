export interface Question {
  id: string;
  text: string;
  type: 'likert' | 'numeric' | 'choice' | 'text';
  options?: Array<{
    value: number | string;
    label: string;
  }>;
  reverse_score?: boolean;
  dimension?: string;
  timeframe?: string;
  subscale?: string;
}

export interface ScoringRule {
  type: 'sum' | 'average' | 'mean' | 'computed' | 'threshold' | 'flag';
  questions?: string[];
  input?: string;
  thresholds?: Array<{
    min: number;
    max: number;
    label: string;
  }>;
  condition?: string;
  message?: string;
  description?: string;
  formula?: string;
}

export interface SurveySchema {
  questions: Question[];
  scoring_rules: Record<string, ScoringRule>;
  metadata?: {
    category?: string;
    license?: string;
    validated?: boolean;
    population?: string;
    administration_time?: string;
    norms?: Norms;
    psychometric_properties?: PsychometricProperties;
  };
}

export interface PsychometricProperties {
  reliability?: {
    cronbach_alpha?: number;
    test_retest?: number;
  };
  validity?: string;
}

export interface Norms {
  [key: string]: {
    mean?: number;
    sd?: number;
    sample_size?: number;
    reference?: string;
  };
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  version: string;
  source: string;
  schema: SurveySchema;
  created_at: string;
  // Privacy and ownership fields
  is_official: boolean;
  is_public: boolean;
  created_by: string | null;
  // Extended fields from research instruments
  category?: string;
  license?: string;
  validated?: boolean;
  population?: string;
  administration_time?: string;
  norms?: Norms;
  psychometric_properties?: PsychometricProperties;
}

export interface SurveyVisibilityInfo {
  can_edit: boolean;
  can_delete: boolean;
  visibility_status: 'official' | 'public' | 'private';
}

export interface SurveyLink {
  id: string;
  survey_id: string;
  researcher_id: string;
  link_code: string;
  max_responses: number;
  expires_at: string | null;
  allow_anonymous: boolean;
  require_consent: boolean;
  require_identification: boolean;
  password_protected: boolean;
  access_password: string | null;
  show_results_to_respondent: boolean;
  active: boolean;
  created_at: string;
}

export interface Response {
  id: string;
  survey_link_id: string;
  respondent_identifier: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  raw_responses: Record<string, any>;
  computed_scores: Record<string, any>;
  completed_at: string;
}

export interface Researcher {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// Extended interface for survey management
export interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
  response_count: number;
  last_response: string | null;
}