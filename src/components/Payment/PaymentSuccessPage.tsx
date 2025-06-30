import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPaymentStatus } from '../../lib/stripe';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle, Home, Copy, ExternalLink, Settings } from 'lucide-react';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchPaymentStatus();
    } else {
      setError('No session ID found');
      setLoading(false);
    }
  }, [sessionId]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const data = await getPaymentStatus(sessionId!);
      setPaymentData(data);
      
      // Poll for survey link creation if not yet available
      if (!data.survey_link && data.status === 'pending') {
        setTimeout(fetchPaymentStatus, 2000);
      }
    } catch (error: any) {
      console.error('Error fetching payment status:', error);
      setError(error.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleManageSurvey = () => {
    if (paymentData?.survey_link?.id) {
      navigate(`/manage/${paymentData.survey_link.id}`);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const copyToClipboard = async () => {
    if (!paymentData?.survey_link?.link_code) return;
    
    try {
      const surveyUrl = `${window.location.origin}/survey/${paymentData.survey_link.link_code}`;
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 max-w-md w-full mx-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we create your survey link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 max-w-md w-full mx-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Issue</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden max-w-2xl w-full mx-4">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Payment Successful!</h1>
              <p className="opacity-90">Your survey link has been created</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Success Message */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Thank you for your purchase!
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your payment has been processed successfully and your survey link is now ready to use. 
              You can start collecting responses immediately.
            </p>
          </div>

          {/* Survey Information */}
          {paymentData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Survey Details</h3>
              <div className="text-blue-800 text-sm">
                <p><span className="font-medium">Survey:</span> {paymentData.survey?.title}</p>
                <p><span className="font-medium">Status:</span> {paymentData.status}</p>
                <p><span className="font-medium">Created:</span> {new Date(paymentData.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Survey Link */}
          {paymentData?.survey_link ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Your Survey Link is Ready!</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/survey/${paymentData.survey_link.link_code}`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <a
                    href={`/survey/${paymentData.survey_link.link_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm text-green-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Preview Survey</span>
                  </a>
                  
                  <button
                    onClick={handleManageSurvey}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Manage Survey</span>
                  </button>
                </div>
                
                <div className="text-sm text-green-700">
                  <p><span className="font-medium">Max Responses:</span> {paymentData.survey_link.max_responses}</p>
                  <p><span className="font-medium">Status:</span> {paymentData.survey_link.active ? 'Active' : 'Inactive'}</p>
                  {paymentData.survey_link.expires_at && (
                    <p><span className="font-medium">Expires:</span> {new Date(paymentData.survey_link.expires_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Survey Link Creation in Progress</h3>
              <p className="text-yellow-800 text-sm">
                Your payment was successful! We're creating your survey link now. This page will update automatically.
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                <span className="text-yellow-700 text-sm">Creating survey link...</span>
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-2">What's next?</h4>
            <ul className="text-indigo-800 text-sm space-y-1">
              <li>• Share your survey link with participants</li>
              <li>• Monitor responses in your dashboard</li>
              <li>• Use the "Manage Survey" button to configure settings</li>
              <li>• Download results and analytics when ready</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            {paymentData?.survey_link ? (
              <button
                onClick={handleManageSurvey}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                <span>Manage Survey</span>
              </button>
            ) : (
              <button
                onClick={handleGoToDashboard}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};