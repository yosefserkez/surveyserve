import React, { useState } from 'react';
import { Survey, Question } from '../../types/survey';
import { ChevronLeft, ChevronRight, FileText, Send, Clock, Info } from 'lucide-react';

interface SurveyFormProps {
  survey: Survey;
  onSubmit: (responses: Record<string, any>) => void;
  loading: boolean;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ survey, onSubmit, loading }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const questions = survey.schema.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    setErrors(prev => ({
      ...prev,
      [questionId]: ''
    }));
  };

  const validateCurrentQuestion = (): boolean => {
    const currentResponse = responses[currentQuestion.id];
    if (currentResponse === undefined || currentResponse === '') {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: 'This question is required'
      }));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentQuestion()) {
      if (isLastQuestion) {
        handleSubmit();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Validate all responses
    const allErrors: Record<string, string> = {};
    let hasErrors = false;

    questions.forEach(question => {
      if (responses[question.id] === undefined || responses[question.id] === '') {
        allErrors[question.id] = 'This question is required';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(allErrors);
      // Go to first question with error
      const firstErrorIndex = questions.findIndex(q => allErrors[q.id]);
      if (firstErrorIndex !== -1) {
        setCurrentQuestionIndex(firstErrorIndex);
      }
      return;
    }

    onSubmit(responses);
  };

  const renderQuestion = (question: Question) => {
    const currentResponse = responses[question.id];
    const hasError = errors[question.id];

    switch (question.type) {
      case 'likert':
        return (
          <div className="space-y-4">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-indigo-300 ${
                  currentResponse === option.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : hasError 
                    ? 'border-red-300'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={currentResponse === option.value}
                    onChange={(e) => handleResponse(question.id, option.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-900 font-medium">{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'numeric':
        return (
          <div>
            <input
              type="number"
              value={currentResponse || ''}
              onChange={(e) => handleResponse(question.id, parseInt(e.target.value))}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                hasError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter a number"
            />
          </div>
        );

      case 'text':
        return (
          <div>
            <textarea
              value={currentResponse || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                hasError ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={4}
              placeholder="Enter your response"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Get metadata from survey schema
  const metadata = survey.schema.metadata || {};

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{survey.title}</h1>
              <div className="flex items-center space-x-3 opacity-90">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                {metadata.administration_time && (
                  <>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{metadata.administration_time}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-8">
        <div className="mb-8">
          {/* Question Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-relaxed">
              {currentQuestion.text}
            </h2>
            
            {/* Timeframe or additional context */}
            {currentQuestion.timeframe && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Context</p>
                    <p>{currentQuestion.timeframe}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Question metadata */}
            {(currentQuestion.subscale || currentQuestion.dimension) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {currentQuestion.subscale && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                    {currentQuestion.subscale}
                  </span>
                )}
                {currentQuestion.dimension && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                    {currentQuestion.dimension}
                  </span>
                )}
                {currentQuestion.reverse_score && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                    Reverse Scored
                  </span>
                )}
              </div>
            )}
          </div>
          
          {errors[currentQuestion.id] && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors[currentQuestion.id]}</p>
            </div>
          )}
          
          {renderQuestion(currentQuestion)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>

          <span className="text-sm text-gray-500">
            {currentQuestionIndex + 1} / {questions.length}
          </span>

          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastQuestion ? (
              <>
                <Send className="h-5 w-5" />
                <span>{loading ? 'Submitting...' : 'Submit'}</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};