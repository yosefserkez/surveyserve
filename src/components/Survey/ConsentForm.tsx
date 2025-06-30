import React, { useState } from 'react';
import { Survey } from '../../types/survey';
import { Shield, CheckCircle, FileText, AlertTriangle } from 'lucide-react';

interface ConsentFormProps {
  survey: Survey;
  onConsent: () => void;
}

export const ConsentForm: React.FC<ConsentFormProps> = ({ survey, onConsent }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Research Participation Consent</h1>
            <p className="opacity-90">{survey.title}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Study Information
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Survey Description</h4>
            <p className="text-gray-700 mb-4">{survey.description}</p>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Source:</span>
                <p className="text-gray-600">{survey.source}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Version:</span>
                <p className="text-gray-600">{survey.version}</p>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-gray-900 mb-3">Your Rights as a Participant</h4>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Your participation is entirely voluntary</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>You may withdraw at any time without penalty</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Your responses will be kept confidential</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Data will be used for research purposes only</span>
            </li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-yellow-800">Important Note</h5>
                <p className="text-yellow-700 text-sm mt-1">
                  This survey contains questions about personal thoughts and feelings. 
                  If you experience distress, please consider speaking with a mental health professional.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
            />
            <span className="text-gray-700">
              I have read and understood the information above. I consent to participate 
              in this research study and understand that I can withdraw at any time.
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onConsent}
            disabled={!agreed}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Begin Survey
          </button>
        </div>
      </div>
    </div>
  );
};