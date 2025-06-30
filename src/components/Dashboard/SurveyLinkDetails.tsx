import React, { useState } from 'react';
import { SurveyLink, Survey } from '../../types/survey';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Calendar, 
  Users, 
  Shield, 
  ExternalLink, 
  Copy, 
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react';

interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
  response_count: number;
  last_response: string | null;
}

interface SurveyLinkDetailsProps {
  surveyLink: ExtendedSurveyLink;
}

export const SurveyLinkDetails: React.FC<SurveyLinkDetailsProps> = ({ surveyLink }) => {
  const [editingExpiration, setEditingExpiration] = useState(false);
  const [newExpiration, setNewExpiration] = useState(
    surveyLink.expires_at ? new Date(surveyLink.expires_at).toISOString().slice(0, 16) : ''
  );
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleExpirationSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('survey_links')
        .update({ expires_at: newExpiration || null })
        .eq('id', surveyLink.id);

      if (error) throw error;
      setEditingExpiration(false);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating expiration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Survey Information */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Survey Information
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <p className="text-gray-900">{surveyLink.survey.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-600">{surveyLink.survey.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <p className="text-gray-600">{surveyLink.survey.source}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <p className="text-gray-900">{surveyLink.survey.version}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
              <p className="text-gray-900">{surveyLink.survey.schema.questions.length}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scoring Rules</label>
              <p className="text-gray-900">{Object.keys(surveyLink.survey.schema.scoring_rules).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Link Configuration */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Link Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Survey URL</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={surveyUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center space-x-1"
              >
                <Copy className="h-4 w-4" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={surveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center space-x-1"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Preview</span>
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Code</label>
              <p className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded border">
                {surveyLink.link_code}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Responses</label>
              <p className="text-gray-900">{surveyLink.max_responses}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-gray-900">{new Date(surveyLink.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
              {!editingExpiration && (
                <button
                  onClick={() => setEditingExpiration(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center space-x-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
            
            {editingExpiration ? (
              <div className="flex items-center space-x-2">
                <input
                  type="datetime-local"
                  value={newExpiration}
                  onChange={(e) => setNewExpiration(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleExpirationSave}
                  disabled={loading}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingExpiration(false)}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-gray-900">
                {surveyLink.expires_at 
                  ? new Date(surveyLink.expires_at).toLocaleString()
                  : 'Never expires'
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Privacy & Security Settings */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Privacy & Security Settings
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Anonymous Responses</p>
                <p className="text-sm text-gray-600">Allow responses without identification</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                surveyLink.allow_anonymous 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {surveyLink.allow_anonymous ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Consent Required</p>
                <p className="text-sm text-gray-600">Show consent form before survey</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                surveyLink.require_consent 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {surveyLink.require_consent ? 'Required' : 'Optional'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Identification Required</p>
                <p className="text-sm text-gray-600">Collect name and email address</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                surveyLink.require_identification 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {surveyLink.require_identification ? 'Required' : 'Optional'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Password Protection</p>
                <p className="text-sm text-gray-600">Require password to access survey</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                surveyLink.password_protected 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {surveyLink.password_protected ? 'Protected' : 'Open'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Show Results to Participants</p>
                <p className="text-sm text-gray-600">Display computed scores after completion</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                surveyLink.show_results_to_respondent 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {surveyLink.show_results_to_respondent ? 'Visible' : 'Hidden'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Link Status</p>
                <p className="text-sm text-gray-600">Survey accessibility</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
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

      {/* Question Structure */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Question Structure
        </h3>
        
        <div className="space-y-4">
          {surveyLink.survey.schema.questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                      Q{index + 1}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {question.type}
                    </span>
                    {question.reverse_score && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                        Reverse Scored
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 mb-3">{question.text}</p>
                  
                  {question.options && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">Response Options:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm text-gray-700">{option.label}</span>
                            <span className="text-sm font-medium text-gray-900">{option.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};