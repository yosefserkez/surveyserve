import React, { useState, useEffect } from 'react';
import { SurveyLink, Survey, Response } from '../../types/survey';
import { supabase } from '../../lib/supabase';
import { 
  BarChart3, 
  Calculator, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Award,
  Activity
} from 'lucide-react';

interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
  response_count: number;
  last_response: string | null;
}

interface ScoringMonitorProps {
  surveyLink: ExtendedSurveyLink;
}

interface ScoringAnalytics {
  scoreBreakdown: Record<string, {
    average: number;
    median: number;
    min: number;
    max: number;
    standardDeviation: number;
    distribution: number[];
  }>;
  flaggedResponses: number;
  trends: Record<string, Array<{ date: string; value: number }>>;
}

export const ScoringMonitor: React.FC<ScoringMonitorProps> = ({ surveyLink }) => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [analytics, setAnalytics] = useState<ScoringAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScore, setSelectedScore] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, [surveyLink.id]);

  useEffect(() => {
    if (responses.length > 0) {
      calculateScoringAnalytics();
    }
  }, [responses]);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_link_id', surveyLink.id)
        .order('completed_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScoringAnalytics = () => {
    const scoreBreakdown: Record<string, any> = {};
    const trends: Record<string, Array<{ date: string; value: number }>> = {};
    let flaggedResponses = 0;

    // Get all unique score keys
    const allScoreKeys = new Set<string>();
    responses.forEach(response => {
      Object.keys(response.computed_scores).forEach(key => allScoreKeys.add(key));
    });

    // Calculate statistics for each score
    allScoreKeys.forEach(scoreKey => {
      const values: number[] = [];
      const trendData: Array<{ date: string; value: number }> = [];

      responses.forEach(response => {
        const value = response.computed_scores[scoreKey];
        if (typeof value === 'number') {
          values.push(value);
          trendData.push({
            date: response.completed_at,
            value: value
          });
        } else if (typeof value === 'boolean' && value === true) {
          flaggedResponses++;
        }
      });

      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        
        const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);

        scoreBreakdown[scoreKey] = {
          average,
          median,
          min: Math.min(...values),
          max: Math.max(...values),
          standardDeviation,
          distribution: values
        };

        trends[scoreKey] = trendData;
      }
    });

    setAnalytics({
      scoreBreakdown,
      flaggedResponses,
      trends
    });
  };

  const getScoringRuleInfo = (ruleName: string) => {
    const rule = surveyLink.survey.schema.scoring_rules[ruleName];
    if (!rule) return null;

    return {
      type: rule.type,
      description: getScoreDescription(rule, ruleName),
      questions: rule.questions || [],
      thresholds: rule.thresholds || [],
      condition: rule.condition
    };
  };

  const getScoreDescription = (rule: any, ruleName: string) => {
    switch (rule.type) {
      case 'sum':
        return `Sum of responses to ${rule.questions?.length || 0} questions`;
      case 'average':
        return `Average of responses to ${rule.questions?.length || 0} questions`;
      case 'threshold':
        return `Categorical score based on ${rule.input} value`;
      case 'flag':
        return `Boolean flag based on condition: ${rule.condition}`;
      default:
        return 'Custom scoring rule';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analytics || responses.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-12 text-center border border-white/20">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Scoring Data Available</h3>
        <p className="text-gray-600">
          Scoring analytics will appear once responses are submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scoring Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Scores</p>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(analytics.scoreBreakdown).length}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Flagged Responses</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.flaggedResponses}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scoring Rules</p>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(surveyLink.survey.schema.scoring_rules).length}
              </p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round((responses.length / surveyLink.max_responses) * 100)}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Scoring Rules Documentation */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Scoring Rules & Formulas
        </h3>
        
        <div className="grid gap-4">
          {Object.entries(surveyLink.survey.schema.scoring_rules).map(([ruleName, rule]) => (
            <div key={ruleName} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {ruleName.replace(/_/g, ' ')}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rule.type === 'sum' ? 'bg-blue-100 text-blue-700' :
                      rule.type === 'average' ? 'bg-green-100 text-green-700' :
                      rule.type === 'threshold' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {rule.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getScoreDescription(rule, ruleName)}
                  </p>
                  
                  {rule.questions && (
                    <div className="text-xs text-gray-500">
                      Questions: {rule.questions.join(', ')}
                    </div>
                  )}
                  
                  {rule.thresholds && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Thresholds:</p>
                      <div className="flex flex-wrap gap-1">
                        {rule.thresholds.map((threshold: any, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {threshold.min}-{threshold.max}: {threshold.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {rule.condition && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Condition:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{rule.condition}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Statistics */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Score Statistics
        </h3>
        
        <div className="grid gap-4">
          {Object.entries(analytics.scoreBreakdown).map(([scoreName, stats]) => (
            <div key={scoreName} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 capitalize">
                  {scoreName.replace(/_/g, ' ')}
                </h4>
                <button
                  onClick={() => setSelectedScore(selectedScore === scoreName ? null : scoreName)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  {selectedScore === scoreName ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Average:</span>
                  <p className="font-medium text-gray-900">{stats.average.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Median:</span>
                  <p className="font-medium text-gray-900">{stats.median.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Range:</span>
                  <p className="font-medium text-gray-900">{stats.min} - {stats.max}</p>
                </div>
                <div>
                  <span className="text-gray-600">Std Dev:</span>
                  <p className="font-medium text-gray-900">{stats.standardDeviation.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Responses:</span>
                  <p className="font-medium text-gray-900">{stats.distribution.length}</p>
                </div>
              </div>
              
              {selectedScore === scoreName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2">Distribution</h5>
                  <div className="grid grid-cols-10 gap-1 h-20">
                    {Array.from({ length: 10 }, (_, i) => {
                      const binSize = (stats.max - stats.min) / 10;
                      const binStart = stats.min + i * binSize;
                      const binEnd = binStart + binSize;
                      const count = stats.distribution.filter(val => val >= binStart && val < binEnd).length;
                      const height = stats.distribution.length > 0 ? (count / stats.distribution.length) * 100 : 0;
                      
                      return (
                        <div key={i} className="flex flex-col justify-end h-full">
                          <div
                            className="bg-indigo-500 rounded-t"
                            style={{ height: `${height}%` }}
                            title={`${binStart.toFixed(1)} - ${binEnd.toFixed(1)}: ${count} responses`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{stats.min}</span>
                    <span>{stats.max}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Performance Insights
        </h3>
        
        <div className="space-y-4">
          {analytics.flaggedResponses > 0 && (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Clinical Attention Flags</p>
                <p className="text-yellow-700 text-sm">
                  {analytics.flaggedResponses} responses have triggered clinical attention flags. 
                  Review these responses for potential follow-up.
                </p>
              </div>
            </div>
          )}
          
          {Object.entries(analytics.scoreBreakdown).map(([scoreName, stats]) => {
            const cv = stats.standardDeviation / stats.average; // Coefficient of variation
            if (cv > 0.5) {
              return (
                <div key={scoreName} className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">High Variability Detected</p>
                    <p className="text-blue-700 text-sm">
                      The {scoreName.replace(/_/g, ' ')} score shows high variability (CV: {(cv * 100).toFixed(1)}%). 
                      This may indicate diverse response patterns or potential data quality issues.
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })}
          
          {responses.length >= 30 && (
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Sufficient Sample Size</p>
                <p className="text-green-700 text-sm">
                  You have collected {responses.length} responses, which provides good statistical power 
                  for meaningful analysis and interpretation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};