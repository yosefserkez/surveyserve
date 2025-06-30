import React, { useState } from 'react';
import { SurveyLink, Survey } from '../../types/survey';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Settings, 
  Bell, 
  Archive, 
  Trash2, 
  Calendar,
  Users,
  Lock,
  Unlock,
  Download,
  AlertTriangle,
  Save,
  RefreshCw,
  User,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
  response_count: number;
  last_response: string | null;
}

interface AdminControlsProps {
  surveyLink: ExtendedSurveyLink;
  onUpdate: () => void;
}

export const AdminControls: React.FC<AdminControlsProps> = ({ surveyLink, onUpdate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [settings, setSettings] = useState({
    maxResponses: surveyLink.max_responses,
    expiresAt: surveyLink.expires_at ? new Date(surveyLink.expires_at).toISOString().slice(0, 16) : '',
    allowAnonymous: surveyLink.allow_anonymous,
    requireConsent: surveyLink.require_consent,
    requireIdentification: surveyLink.require_identification,
    passwordProtected: surveyLink.password_protected,
    accessPassword: surveyLink.access_password || '',
    showResultsToRespondent: surveyLink.show_results_to_respondent,
    active: surveyLink.active
  });

  const updateSurveyLink = async (updates: Partial<typeof settings>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('survey_links')
        .update({
          max_responses: updates.maxResponses,
          expires_at: updates.expiresAt || null,
          allow_anonymous: updates.allowAnonymous,
          require_consent: updates.requireConsent,
          require_identification: updates.requireIdentification,
          password_protected: updates.passwordProtected,
          access_password: updates.passwordProtected ? updates.accessPassword : null,
          show_results_to_respondent: updates.showResultsToRespondent,
          active: updates.active
        })
        .eq('id', surveyLink.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating survey link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    // Validation
    if (settings.passwordProtected && !settings.accessPassword.trim()) {
      alert('Please enter a password for password-protected surveys.');
      return;
    }

    if (!settings.allowAnonymous && !settings.requireIdentification) {
      alert('Identification must be required when anonymous responses are disabled.');
      return;
    }

    updateSurveyLink(settings);
  };

  const handleToggleStatus = () => {
    const newStatus = !settings.active;
    setSettings(prev => ({ ...prev, active: newStatus }));
    updateSurveyLink({ ...settings, active: newStatus });
  };

  const handleCloseToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const newExpiration = today.toISOString().slice(0, 16);
    setSettings(prev => ({ ...prev, expiresAt: newExpiration }));
    updateSurveyLink({ ...settings, expiresAt: newExpiration });
  };

  const handleDeleteSurveyLink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('survey_links')
        .delete()
        .eq('id', surveyLink.id);

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting survey link:', error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const exportAllData = async () => {
    try {
      const { data: responses, error } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_link_id', surveyLink.id);

      if (error) throw error;

      const exportData = {
        survey_info: {
          title: surveyLink.survey.title,
          description: surveyLink.survey.description,
          version: surveyLink.survey.version,
          source: surveyLink.survey.source
        },
        link_info: {
          link_code: surveyLink.link_code,
          created_at: surveyLink.created_at,
          expires_at: surveyLink.expires_at,
          max_responses: surveyLink.max_responses,
          allow_anonymous: surveyLink.allow_anonymous,
          require_consent: surveyLink.require_consent,
          require_identification: surveyLink.require_identification,
          password_protected: surveyLink.password_protected,
          show_results_to_respondent: surveyLink.show_results_to_respondent
        },
        responses: responses || [],
        schema: surveyLink.survey.schema
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey-complete-export-${surveyLink.link_code}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Auto-enable identification when anonymous is disabled
  React.useEffect(() => {
    if (!settings.allowAnonymous && !settings.requireIdentification) {
      setSettings(prev => ({ ...prev, requireIdentification: true }));
    }
  }, [settings.allowAnonymous]);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleToggleStatus}
            disabled={loading}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              settings.active
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
          >
            {settings.active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            <span>{settings.active ? 'Deactivate' : 'Activate'}</span>
          </button>
          
          <button
            onClick={handleCloseToday}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Calendar className="h-4 w-4" />
            <span>Close Today</span>
          </button>
          
          <button
            onClick={exportAllData}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export All</span>
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Survey Link Settings */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Survey Link Settings
        </h3>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Responses
              </label>
              <input
                type="number"
                value={settings.maxResponses}
                onChange={(e) => setSettings(prev => ({ ...prev, maxResponses: parseInt(e.target.value) || 100 }))}
                min="1"
                max="10000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date
              </label>
              <input
                type="datetime-local"
                value={settings.expiresAt}
                onChange={(e) => setSettings(prev => ({ ...prev, expiresAt: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Survey Active</p>
                <p className="text-sm text-gray-600">Allow new responses to be submitted</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.active}
                  onChange={(e) => setSettings(prev => ({ ...prev, active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Allow Anonymous Responses</p>
                <p className="text-sm text-gray-600">Respondents don't need to provide identification</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowAnonymous}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowAnonymous: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Require Consent</p>
                <p className="text-sm text-gray-600">Show consent form before survey begins</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireConsent}
                  onChange={(e) => setSettings(prev => ({ ...prev, requireConsent: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Require Name & Email
                </p>
                <p className="text-sm text-gray-600">
                  {!settings.allowAnonymous 
                    ? 'Required when anonymous responses are disabled'
                    : 'Collect respondent name and email address'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireIdentification}
                  onChange={(e) => setSettings(prev => ({ ...prev, requireIdentification: e.target.checked }))}
                  disabled={!settings.allowAnonymous}
                  className="sr-only peer disabled:opacity-50"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 flex items-center">
                  <Key className="h-4 w-4 mr-1" />
                  Password Protection
                </p>
                <p className="text-sm text-gray-600">Require a password to access the survey</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.passwordProtected}
                  onChange={(e) => setSettings(prev => ({ ...prev, passwordProtected: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {settings.passwordProtected && (
              <div className="ml-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Password
                </label>
                <input
                  type="password"
                  value={settings.accessPassword}
                  onChange={(e) => setSettings(prev => ({ ...prev, accessPassword: e.target.value }))}
                  placeholder="Enter survey password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Respondents will need this password to access the survey
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 flex items-center">
                  {settings.showResultsToRespondent ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  Show Results to Participants
                </p>
                <p className="text-sm text-gray-600">
                  {settings.showResultsToRespondent 
                    ? 'Participants will see their computed scores after completion'
                    : 'Results will be hidden from participants (researchers only)'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showResultsToRespondent}
                  onChange={(e) => setSettings(prev => ({ ...prev, showResultsToRespondent: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Archive className="h-5 w-5 mr-2" />
          Data Management
        </h3>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Data Retention</h4>
              <p className="text-sm text-gray-600 mb-3">
                Response data is stored indefinitely unless manually deleted. 
                Consider your institutional data retention policies.
              </p>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Configure Retention Policy
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Data Export</h4>
              <p className="text-sm text-gray-600 mb-3">
                Export all survey data including responses, scores, and metadata 
                for external analysis or backup.
              </p>
              <button 
                onClick={exportAllData}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Export Complete Dataset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">New Response Alerts</p>
              <p className="text-sm text-gray-600">Get notified when new responses are submitted</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Clinical Flag Alerts</p>
              <p className="text-sm text-gray-600">Get notified when responses trigger clinical flags</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Weekly Summary Reports</p>
              <p className="text-sm text-gray-600">Receive weekly analytics summaries via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Survey Link</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this survey link? This will permanently remove 
                the link and all associated response data. This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSurveyLink}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete Survey Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};