import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SurveyLink, Survey } from '../../types/survey';
import { scoreResponse } from '../../lib/scoring-engine';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { PasswordForm } from './PasswordForm';
import { IdentificationForm } from './IdentificationForm';
import { ConsentForm } from './ConsentForm';
import { SurveyForm } from './SurveyForm';
import { SurveyComplete } from './SurveyComplete';

type SurveyStep = 'password' | 'identification' | 'consent' | 'survey' | 'complete';

export const EmbeddedSurveyHost: React.FC = () => {
  const { linkCode } = useParams<{ linkCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEmbedded = searchParams.get('embed') === 'true';
  
  const [surveyLink, setSurveyLink] = useState<(SurveyLink & { survey: Survey }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<SurveyStep>('password');
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [computedScores, setComputedScores] = useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');

  useEffect(() => {
    if (linkCode) {
      fetchSurveyLink();
    }
  }, [linkCode]);

  const fetchSurveyLink = async () => {
    if (!linkCode) return;

    try {
      // Check if this is a demo/preview link
      if (linkCode.startsWith('demo-')) {
        const surveyId = linkCode.replace('demo-', '');
        
        const { data: survey, error: surveyError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .single();

        if (surveyError) {
          if (surveyError.code === 'PGRST116') {
            setError('Survey not found.');
          } else {
            throw surveyError;
          }
          return;
        }

        const mockSurveyLink = {
          id: 'preview',
          survey_id: survey.id,
          researcher_id: 'preview',
          link_code: linkCode,
          max_responses: 999999,
          expires_at: null,
          allow_anonymous: true,
          require_consent: false,
          require_identification: false,
          password_protected: false,
          access_password: null,
          show_results_to_respondent: true, // Show results in preview mode
          active: true,
          created_at: new Date().toISOString(),
          survey: survey
        };

        setSurveyLink(mockSurveyLink);
        setCurrentStep('survey');
        return;
      }

      // Regular survey link logic
      const { data, error } = await supabase
        .from('survey_links')
        .select(`
          *,
          survey:surveys(*)
        `)
        .eq('link_code', linkCode)
        .eq('active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Survey link not found or has been deactivated.');
        } else {
          throw error;
        }
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This survey link has expired.');
        return;
      }

      // Check response count
      const { data: responseCount, error: responseCountError } = await supabase
        .from('response_counts')
        .select('total_responses')
        .eq('survey_link_id', data.id)
        .maybeSingle();

      if (responseCountError && responseCountError.code !== 'PGRST116') {
        throw responseCountError;
      }

      const totalResponses = responseCount?.total_responses || 0;

      if (totalResponses >= data.max_responses) {
        setError('This survey has reached its maximum number of responses.');
        return;
      }

      setSurveyLink(data);
      
      // Determine starting step based on survey settings
      if (data.password_protected) {
        setCurrentStep('password');
      } else if (data.require_identification) {
        setCurrentStep('identification');
      } else if (data.require_consent) {
        setCurrentStep('consent');
      } else {
        setCurrentStep('survey');
      }
    } catch (error) {
      console.error('Error fetching survey link:', error);
      setError('Failed to load survey. Please check the link and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!surveyLink) return;

    setLoading(true);
    setError('');

    try {
      if (surveyLink.access_password !== password) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }
      
      if (surveyLink.require_identification) {
        setCurrentStep('identification');
      } else if (surveyLink.require_consent) {
        setCurrentStep('consent');
      } else {
        setCurrentStep('survey');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('Failed to verify password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleIdentificationSubmit = (name: string, email: string) => {
    setRespondentName(name);
    setRespondentEmail(email);
    
    if (surveyLink?.require_consent) {
      setCurrentStep('consent');
    } else {
      setCurrentStep('survey');
    }
  };

  const handleConsentGiven = () => {
    setCurrentStep('survey');
  };

  const handleSurveySubmit = async (surveyResponses: Record<string, any>) => {
    if (!surveyLink) return;

    try {
      setLoading(true);
      
      const scores = scoreResponse(surveyLink.survey.schema, surveyResponses);
      setComputedScores(scores);
      setResponses(surveyResponses);

      if (surveyLink.link_code.startsWith('demo-')) {
        setCurrentStep('complete');
        return;
      }

      const responseData = {
        survey_link_id: surveyLink.id,
        respondent_identifier: surveyLink.allow_anonymous ? null : 'identified',
        respondent_name: surveyLink.require_identification ? respondentName : null,
        respondent_email: surveyLink.require_identification ? respondentEmail : null,
        raw_responses: surveyResponses,
        computed_scores: scores,
      };

      const { error } = await supabase
        .from('responses')
        .insert(responseData);

      if (error) throw error;

      setCurrentStep('complete');
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    if (isEmbedded) {
      // For embedded surveys, just reload or close
      window.location.href = '/';
    } else {
      // For direct access, navigate to home
      navigate('/');
    }
  };

  // Unified layout for both embedded and direct access
  const SurveyLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {children}
        
        {/* SurveyServe Branding - Always show */}
        <div className="mt-8 text-center">
          <a
            href="https://surveystack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Powered by SurveyServe</span>
          </a>
        </div>
      </div>
    </div>
  );

  if (loading && !surveyLink) {
    return (
      <SurveyLayout>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </SurveyLayout>
    );
  }

  if (error) {
    return (
      <SurveyLayout>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {!isEmbedded && (
            <button
              onClick={handleReturnHome}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              Return Home
            </button>
          )}
        </div>
      </SurveyLayout>
    );
  }

  if (!surveyLink) {
    return null;
  }

  return (
    <SurveyLayout>
      {currentStep === 'password' && (
        <PasswordForm
          onPasswordSubmit={handlePasswordSubmit}
          loading={loading}
          error={error}
        />
      )}
      
      {currentStep === 'identification' && (
        <IdentificationForm
          onSubmit={handleIdentificationSubmit}
          loading={loading}
          error={error}
        />
      )}
      
      {currentStep === 'consent' && (
        <ConsentForm
          survey={surveyLink.survey}
          onConsent={handleConsentGiven}
        />
      )}
      
      {currentStep === 'survey' && (
        <SurveyForm
          survey={surveyLink.survey}
          onSubmit={handleSurveySubmit}
          loading={loading}
        />
      )}
      
      {currentStep === 'complete' && (
        <SurveyComplete
          survey={surveyLink.survey}
          responses={responses}
          computedScores={computedScores}
          showResults={surveyLink.show_results_to_respondent}
          onReturnHome={handleReturnHome}
        />
      )}
    </SurveyLayout>
  );
};