import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SurveyLink, Survey, Response } from '../../types/survey';
import { 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Download,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText,
  Shield,
  Bell,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
  response_count: number;
  last_response: string | null;
}

export const SurveyManagement: React.FC = () => {
  const { researcher } = useAuth();
  const navigate = useNavigate();
  const [surveyLinks, setSurveyLinks] = useState<ExtendedSurveyLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<ExtendedSurveyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    if (researcher) {
      fetchSurveyLinks();
    }
  }, [researcher]);

  useEffect(() => {
    applyFilters();
  }, [surveyLinks, searchTerm, statusFilter, dateFilter]);

  const fetchSurveyLinks = async () => {
    if (!researcher) return;

    try {
      const { data, error } = await supabase
        .from('survey_links')
        .select(`
          *,
          survey:surveys(*),
          response_counts(total_responses)
        `)
        .eq('researcher_id', researcher.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get last response dates
      const linksWithStats = await Promise.all(
        (data || []).map(async (link) => {
          const { data: lastResponse } = await supabase
            .from('responses')
            .select('completed_at')
            .eq('survey_link_id', link.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...link,
            response_count: link.response_counts?.total_responses || 0,
            last_response: lastResponse?.completed_at || null
          };
        })
      );

      setSurveyLinks(linksWithStats);
    } catch (error) {
      console.error('Error fetching survey links:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...surveyLinks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(link =>
        link.survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.link_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(link => {
        const isExpired = link.expires_at && new Date(link.expires_at) < now;
        const isAtCapacity = link.response_count >= link.max_responses;
        
        switch (statusFilter) {
          case 'active':
            return link.active && !isExpired && !isAtCapacity;
          case 'inactive':
            return !link.active;
          case 'expired':
            return isExpired || isAtCapacity;
          default:
            return true;
        }
      });
    }

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
      
      filtered = filtered.filter(link => 
        new Date(link.created_at) >= cutoffDate
      );
    }

    setFilteredLinks(filtered);
  };

  const updateSurveyLink = async (linkId: string, updates: Partial<SurveyLink>) => {
    try {
      const { error } = await supabase
        .from('survey_links')
        .update(updates)
        .eq('id', linkId);

      if (error) throw error;
      await fetchSurveyLinks();
    } catch (error) {
      console.error('Error updating survey link:', error);
    }
  };

  const toggleLinkStatus = async (link: ExtendedSurveyLink) => {
    await updateSurveyLink(link.id, { active: !link.active });
  };

  const exportData = async (link: ExtendedSurveyLink) => {
    try {
      const { data: responses, error } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_link_id', link.id);

      if (error) throw error;

      const csvData = responses?.map(response => ({
        response_id: response.id,
        completed_at: response.completed_at,
        respondent_identifier: response.respondent_identifier || 'Anonymous',
        ...response.raw_responses,
        ...response.computed_scores
      })) || [];

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
      a.download = `survey-responses-${link.link_code}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  const getStatusInfo = (link: ExtendedSurveyLink) => {
    const now = new Date();
    const isExpired = link.expires_at && new Date(link.expires_at) < now;
    const isAtCapacity = link.response_count >= link.max_responses;

    if (!link.active) {
      return { status: 'Inactive', color: 'bg-gray-100 text-gray-600', icon: Pause };
    }
    if (isExpired) {
      return { status: 'Expired', color: 'bg-red-100 text-red-600', icon: Clock };
    }
    if (isAtCapacity) {
      return { status: 'Full', color: 'bg-orange-100 text-orange-600', icon: Users };
    }
    return { status: 'Active', color: 'bg-green-100 text-green-600', icon: Play };
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
      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search surveys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired/Full</option>
          </select>
          
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
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>{filteredLinks.length} of {surveyLinks.length} surveys</span>
          </div>
        </div>
      </div>

      {/* Survey Links Grid */}
      <div className="grid gap-6">
        {filteredLinks.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-12 text-center border border-white/20">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No surveys found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Create your first survey link to get started.'
              }
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => {
            const statusInfo = getStatusInfo(link);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div
                key={link.id}
                className="bg-white/70 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {link.survey.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {statusInfo.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{link.survey.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Responses:</span>
                          <p className="font-medium">{link.response_count} / {link.max_responses}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <p className="font-medium">{new Date(link.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <p className="font-medium">
                            {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Response:</span>
                          <p className="font-medium">
                            {link.last_response ? new Date(link.last_response).toLocaleDateString() : 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Response Progress</span>
                      <span>{Math.round((link.response_count / link.max_responses) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((link.response_count / link.max_responses) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/manage/${link.id}`)}
                      className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Manage</span>
                    </button>
                    
                    <a
                      href={`/survey/${link.link_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Preview</span>
                    </a>
                    
                    <button
                      onClick={() => toggleLinkStatus(link)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                        link.active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {link.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      <span>{link.active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    
                    {link.response_count > 0 && (
                      <button
                        onClick={() => exportData(link)}
                        className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};