import React, { useState } from 'react';
import { Survey } from '../../types/survey';
import { supabase } from '../../lib/supabase';
import { 
  X, 
  Save, 
  Trash2, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Loader2,
  Info,
  FileText,
  Edit3
} from 'lucide-react';

interface SurveyManagementModalProps {
  survey: Survey;
  onClose: () => void;
  onSuccess: () => void;
}

export const SurveyManagementModal: React.FC<SurveyManagementModalProps> = ({
  survey,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description);
  const [isPublic, setIsPublic] = useState(survey.is_public);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('surveys')
        .update({
          title: title.trim(),
          description: description.trim(),
          is_public: isPublic,
        })
        .eq('id', survey.id);

      if (error) throw error;
      onSuccess();
    } catch (error: any) {
      console.error('Error updating survey:', error);
      setError(error.message || 'Failed to update survey');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      // First check if there are any survey links using this survey
      const { data: links, error: linksError } = await supabase
        .from('survey_links')
        .select('id')
        .eq('survey_id', survey.id)
        .limit(1);

      if (linksError) throw linksError;

      if (links && links.length > 0) {
        setError('Cannot delete survey: it is being used by existing survey links. Please delete all survey links first.');
        setLoading(false);
        return;
      }

      // Delete the survey
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', survey.id);

      if (error) throw error;
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting survey:', error);
      setError(error.message || 'Failed to delete survey');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Manage Survey</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Survey Visibility Warning */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900">Survey Visibility</h4>
                <p className="text-blue-800 text-sm mt-1">
                  {isPublic 
                    ? 'This survey is currently public and visible to all users in the Community Surveys section.'
                    : 'This survey is currently private and only visible to you.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Edit3 className="h-5 w-5 mr-2" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter survey title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe the purpose and scope of your survey"
              />
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Visibility Settings
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-900">Private</span>
                    <p className="text-sm text-gray-600">Only you can see and use this survey</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-900">Public</span>
                    <p className="text-sm text-gray-600">
                      Visible to all users in the Community Surveys section
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Survey Details (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Survey Details
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Questions:</span>
                  <span className="ml-2 text-gray-600">{survey.schema.questions.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scoring Rules:</span>
                  <span className="ml-2 text-gray-600">{Object.keys(survey.schema.scoring_rules).length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Version:</span>
                  <span className="ml-2 text-gray-600">{survey.version}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">{new Date(survey.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Source:</span>
                <p className="text-gray-600 mt-1">{survey.source}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Delete Survey</h4>
                  <p className="text-red-700 text-sm mt-1">
                    Permanently delete this survey. This action cannot be undone. 
                    You must delete all survey links using this survey first.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4 inline mr-2" />
                    Delete Survey
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Survey</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{survey.title}"? This will permanently 
                remove the survey and all its data. This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete Survey'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};