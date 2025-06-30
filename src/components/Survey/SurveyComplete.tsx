import React from 'react';
import { Survey } from '../../types/survey';
import { CheckCircle, BarChart3, AlertTriangle, Download, Home, Eye, EyeOff } from 'lucide-react';

interface SurveyCompleteProps {
  survey: Survey;
  responses: Record<string, any>;
  computedScores: Record<string, any>;
  showResults?: boolean;
  onReturnHome?: () => void;
}

export const SurveyComplete: React.FC<SurveyCompleteProps> = ({ 
  survey, 
  responses, 
  computedScores,
  showResults = true,
  onReturnHome
}) => {
  const downloadResults = () => {
    const results = {
      survey_title: survey.title,
      completed_at: new Date().toISOString(),
      responses,
      computed_scores: computedScores
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReturnHome = () => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      window.location.href = '/';
    }
  };

  const hasFlags = Object.entries(computedScores).some(([key, value]) => 
    typeof value === 'boolean' && value === true
  );

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Survey Complete</h1>
            <p className="opacity-90">Thank you for your participation</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Completion Message */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Your responses have been recorded
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your survey responses have been securely submitted and processed.
            {showResults 
              ? ' Below you\'ll find your computed scores based on the validated scoring algorithms.'
              : ' The researcher will review your responses and may contact you with results if appropriate.'
            }
          </p>
        </div>

        {/* Results Section - Only show if showResults is true */}
        {showResults ? (
          <>
            {/* Clinical Flags */}
            {hasFlags && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
                    <p className="text-yellow-700 text-sm mb-3">
                      Your responses indicate scores that may warrant attention. 
                      These results are for informational purposes only and should not replace professional consultation.
                    </p>
                    <p className="text-yellow-700 text-sm font-medium">
                      If you're experiencing distress, please consider speaking with a qualified mental health professional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Computed Scores */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-6 w-6 mr-2" />
                Your Results
              </h3>
              
              <div className="grid gap-4">
                {Object.entries(computedScores).map(([scoreName, value]) => {
                  const isFlag = typeof value === 'boolean';
                  const displayValue = isFlag 
                    ? (value ? 'Yes' : 'No')
                    : typeof value === 'number' 
                      ? value.toFixed(2)
                      : value;

                  return (
                    <div
                      key={scoreName}
                      className={`p-4 rounded-lg border-2 ${
                        isFlag && value 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 capitalize">
                          {scoreName.replace(/_/g, ' ')}
                        </span>
                        <span className={`font-semibold ${
                          isFlag && value 
                            ? 'text-yellow-700' 
                            : 'text-gray-900'
                        }`}>
                          {displayValue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">About These Results</h4>
              <p className="text-blue-800 text-sm mb-3">
                These scores are computed using validated algorithms from: {survey.source}
              </p>
              <p className="text-blue-800 text-sm">
                The results are based on your responses to the {survey.title} ({survey.version}) 
                and should be interpreted by qualified professionals in the appropriate context.
              </p>
            </div>
          </>
        ) : (
          /* Results Hidden Message */
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <EyeOff className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Results Processing</h3>
            <p className="text-gray-600 mb-4">
              Your responses are being analyzed by the research team. Results are not immediately available 
              to participants for this study.
            </p>
            <p className="text-sm text-gray-500">
              If you have questions about your responses or this research, please contact the study administrator.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
          {showResults && (
            <button
              onClick={downloadResults}
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Download Results</span>
            </button>
          )}
          <button
            onClick={handleReturnHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            <Home className="h-5 w-5" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};