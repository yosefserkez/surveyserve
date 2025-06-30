import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession, validatePrice, formatPrice } from '../../lib/stripe';
import { Survey } from '../../types/survey';
import { X, Calendar, Users, Shield, Settings, Lock, User, Eye, EyeOff, CreditCard, DollarSign, Loader2 } from 'lucide-react';

interface CreateSurveyLinkModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preSelectedSurveyId?: string;
}

export const CreateSurveyLinkModal: React.FC<CreateSurveyLinkModalProps> = ({
  onClose,
  onSuccess,
  preSelectedSurveyId,
}) => {
  const { researcher } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(preSelectedSurveyId || '');
  const [maxResponses, setMaxResponses] = useState(100);
  const [expiresAt, setExpiresAt] = useState('');
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [requireConsent, setRequireConsent] = useState(true);
  const [requireIdentification, setRequireIdentification] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [showResultsToRespondent, setShowResultsToRespondent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (!allowAnonymous) {
      setRequireIdentification(true);
    }
  }, [allowAnonymous]);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('title');

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
  const surveyPrice = selectedSurvey?.price || 0;
  const needsPayment = surveyPrice > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researcher || !selectedSurveyId) return;

    // Validation
    if (passwordProtected && !accessPassword.trim()) {
      alert('Please enter a password for password-protected surveys.');
      return;
    }

    if (!allowAnonymous && !requireIdentification) {
      alert('Identification must be required when anonymous responses are disabled.');
      return;
    }

    setLoading(true);

    try {
      const surveyLinkConfig = {
        maxResponses,
        expiresAt: expiresAt || undefined,
        allowAnonymous,
        requireConsent,
        requireIdentification,
        passwordProtected,
        accessPassword: passwordProtected ? accessPassword.trim() : undefined,
        showResultsToRespondent,
      };

      if (needsPayment) {
        // Handle paid survey
        setProcessingPayment(true);
        
        try {
          validatePrice(surveyPrice);
        } catch (error: any) {
          alert(error.message);
          return;
        }

        const checkoutData = await createCheckoutSession({
          surveyId: selectedSurveyId,
          surveyTitle: selectedSurvey!.title,
          price: surveyPrice,
          currency: selectedSurvey!.currency || 'USD',
          researcherId: researcher.id,
          surveyLinkConfig,
        });

        // Redirect to Stripe Checkout
        window.location.href = checkoutData.url;
        return;
      } else {
        // Handle free survey
        const { error } = await supabase
          .from('survey_links')
          .insert({
            survey_id: selectedSurveyId,
            researcher_id: researcher.id,
            max_responses: maxResponses,
            expires_at: expiresAt || null,
            allow_anonymous: allowAnonymous,
            require_consent: requireConsent,
            require_identification: requireIdentification,
            password_protected: passwordProtected,
            access_password: passwordProtected ? accessPassword.trim() : null,
            show_results_to_respondent: showResultsToRespondent,
            is_paid: false,
          });

        if (error) throw error;
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating survey link:', error);
      alert(error.message || 'Failed to create survey link. Please try again.');
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Survey Link</h2>
          <button
            onClick={onClose}
            disabled={processingPayment}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Survey Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Survey
            </label>
            <select
              value={selectedSurveyId}
              onChange={(e) => setSelectedSurveyId(e.target.value)}
              required
              disabled={!!preSelectedSurveyId || processingPayment}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Choose a survey...</option>
              {surveys.map((survey) => (
                <option key={survey.id} value={survey.id}>
                  {survey.title} {survey.price > 0 && `(${formatPrice(survey.price, survey.currency)})`}
                </option>
              ))}
            </select>
            {selectedSurvey && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">{selectedSurvey.title}</h4>
                <p className="text-sm text-gray-600">{selectedSurvey.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{selectedSurvey.schema.questions.length} questions</span>
                    <span>{Object.keys(selectedSurvey.schema.scoring_rules).length} scoring rules</span>
                    <span>~{Math.ceil(selectedSurvey.schema.questions.length * 0.5)} minutes</span>
                  </div>
                  {selectedSurvey.price > 0 && (
                    <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-sm font-medium">
                        {formatPrice(selectedSurvey.price, selectedSurvey.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Notice */}
          {needsPayment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Payment Required</h4>
                  <p className="text-blue-800 text-sm mt-1">
                    This survey requires a one-time payment of {formatPrice(surveyPrice, selectedSurvey?.currency)} 
                    to create a survey link. You will be redirected to secure Stripe checkout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Maximum Responses
              </label>
              <input
                type="number"
                value={maxResponses}
                onChange={(e) => setMaxResponses(parseInt(e.target.value) || 100)}
                min="1"
                max="10000"
                disabled={processingPayment}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={processingPayment}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Privacy & Security Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy & Security Settings
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={allowAnonymous}
                  onChange={(e) => setAllowAnonymous(e.target.checked)}
                  disabled={processingPayment}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Allow Anonymous Responses</span>
                  <p className="text-xs text-gray-500">Respondents won't need to provide identifying information</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={requireConsent}
                  onChange={(e) => setRequireConsent(e.target.checked)}
                  disabled={processingPayment}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Require Consent</span>
                  <p className="text-xs text-gray-500">Show consent form before survey begins</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={requireIdentification}
                  onChange={(e) => setRequireIdentification(e.target.checked)}
                  disabled={!allowAnonymous || processingPayment}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Require Name & Email</span>
                  <p className="text-xs text-gray-500">
                    {!allowAnonymous 
                      ? 'Required when anonymous responses are disabled'
                      : 'Collect respondent name and email address'
                    }
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={passwordProtected}
                  onChange={(e) => setPasswordProtected(e.target.checked)}
                  disabled={processingPayment}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Password Protection</span>
                  <p className="text-xs text-gray-500">Require a password to access the survey</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={showResultsToRespondent}
                  onChange={(e) => setShowResultsToRespondent(e.target.checked)}
                  disabled={processingPayment}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    {showResultsToRespondent ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                    Show Results to Participants
                  </span>
                  <p className="text-xs text-gray-500">
                    {showResultsToRespondent 
                      ? 'Participants will see their computed scores after completion'
                      : 'Results will be hidden from participants (researchers only)'
                    }
                  </p>
                </div>
              </label>

              {passwordProtected && (
                <div className="ml-7 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Access Password
                  </label>
                  <input
                    type="password"
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    placeholder="Enter survey password"
                    disabled={processingPayment}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                    required={passwordProtected}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Respondents will need this password to access the survey
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={processingPayment}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedSurveyId || processingPayment}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Redirecting to Payment...</span>
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : needsPayment ? (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>Pay & Create Link</span>
                </>
              ) : (
                <span>Create Survey Link</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};