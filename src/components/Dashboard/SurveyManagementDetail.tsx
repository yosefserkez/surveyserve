import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SurveyLink, Survey } from '../../types/survey';
import { 
  ArrowLeft,
  FileText,
  Users,
  BarChart3,
  Shield,
  AlertCircle,
  Code
} from 'lucide-react';
import { SurveyLinkDetails } from './SurveyLinkDetails';
import { SubmissionAnalysis } from './SubmissionAnalysis';
import { ScoringMonitor } from './ScoringMonitor';
import { AdminControls } from './AdminControls';
import { EmbedCodeGenerator } from './EmbedCodeGenerator';

interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
  response_count: number;
  last_response: string | null;
}

export const SurveyManagementDetail: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const { researcher } = useAuth();
  const [surveyLink, setSurveyLink] = useState<ExtendedSurveyLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'submissions' | 'scoring' | 'embed' | 'admin'>('details');

  useEffect(() => {
    if (linkId && researcher) {
      fetchSurveyLink();
    }
  }, [linkId, researcher]);

  const fetchSurveyLink = async () => {
    if (!linkId || !researcher) return;

    try {
      const { data, error } = await supabase
        .from('survey_links')
        .select(`
          *,
          survey:surveys(*),
          response_counts(total_responses)
        `)
        .eq('id', linkId)
        .eq('researcher_id', researcher.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Survey link not found or you do not have permission to access it.');
        } else {
          throw error;
        }
        return;
      }

      // Get last response date
      const { data: lastResponse } = await supabase
        .from('responses')
        .select('completed_at')
        .eq('survey_link_id', data.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const extendedLink: ExtendedSurveyLink = {
        ...data,
        response_count: Array.isArray(data.response_counts) && data.response_counts.length > 0 
          ? data.response_counts[0]?.total_responses || 0 
          : 0,
        last_response: lastResponse?.completed_at || null
      };

      setSurveyLink(extendedLink);
    } catch (error) {
      console.error('Error fetching survey link:', error);
      setError('Failed to load survey link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    fetchSurveyLink();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !surveyLink) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          {/* Back button and title */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors self-start"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{surveyLink.survey.title}</h1>
                <p className="text-sm text-gray-600">
                  Link Code: <span className="font-mono text-xs sm:text-sm break-all">{surveyLink.link_code}</span>
                </p>
              </div>
              
              {/* Stats - responsive layout */}
              <div className="flex items-center justify-between sm:justify-start sm:space-x-6 text-sm text-gray-600">
                <div className="text-center">
                  <p className="font-medium text-gray-900 text-lg sm:text-xl">{surveyLink.response_count}</p>
                  <p className="text-xs sm:text-sm">Responses</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900 text-lg sm:text-xl">
                    {Math.round((surveyLink.response_count / surveyLink.max_responses) * 100)}%
                  </p>
                  <p className="text-xs sm:text-sm">Complete</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  surveyLink.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {surveyLink.active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {[
              { id: 'details', label: 'Survey Details', icon: FileText, shortLabel: 'Details' },
              { id: 'submissions', label: 'Submissions', icon: Users, shortLabel: 'Submissions' },
              { id: 'scoring', label: 'Scoring', icon: BarChart3, shortLabel: 'Scoring' },
              { id: 'embed', label: 'Embed Code', icon: Code, shortLabel: 'Embed' },
              { id: 'admin', label: 'Admin', icon: Shield, shortLabel: 'Admin' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && <SurveyLinkDetails surveyLink={surveyLink} />}
      {activeTab === 'submissions' && <SubmissionAnalysis surveyLink={surveyLink} />}
      {activeTab === 'scoring' && <ScoringMonitor surveyLink={surveyLink} />}
      {activeTab === 'embed' && <EmbedCodeGenerator surveyLink={surveyLink} />}
      {activeTab === 'admin' && (
        <AdminControls 
          surveyLink={surveyLink} 
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};