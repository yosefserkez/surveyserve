import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SurveyLink, Survey } from '../../types/survey';
import { BarChart3, Users, Link as LinkIcon, Plus, Calendar, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateSurveyLinkModal } from './CreateSurveyLinkModal';
import { SurveyLinkCard } from './SurveyLinkCard';
import { SurveyManagement } from './SurveyManagement';

export const Dashboard: React.FC = () => {
  const { researcher } = useAuth();
  const [surveyLinks, setSurveyLinks] = useState<(SurveyLink & { survey: Survey })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalResponses: 0,
    activeLinks: 0,
  });

  useEffect(() => {
    if (researcher) {
      fetchSurveyLinks();
    }
  }, [researcher]);

  // Fetch stats whenever surveyLinks changes
  useEffect(() => {
    if (surveyLinks.length > 0) {
      fetchStats();
    } else {
      // Reset stats when no survey links
      setStats({
        totalLinks: 0,
        totalResponses: 0,
        activeLinks: 0,
      });
    }
  }, [surveyLinks]);

  const fetchSurveyLinks = async () => {
    if (!researcher) return;

    try {
      const { data, error } = await supabase
        .from('survey_links')
        .select(`
          *,
          survey:surveys(*)
        `)
        .eq('researcher_id', researcher.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      setSurveyLinks(data || []);
    } catch (error) {
      console.error('Error fetching survey links:', error);
      // Set empty array so the page still renders with an error state
      setSurveyLinks([]);
      // You might want to add an error state here to show users what happened
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!researcher || surveyLinks.length === 0) return;

    try {
      // Get response counts for all survey links
      const surveyLinkIds = surveyLinks.map(link => link.id);
      
      const { data: responseCounts, error: responseCountsError } = await supabase
        .from('response_counts')
        .select('survey_link_id, total_responses')
        .in('survey_link_id', surveyLinkIds);

      if (responseCountsError) throw responseCountsError;

      // Calculate total responses
      const totalResponses = (responseCounts || []).reduce((sum, count) => sum + count.total_responses, 0);
      
      // Calculate active links (not expired and still accepting responses)
      const now = new Date();
      const activeLinks = surveyLinks.filter(link => {
        if (!link.active) return false;
        if (link.expires_at && new Date(link.expires_at) < now) return false;
        
        // Check if at capacity
        const responseCount = responseCounts?.find(rc => rc.survey_link_id === link.id)?.total_responses || 0;
        if (responseCount >= link.max_responses) return false;
        
        return true;
      }).length;

      setStats({
        totalLinks: surveyLinks.length,
        totalResponses,
        activeLinks,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set basic stats even if response counts fail
      setStats({
        totalLinks: surveyLinks.length,
        totalResponses: 0,
        activeLinks: surveyLinks.filter(link => link.active).length,
      });
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Research Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {researcher?.name}. Here's your research activity overview.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Create Survey Link</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Survey Links"
          value={stats.activeLinks}
          icon={<LinkIcon className="h-6 w-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Total Responses"
          value={stats.totalResponses}
          icon={<Users className="h-6 w-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Survey Links Created"
          value={stats.totalLinks}
          icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
          color="bg-purple-100"
        />
      </div>

      {/* Survey Links */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Survey Links</h2>
          <Link
            to="/surveys"
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
          >
            <span>Browse Survey Library</span>
            <BarChart3 className="h-4 w-4" />
          </Link>
        </div>

        {surveyLinks.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-12 text-center border border-white/20">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Survey Links Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first survey link to start collecting responses. Choose from our library of validated instruments.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Link</span>
            </button>
          </div>
        ) : (
<SurveyManagement />
        )}
      </div>

      {/* Create Survey Link Modal */}
      {showCreateModal && (
        <CreateSurveyLinkModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSurveyLinks();
          }}
        />
      )}
    </div>
  );
};