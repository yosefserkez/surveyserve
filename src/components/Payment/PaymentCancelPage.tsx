import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

export const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRetryPayment = () => {
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden max-w-2xl w-full mx-4">
        {/* Cancel Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Payment Canceled</h1>
              <p className="opacity-90">Your payment was not completed</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Message */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No charges were made to your account
            </h2>
            <p className="text-gray-600">
              You canceled the payment process before completing your purchase. 
              You can try again at any time.
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• No payment was processed</li>
              <li>• Your account remains unchanged</li>
              <li>• You can retry the payment at any time</li>
              <li>• All your data and settings are preserved</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleRetryPayment}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              <span>Try Again</span>
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};