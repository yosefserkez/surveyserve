import React, { useState, useEffect } from 'react';
import { SurveyLink, Survey } from '../../types/survey';
import { supabase } from '../../lib/supabase';
import { 
  ExternalLink, 
  Users, 
  Calendar, 
  Copy, 
  Download, 
  BarChart3,
  Globe,
  Shield,
  Eye
} from 'lucide-react';

interface SurveyLinkCardProps {
  surveyLink: SurveyLink & { survey: Survey };
  onUpdate: () => void;
}

export const SurveyLinkCard: React.FC<SurveyLinkCardProps> = ({ surveyLink, onUpdate }) => {
  const [responseCount, setResponseCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchResponseCount();
  }, [surveyLink.id]);

  const fetchResponseCount = async () => {
    try {
      const { data, error } = await supabase
        .from('response_counts')
        .select('total_responses')
        .eq('survey_link_id', surveyLink.id)
        .maybeSingle();

      if (error) throw error;
      setResponseCount(data?.total_responses || 0);
    } catch (error) {
      console.error('Error fetching response count:', error);
    }
  };

  const surveyUrl = `${window.location.origin}/survey/${surveyLink.link_code}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadData = async () => {
    try {
      const { data: responses, error } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_link_id', surveyLink.id);

      if (error) throw error;

      const csvData = responses?.map(response => ({
        response_id: response.id,
        completed_at: response.completed_at,
        respondent_identifier: response.respondent_identifier || 'Anonymous',
        ...response.raw_responses,
        ...response.computed_scores
      })) || [];

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => 
          typeof val === 'string' ? `"${val}"` : val
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey-responses-${surveyLink.link_code}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  const isExpired = surveyLink.expires_at && new Date(surveyLink.expires_at) < new Date();
  const isAtCapacity = responseCount >= surveyLink.max_responses;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 pr-3">
                {surveyLink.survey.title}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                !surveyLink.active ? 'bg-gray-100 text-gray-600' :
                isExpired || isAtCapacity ? 'bg-red-100 text-red-600' :
                'bg-green-100 text-green-600'
              }`}>
                {!surveyLink.active ? 'Inactive' :
                 isExpired ? 'Expired' :
                 isAtCapacity ? 'Full' : 'Active'}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              {surveyLink.survey.description}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-1 sm:gap-0 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(surveyLink.created_at).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{responseCount} / {surveyLink.max_responses} responses</span>
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Response Progress</span>
            <span>{Math.round((responseCount / surveyLink.max_responses) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((responseCount / surveyLink.max_responses) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Survey URL */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Survey Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={surveyUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center space-x-1"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <a
            href={surveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Preview</span>
          </a>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>{showDetails ? 'Hide' : 'View'} Details</span>
          </button>

          {responseCount > 0 && (
            <button
              onClick={downloadData}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
          )}
        </div>

        {/* Details Section */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Survey Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="text-gray-900">{surveyLink.survey.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="text-gray-900">{surveyLink.survey.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="text-gray-900">{surveyLink.survey.schema.questions.length}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy Settings
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Anonymous:</span>
                    <span className={surveyLink.allow_anonymous ? 'text-green-600' : 'text-red-600'}>
                      {surveyLink.allow_anonymous ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consent Required:</span>
                    <span className={surveyLink.require_consent ? 'text-green-600' : 'text-red-600'}>
                      {surveyLink.require_consent ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="text-gray-900">
                      {surveyLink.expires_at 
                        ? new Date(surveyLink.expires_at).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};