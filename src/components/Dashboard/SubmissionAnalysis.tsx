import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { SurveyLink, Survey, Response } from '../../types/survey';
import { 
  Users, 
  Calendar, 
  Download, 
  Filter, 
  Search,
  Eye,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
  response_count: number;
  last_response: string | null;
}

interface SubmissionAnalysisProps {
  surveyLink: ExtendedSurveyLink;
}

interface AnalyticsData {
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  responsesByDate: Array<{ date: string; count: number }>;
  scoreDistribution: Record<string, number[]>;
}

export const SubmissionAnalysis: React.FC<SubmissionAnalysisProps> = ({ surveyLink }) => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<Response[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showIncomplete, setShowIncomplete] = useState(false);

  useEffect(() => {
    fetchResponses();
  }, [surveyLink.id]);

  useEffect(() => {
    applyFilters();
    calculateAnalytics();
  }, [responses, dateFilter, searchTerm, showIncomplete]);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_link_id', surveyLink.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...responses];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(response => 
        new Date(response.completed_at) >= cutoffDate
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(response =>
        response.respondent_identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResponses(filtered);
  };

  const calculateAnalytics = () => {
    if (responses.length === 0) {
      setAnalytics(null);
      return;
    }

    // Group responses by date
    const responsesByDate = responses.reduce((acc, response) => {
      const date = new Date(response.completed_at).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate score distributions
    const scoreDistribution: Record<string, number[]> = {};
    responses.forEach(response => {
      Object.entries(response.computed_scores).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (!scoreDistribution[key]) {
            scoreDistribution[key] = [];
          }
          scoreDistribution[key].push(value);
        }
      });
    });

    setAnalytics({
      totalResponses: responses.length,
      completionRate: 100, // Assuming all stored responses are complete
      averageTime: 0, // Would need to track start/end times
      responsesByDate: Object.entries(responsesByDate).map(([date, count]) => ({ date, count })),
      scoreDistribution
    });
  };

  const exportData = () => {
    const csvData = filteredResponses.map(response => ({
      response_id: response.id,
      completed_at: response.completed_at,
      respondent_identifier: response.respondent_identifier || 'Anonymous',
      ...response.raw_responses,
      ...response.computed_scores
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => 
        typeof val === 'string' ? `"${val}"` : val
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-responses-${surveyLink.link_code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalResponses}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.completionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round((analytics.totalResponses / surveyLink.max_responses) * 100)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Response</p>
                <p className="text-sm font-bold text-gray-900">
                  {responses.length > 0 
                    ? new Date(responses[0].completed_at).toLocaleDateString()
                    : 'None'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Score Distribution */}
      {analytics && Object.keys(analytics.scoreDistribution).length > 0 && (
        <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Score Distribution
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.scoreDistribution).map(([scoreName, values]) => {
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const min = Math.min(...values);
              const max = Math.max(...values);
              
              return (
                <div key={scoreName} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">
                    {scoreName.replace(/_/g, ' ')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-medium">{avg.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Range:</span>
                      <span className="font-medium">{min} - {max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Responses:</span>
                      <span className="font-medium">{values.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {filteredResponses.length} of {responses.length} responses
            </span>
            <button
              onClick={exportData}
              disabled={filteredResponses.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responses List */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Individual Responses</h3>
        </div>
        
        {filteredResponses.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No responses found</h4>
            <p className="text-gray-600">
              {responses.length === 0 
                ? 'No responses have been submitted yet.'
                : 'Try adjusting your filters.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredResponses.map((response) => (
              <div key={response.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-gray-900">
                        {response.respondent_identifier || 'Anonymous'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(response.completed_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(response.computed_scores).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm"
                        >
                          {key.replace(/_/g, ' ')}: {
                            typeof value === 'boolean' 
                              ? (value ? 'Yes' : 'No')
                              : typeof value === 'number'
                              ? value.toFixed(2)
                              : value
                          }
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedResponse(response)}
                    className="flex items-center space-x-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Response Details</h3>
              <button
                onClick={() => setSelectedResponse(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Response Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedResponse.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                  <p className="text-gray-900">{new Date(selectedResponse.completed_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Respondent</label>
                  <p className="text-gray-900">{selectedResponse.respondent_identifier || 'Anonymous'}</p>
                </div>
              </div>

              {/* Raw Responses */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Raw Responses</h4>
                <div className="space-y-3">
                  {Object.entries(selectedResponse.raw_responses).map(([questionId, answer]) => {
                    const question = surveyLink.survey.schema.questions.find(q => q.id === questionId);
                    return (
                      <div key={questionId} className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900 mb-2">
                          {question?.text || questionId}
                        </p>
                        <p className="text-gray-700">{String(answer)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Computed Scores */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Computed Scores</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(selectedResponse.computed_scores).map(([key, value]) => (
                    <div key={key} className="bg-indigo-50 rounded-lg p-4">
                      <p className="font-medium text-indigo-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-indigo-700 text-lg font-semibold">
                        {typeof value === 'boolean' 
                          ? (value ? 'Yes' : 'No')
                          : typeof value === 'number'
                          ? value.toFixed(2)
                          : value
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};