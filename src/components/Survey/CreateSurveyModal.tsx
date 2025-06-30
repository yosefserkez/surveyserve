import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  X, 
  Plus, 
  FileText, 
  Trash2, 
  Save,
  AlertTriangle,
  Info,
  BarChart3,
  Target,
  Calculator,
  CheckCircle,
  Globe,
  Lock
} from 'lucide-react';

interface CreateSurveyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Question {
  id: string;
  text: string;
  type: 'likert' | 'numeric' | 'text';
  options?: Array<{ value: number | string; label: string }>;
  reverse_score?: boolean;
}

interface ScoringRule {
  type: 'sum' | 'average' | 'computed' | 'threshold' | 'flag';
  questions?: string[];
  input?: string;
  thresholds?: Array<{ min: number; max: number; label: string }>;
  condition?: string;
  formula?: string;
}

export const CreateSurveyModal: React.FC<CreateSurveyModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { researcher } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'basic' | 'questions' | 'scoring' | 'review'>('basic');
  
  // Basic information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [version, setVersion] = useState('1.0');
  const [isPublic, setIsPublic] = useState(false);
  
  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Scoring rules
  const [scoringRules, setScoringRules] = useState<Record<string, ScoringRule>>({});
  const [editingRule, setEditingRule] = useState<{ name: string; rule: ScoringRule } | null>(null);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${questions.length + 1}`,
      text: '',
      type: 'likert',
      options: [
        { value: 1, label: 'Strongly Disagree' },
        { value: 2, label: 'Disagree' },
        { value: 3, label: 'Neutral' },
        { value: 4, label: 'Agree' },
        { value: 5, label: 'Strongly Agree' }
      ]
    };
    setEditingQuestion(newQuestion);
  };

  const saveQuestion = (question: Question) => {
    if (questions.find(q => q.id === question.id)) {
      setQuestions(prev => prev.map(q => q.id === question.id ? question : q));
    } else {
      setQuestions(prev => [...prev, question]);
    }
    setEditingQuestion(null);
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    // Remove question from scoring rules
    setScoringRules(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(ruleName => {
        if (updated[ruleName].questions) {
          updated[ruleName].questions = updated[ruleName].questions!.filter(qId => qId !== id);
        }
      });
      return updated;
    });
  };

  const addScoringRule = () => {
    const ruleName = `score_${Object.keys(scoringRules).length + 1}`;
    const newRule: ScoringRule = {
      type: 'sum',
      questions: []
    };
    setEditingRule({ name: ruleName, rule: newRule });
  };

  const saveScoringRule = (name: string, rule: ScoringRule) => {
    setScoringRules(prev => ({ ...prev, [name]: rule }));
    setEditingRule(null);
  };

  const removeScoringRule = (name: string) => {
    setScoringRules(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!researcher || !title || !description || !source || questions.length === 0) {
      alert('Please fill in all required fields and add at least one question.');
      return;
    }

    setLoading(true);
    try {
      const surveySchema = {
        questions,
        scoring_rules: scoringRules
      };

      const { error } = await supabase
        .from('surveys')
        .insert({
          title,
          description,
          version,
          source,
          schema: surveySchema,
          is_official: false,
          is_public: isPublic,
          created_by: researcher.id
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating survey:', error);
      alert('Failed to create survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return title && description && source;
      case 'questions':
        return questions.length > 0;
      case 'scoring':
        return Object.keys(scoringRules).length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Custom Survey</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step Navigator */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {[
              { id: 'basic', label: 'Basic Info', icon: FileText },
              { id: 'questions', label: 'Questions', icon: CheckCircle },
              { id: 'scoring', label: 'Scoring', icon: Calculator },
              { id: 'review', label: 'Review', icon: Target }
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentStep === step.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                  <span>{step.label}</span>
                </button>
                {index < 3 && <div className="h-px bg-gray-300 flex-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Basic Information Step */}
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Basic Survey Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Survey Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Custom Workplace Stress Assessment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Describe the purpose and scope of your survey..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source/Citation *
                    </label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Your institution or research citation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1.0"
                    />
                  </div>
                </div>

                {/* Visibility Settings */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Survey Visibility
                  </h4>
                  
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
                            Share with the community - visible in Community Surveys section
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">About Visibility</p>
                        <p className="mt-1">
                          Public surveys appear in the Community Surveys section and can be used by other researchers. 
                          You can change this setting later in the survey management interface.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions Step */}
          {currentStep === 'questions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Survey Questions</h3>
                <button
                  onClick={addQuestion}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            Q{index + 1}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {question.type}
                          </span>
                        </div>
                        <p className="text-gray-900">{question.text}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingQuestion(question)}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No questions added yet. Click "Add Question" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scoring Step */}
          {currentStep === 'scoring' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Scoring Rules</h3>
                <button
                  onClick={addScoringRule}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Rule</span>
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(scoringRules).map(([name, rule]) => (
                  <div key={name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium capitalize">
                            {name.replace(/_/g, ' ')}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {rule.type}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {rule.questions?.length} questions selected
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingRule({ name, rule })}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeScoringRule(name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {Object.keys(scoringRules).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No scoring rules defined yet. Click "Add Rule" to create scoring logic.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Review & Create Survey</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Survey Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p><strong>Title:</strong> {title}</p>
                      <p><strong>Description:</strong> {description}</p>
                      <p><strong>Source:</strong> {source}</p>
                      <p><strong>Version:</strong> {version}</p>
                      <p><strong>Visibility:</strong> {isPublic ? 'Public' : 'Private'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Statistics</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p><strong>Questions:</strong> {questions.length}</p>
                      <p><strong>Scoring Rules:</strong> {Object.keys(scoringRules).length}</p>
                      <p><strong>Estimated Time:</strong> ~{Math.ceil(questions.length * 0.5)} minutes</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Validation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Basic information complete</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Questions defined</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Scoring rules configured</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Ready to Create</p>
                        <p>Your custom survey will be added to the library and available for creating survey links.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            {currentStep !== 'basic' && (
              <button
                onClick={() => {
                  const steps = ['basic', 'questions', 'scoring', 'review'];
                  const currentIndex = steps.indexOf(currentStep);
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1] as any);
                  }
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            
            {currentStep !== 'review' ? (
              <button
                onClick={() => {
                  if (canProceed()) {
                    const steps = ['basic', 'questions', 'scoring', 'review'];
                    const currentIndex = steps.indexOf(currentStep);
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1] as any);
                    }
                  }
                }}
                disabled={!canProceed()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create Survey'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Editor Modal */}
        {editingQuestion && (
          <QuestionEditor
            question={editingQuestion}
            onSave={saveQuestion}
            onCancel={() => setEditingQuestion(null)}
          />
        )}

        {/* Scoring Rule Editor Modal */}
        {editingRule && (
          <ScoringRuleEditor
            name={editingRule.name}
            rule={editingRule.rule}
            questions={questions}
            existingRules={scoringRules}
            onSave={saveScoringRule}
            onCancel={() => setEditingRule(null)}
          />
        )}
      </div>
    </div>
  );
};

// Question Editor Component
const QuestionEditor: React.FC<{
  question: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}> = ({ question, onSave, onCancel }) => {
  const [editedQuestion, setEditedQuestion] = useState<Question>({ ...question });

  const addOption = () => {
    const newOptions = [...(editedQuestion.options || [])];
    newOptions.push({ value: newOptions.length + 1, label: '' });
    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const updateOption = (index: number, field: 'value' | 'label', value: any) => {
    const newOptions = [...(editedQuestion.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index: number) => {
    const newOptions = [...(editedQuestion.options || [])];
    newOptions.splice(index, 1);
    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Question</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                value={editedQuestion.text}
                onChange={(e) => setEditedQuestion(prev => ({ ...prev, text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={editedQuestion.type}
                onChange={(e) => setEditedQuestion(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="likert">Likert Scale</option>
                <option value="numeric">Numeric Input</option>
                <option value="text">Text Response</option>
              </select>
            </div>

            {editedQuestion.type === 'likert' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Response Options
                  </label>
                  <button
                    onClick={addOption}
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {editedQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={option.value}
                        onChange={(e) => updateOption(index, 'value', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => updateOption(index, 'label', e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Option label"
                      />
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editedQuestion.reverse_score || false}
                onChange={(e) => setEditedQuestion(prev => ({ ...prev, reverse_score: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">Reverse score this question</label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => editedQuestion.text && onSave(editedQuestion)}
              disabled={!editedQuestion.text}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Save Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scoring Rule Editor Component
const ScoringRuleEditor: React.FC<{
  name: string;
  rule: ScoringRule;
  questions: Question[];
  existingRules: Record<string, ScoringRule>;
  onSave: (name: string, rule: ScoringRule) => void;
  onCancel: () => void;
}> = ({ name, rule, questions, existingRules, onSave, onCancel }) => {
  const [editedName, setEditedName] = useState(name);
  const [editedRule, setEditedRule] = useState<ScoringRule>({ ...rule });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Scoring Rule</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., total_score, anxiety_level"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Type
              </label>
              <select
                value={editedRule.type}
                onChange={(e) => setEditedRule(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="sum">Sum of selected questions</option>
                <option value="average">Average of selected questions</option>
                <option value="computed">Formula-based calculation</option>
                <option value="threshold">Threshold-based categorization</option>
                <option value="flag">Boolean flag based on condition</option>
              </select>
            </div>

            {(editedRule.type === 'sum' || editedRule.type === 'average') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Questions
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {questions.map(question => (
                    <label key={question.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editedRule.questions?.includes(question.id) || false}
                        onChange={(e) => {
                          const newQuestions = editedRule.questions || [];
                          if (e.target.checked) {
                            setEditedRule(prev => ({ 
                              ...prev, 
                              questions: [...newQuestions, question.id] 
                            }));
                          } else {
                            setEditedRule(prev => ({ 
                              ...prev, 
                              questions: newQuestions.filter(id => id !== question.id) 
                            }));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{question.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {editedRule.type === 'computed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formula
                </label>
                <input
                  type="text"
                  value={editedRule.formula || ''}
                  onChange={(e) => setEditedRule(prev => ({ ...prev, formula: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., score_1 * 2 + score_2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use other rule names in your formula. Example: raw_score * 4
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => editedName && onSave(editedName, editedRule)}
              disabled={!editedName}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Save Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};