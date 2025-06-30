import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Survey, SurveyVisibilityInfo } from '../../types/survey';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, 
  FileText, 
  Calendar, 
  ExternalLink, 
  BookOpen, 
  Plus,
  Filter,
  BarChart3,
  Users,
  Shield,
  Star,
  Clock,
  Target,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Globe,
  Eye,
  User,
  AlertTriangle,
  Link as LinkIcon,
  Calculator,
  Hash,
  Grid3X3,
  List,
  Layers,
  CheckCircle,
  Info,
  Badge,
  Edit,
  Trash2,
  Lock,
  Unlock,
  UserCheck,
  Building
} from 'lucide-react';
import { CreateSurveyModal } from './CreateSurveyModal';
import { CreateSurveyLinkModal } from '../Dashboard/CreateSurveyLinkModal';
import { SurveyManagementModal } from './SurveyManagementModal';

type ViewMode = 'list' | 'expanded';
type SurveySection = 'official' | 'community' | 'my-surveys';

export const SurveyLibrary: React.FC = () => {
  const { user, researcher } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<SurveySection>('official');
  const [sortBy, setSortBy] = useState<'title' | 'created' | 'popular'>('title');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedSurveyForLink, setSelectedSurveyForLink] = useState<string | null>(null);
  const [selectedSurveyForManagement, setSelectedSurveyForManagement] = useState<Survey | null>(null);
  const [surveyStats, setSurveyStats] = useState<Record<string, { usage_count: number; last_used: string }>>({});
  const [surveyVisibility, setSurveyVisibility] = useState<Record<string, SurveyVisibilityInfo>>({});

  useEffect(() => {
    fetchSurveys();
    if (user) {
      fetchSurveyStats();
    }
  }, [user, sectionFilter]);

  const fetchSurveys = async () => {
    try {
      let query = supabase.from('surveys').select(`
        *,
        researcher:researchers(name)
      `);

      // Apply section filters
      switch (sectionFilter) {
        case 'official':
          query = query.eq('is_official', true);
          break;
        case 'community':
          query = query.eq('is_official', false).eq('is_public', true);
          break;
        case 'my-surveys':
          if (researcher) {
            query = query.eq('created_by', researcher.id);
          } else {
            setSurveys([]);
            setLoading(false);
            return;
          }
          break;
      }

      query = query.order('title');
      const { data, error } = await query;

      if (error) throw error;
      setSurveys(data || []);

      // Fetch visibility info for authenticated users
      if (user && data) {
        await fetchSurveyVisibility(data.map(s => s.id));
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveyStats = async () => {
    if (!researcher) return;
    
    try {
      const { data, error } = await supabase
        .from('survey_links')
        .select(`
          survey_id,
          created_at,
          response_counts(total_responses)
        `)
        .eq('researcher_id', researcher.id);

      if (error) throw error;

      const stats: Record<string, { usage_count: number; last_used: string }> = {};
      
      data?.forEach(link => {
        const surveyId = link.survey_id;
        const responses = link.response_counts?.total_responses || 0;
        
        if (!stats[surveyId]) {
          stats[surveyId] = { usage_count: 0, last_used: link.created_at };
        }
        
        stats[surveyId].usage_count += responses;
        if (new Date(link.created_at) > new Date(stats[surveyId].last_used)) {
          stats[surveyId].last_used = link.created_at;
        }
      });
      
      setSurveyStats(stats);
    } catch (error) {
      console.error('Error fetching survey stats:', error);
    }
  };

  const fetchSurveyVisibility = async (surveyIds: string[]) => {
    try {
      const visibilityPromises = surveyIds.map(async (id) => {
        const { data, error } = await supabase
          .rpc('get_survey_visibility_info', { survey_id: id });
        
        if (error) throw error;
        return { id, visibility: data[0] };
      });

      const results = await Promise.all(visibilityPromises);
      const visibilityMap: Record<string, SurveyVisibilityInfo> = {};
      
      results.forEach(({ id, visibility }) => {
        if (visibility) {
          visibilityMap[id] = visibility;
        }
      });
      
      setSurveyVisibility(visibilityMap);
    } catch (error) {
      console.error('Error fetching survey visibility:', error);
    }
  };

  const handleCreateSurveyLink = (surveyId: string) => {
    setSelectedSurveyForLink(surveyId);
    setShowCreateLinkModal(true);
  };

  const handleManageSurvey = (survey: Survey) => {
    setSelectedSurveyForManagement(survey);
    setShowManagementModal(true);
  };

  const handleSurveyLinkCreated = () => {
    setShowCreateLinkModal(false);
    setSelectedSurveyForLink(null);
    fetchSurveyStats();
  };

  const handleSurveyUpdated = () => {
    setShowManagementModal(false);
    setSelectedSurveyForManagement(null);
    fetchSurveys();
  };

  const getCategory = (survey: Survey): string => {
    const metadata = survey.schema.metadata || {};
    if (metadata.category) {
      return metadata.category;
    }
    
    const title = survey.title.toLowerCase();
    const source = survey.source.toLowerCase();
    
    if (title.includes('depression') || title.includes('phq')) return 'Mental Health';
    if (title.includes('anxiety') || title.includes('gad')) return 'Mental Health';
    if (title.includes('personality') || title.includes('big five') || title.includes('bfi')) return 'Personality';
    if (title.includes('stress') || title.includes('burnout')) return 'Well-being';
    if (title.includes('cognitive') || title.includes('memory')) return 'Cognitive';
    if (source.includes('who') || source.includes('world health')) return 'Medical';
    
    return 'General';
  };

  const getUniqueCategories = () => {
    const categories = surveys.map(getCategory);
    return ['all', ...Array.from(new Set(categories))];
  };

  const filteredSurveys = surveys
    .filter(survey => {
      const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           survey.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           survey.source.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || getCategory(survey) === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          const aUsage = surveyStats[a.id]?.usage_count || 0;
          const bUsage = surveyStats[b.id]?.usage_count || 0;
          return bUsage - aUsage;
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const getSectionCounts = () => {
    const official = surveys.filter(s => s.is_official).length;
    const community = surveys.filter(s => !s.is_official && s.is_public).length;
    const mySurveys = surveys.filter(s => s.created_by === researcher?.id).length;
    
    return { official, community, mySurveys };
  };

  const sectionCounts = getSectionCounts();

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
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <BookOpen className="h-12 w-12 text-indigo-600" />
          <h1 className="text-4xl font-bold text-gray-900">Survey Library</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          Explore our collection of validated psychological and behavioral assessment instruments. 
          Each survey includes peer-reviewed scoring algorithms and detailed documentation.
        </p>
        
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Create Custom Survey</span>
          </button>
        )}
      </div>

      {/* Section Tabs */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl border border-white/20">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSectionFilter('official')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              sectionFilter === 'official'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Official Surveys</span>
            <Badge className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
              {sectionCounts.official}
            </Badge>
          </button>
          
          <button
            onClick={() => setSectionFilter('community')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              sectionFilter === 'community'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Community Surveys</span>
            <Badge className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
              {sectionCounts.community}
            </Badge>
          </button>
          
          {user && (
            <button
              onClick={() => setSectionFilter('my-surveys')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                sectionFilter === 'my-surveys'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>My Surveys</span>
              <Badge className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                {sectionCounts.mySurveys}
              </Badge>
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search surveys by title, description, or source..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="title">Sort by Title</option>
              <option value="created">Sort by Date</option>
              {user && <option value="popular">Sort by Usage</option>}
            </select>
          </div>

          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('expanded')}
              className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium transition-colors ${
                viewMode === 'expanded'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Layers className="h-4 w-4 mr-2" />
              <span>Expanded</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{filteredSurveys.length} of {surveys.length} surveys</span>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Logged in as researcher</span>
              </span>
            )}
            <span className="flex items-center space-x-1">
              {viewMode === 'list' ? <Grid3X3 className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
              <span>{viewMode === 'list' ? 'List View' : 'Expanded View'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Section Description */}
      {sectionFilter === 'community' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900">Community Surveys</h4>
              <p className="text-blue-800 text-sm mt-1">
                These surveys are created and shared by researchers in our community. 
                While they may be valuable research tools, they are user-contributed content 
                and have not been officially validated by SurveyStack.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Survey Grid */}
      <div className={viewMode === 'list' ? 'grid gap-6' : 'space-y-8'}>
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No surveys found</h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search terms or filters.' 
                : sectionFilter === 'my-surveys'
                ? 'You haven\'t created any surveys yet. Click "Create Custom Survey" to get started.'
                : 'No surveys available in this section.'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSurveys.map((survey) => (
              <SurveyListCard 
                key={survey.id} 
                survey={survey} 
                category={getCategory(survey)}
                stats={surveyStats[survey.id]}
                visibility={surveyVisibility[survey.id]}
                isLoggedIn={!!user}
                currentSection={sectionFilter}
                onCreateLink={() => handleCreateSurveyLink(survey.id)}
                onManage={() => handleManageSurvey(survey)}
              />
            ))}
          </div>
        ) : (
          filteredSurveys.map((survey) => (
            <SurveyExpandedCard 
              key={survey.id} 
              survey={survey} 
              category={getCategory(survey)}
              stats={surveyStats[survey.id]}
              visibility={surveyVisibility[survey.id]}
              isLoggedIn={!!user}
              currentSection={sectionFilter}
              onCreateLink={() => handleCreateSurveyLink(survey.id)}
              onManage={() => handleManageSurvey(survey)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateSurveyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSurveys();
          }}
        />
      )}

      {showCreateLinkModal && selectedSurveyForLink && (
        <CreateSurveyLinkModal
          preSelectedSurveyId={selectedSurveyForLink}
          onClose={() => {
            setShowCreateLinkModal(false);
            setSelectedSurveyForLink(null);
          }}
          onSuccess={handleSurveyLinkCreated}
        />
      )}

      {showManagementModal && selectedSurveyForManagement && (
        <SurveyManagementModal
          survey={selectedSurveyForManagement}
          onClose={() => {
            setShowManagementModal(false);
            setSelectedSurveyForManagement(null);
          }}
          onSuccess={handleSurveyUpdated}
        />
      )}
    </div>
  );
};

// Enhanced List View Card Component
interface SurveyCardProps {
  survey: Survey;
  category: string;
  stats?: { usage_count: number; last_used: string };
  visibility?: SurveyVisibilityInfo;
  isLoggedIn: boolean;
  currentSection: SurveySection;
  onCreateLink: () => void;
  onManage: () => void;
}

const SurveyListCard: React.FC<SurveyCardProps> = ({ 
  survey, 
  category, 
  stats,
  visibility,
  isLoggedIn,
  currentSection,
  onCreateLink,
  onManage
}) => {
  const questionCount = survey.schema.questions.length;
  const scoringRuleCount = Object.keys(survey.schema.scoring_rules).length;
  const metadata = survey.schema.metadata || {};

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Mental Health': return 'bg-red-100 text-red-700';
      case 'Personality': return 'bg-purple-100 text-purple-700';
      case 'Well-being': return 'bg-green-100 text-green-700';
      case 'Cognitive': return 'bg-blue-100 text-blue-700';
      case 'Medical': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getVisibilityIcon = () => {
    if (survey.is_official) return <Building className="h-3 w-3" />;
    if (survey.is_public) return <Globe className="h-3 w-3" />;
    return <Lock className="h-3 w-3" />;
  };

  const getVisibilityLabel = () => {
    if (survey.is_official) return 'Official';
    if (survey.is_public) return 'Public';
    return 'Private';
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:shadow-lg transition-all duration-200 h-full">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="bg-indigo-100 rounded-lg p-2 flex-shrink-0">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                {survey.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getCategoryColor(category)}`}>
                {category}
              </span>
            </div>
            
            {/* Survey Type and Stats */}
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                survey.is_official 
                  ? 'bg-blue-100 text-blue-700' 
                  : survey.is_public 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {getVisibilityIcon()}
                <span>{getVisibilityLabel()}</span>
              </span>
              
              {stats && stats.usage_count > 0 && (
                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.usage_count} responses</span>
                </span>
              )}
            </div>
            
            {/* Validation badges */}
            <div className="flex flex-wrap gap-1 mb-2">
              {metadata.validated && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  Validated
                </span>
              )}
              {metadata.license === 'Public Domain' && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  Public Domain
                </span>
              )}
            </div>

            {/* Community survey author */}
            {!survey.is_official && currentSection === 'community' && survey.researcher && (
              <div className="text-xs text-gray-500 mb-2">
                <span className="font-medium">Created by:</span> {survey.researcher.name}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
          {survey.description}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-900">{questionCount}</div>
            <div className="text-gray-600">Questions</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-900">{scoringRuleCount}</div>
            <div className="text-gray-600">Scores</div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-xs text-gray-500 truncate" title={survey.source}>
            {survey.source}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>v{survey.version}</span>
            <span>
              {metadata.administration_time || `~${Math.ceil(questionCount * 0.5)} min`}
            </span>
          </div>
          {metadata.population && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Population:</span> {metadata.population}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 mt-auto">
          <a
            href={`/survey/demo-${survey.id}`}
            className="block w-full text-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm"
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Preview
          </a>
          
          <div className="flex space-x-2">
            {isLoggedIn && (
              <button
                onClick={onCreateLink}
                className="flex-1 px-3 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all duration-200 text-sm"
              >
                <LinkIcon className="h-4 w-4 inline mr-1" />
                Create Link
              </button>
            )}
            
            {visibility?.can_edit && (
              <button
                onClick={onManage}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 text-sm"
              >
                <Edit className="h-4 w-4 inline mr-1" />
                Manage
              </button>
            )}
          </div>
          
          {!isLoggedIn && (
            <div className="text-center">
              <a 
                href="/signin" 
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign in to create links →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Expanded View Card Component
const SurveyExpandedCard: React.FC<SurveyCardProps> = ({ 
  survey, 
  category, 
  stats,
  visibility,
  isLoggedIn,
  currentSection,
  onCreateLink,
  onManage
}) => {
  const [showQuestions, setShowQuestions] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  
  const questionCount = survey.schema.questions.length;
  const scoringRuleCount = Object.keys(survey.schema.scoring_rules).length;
  const metadata = survey.schema.metadata || {};

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Mental Health': return 'bg-red-100 text-red-700';
      case 'Personality': return 'bg-purple-100 text-purple-700';
      case 'Well-being': return 'bg-green-100 text-green-700';
      case 'Cognitive': return 'bg-blue-100 text-blue-700';
      case 'Medical': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreTypes = () => {
    const rules = survey.schema.scoring_rules;
    const types = new Set<string>();
    
    Object.values(rules).forEach(rule => {
      types.add(rule.type);
    });
    
    return Array.from(types);
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - 3/4 width */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="flex items-start space-x-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h3>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                        {category}
                      </span>
                      
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                        survey.is_official 
                          ? 'bg-blue-100 text-blue-700' 
                          : survey.is_public 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {survey.is_official ? <Building className="h-3 w-3" /> : 
                         survey.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        <span>{survey.is_official ? 'Official' : survey.is_public ? 'Public' : 'Private'}</span>
                      </span>
                      
                      {stats && stats.usage_count > 0 && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{stats.usage_count} responses</span>
                        </span>
                      )}
                      
                      {metadata.validated && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Validated
                        </span>
                      )}
                    </div>

                    {/* Community survey author */}
                    {!survey.is_official && currentSection === 'community' && survey.researcher && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Created by:</span> {survey.researcher.name}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">{survey.description}</p>
                
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{questionCount}</div>
                    <div className="text-xs text-gray-600">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{scoringRuleCount}</div>
                    <div className="text-xs text-gray-600">Scores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {metadata.administration_time || `~${Math.ceil(questionCount * 0.5)} min`}
                    </div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{survey.version}</div>
                    <div className="text-xs text-gray-600">Version</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Metadata Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Survey Details
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Source:</span>
                  <p className="text-gray-600 mt-1">{survey.source}</p>
                </div>
                {metadata.population && (
                  <div>
                    <span className="font-medium text-gray-700">Target Population:</span>
                    <p className="text-gray-600 mt-1">{metadata.population}</p>
                  </div>
                )}
                {metadata.license && (
                  <div>
                    <span className="font-medium text-gray-700">License:</span>
                    <p className="text-gray-600 mt-1">{metadata.license}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Added:</span>
                  <p className="text-gray-600 mt-1">{new Date(survey.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Psychometric Properties */}
              {metadata.psychometric_properties && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Psychometric Properties:</span>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    {metadata.psychometric_properties.reliability?.cronbach_alpha && (
                      <div>
                        <span className="text-gray-600">Cronbach's α:</span>
                        <span className="ml-2 font-medium">{metadata.psychometric_properties.reliability.cronbach_alpha}</span>
                      </div>
                    )}
                    {metadata.psychometric_properties.reliability?.test_retest && (
                      <div>
                        <span className="text-gray-600">Test-retest:</span>
                        <span className="ml-2 font-medium">{metadata.psychometric_properties.reliability.test_retest}</span>
                      </div>
                    )}
                  </div>
                  {metadata.psychometric_properties.validity && (
                    <p className="text-gray-600 text-sm mt-2">{metadata.psychometric_properties.validity}</p>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-3 mt-4">
                <div className="flex flex-wrap gap-2">
                  {getScoreTypes().map(type => (
                    <span key={type} className="bg-white text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-4">
              {/* Questions Section */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-gray-900">All Questions ({questionCount})</span>
                  </div>
                  {showQuestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {showQuestions && (
                  <div className="border-t border-gray-200 p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-3">
                      {survey.schema.questions.map((question, index) => (
                        <div key={question.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                              Q{index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 mb-2">{question.text}</p>
                              {question.timeframe && (
                                <p className="text-xs text-blue-600 mb-2 bg-blue-50 px-2 py-1 rounded">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {question.timeframe}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span className="bg-white px-2 py-1 rounded">{question.type}</span>
                                {question.reverse_score && (
                                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">reverse scored</span>
                                )}
                                {question.subscale && (
                                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{question.subscale}</span>
                                )}
                                {question.dimension && (
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{question.dimension}</span>
                                )}
                                {question.options && (
                                  <span className="bg-white px-2 py-1 rounded">{question.options.length} options</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scoring Section */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setShowScoring(!showScoring)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900">Scoring Rules ({scoringRuleCount})</span>
                  </div>
                  {showScoring ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {showScoring && (
                  <div className="border-t border-gray-200 p-4">
                    <div className="space-y-3">
                      {Object.entries(survey.schema.scoring_rules).map(([ruleName, rule]) => (
                        <div key={ruleName} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium flex-shrink-0 capitalize">
                              {ruleName.replace(/_/g, ' ')}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="bg-white px-2 py-1 rounded text-xs text-gray-600">{rule.type}</span>
                                {rule.questions && (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                    {rule.questions.length} questions
                                  </span>
                                )}
                                {rule.formula && (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                                    formula
                                  </span>
                                )}
                              </div>
                              
                              {rule.description && (
                                <p className="text-xs text-gray-600 mb-1">{rule.description}</p>
                              )}
                              
                              {rule.formula && (
                                <div className="text-xs text-gray-500 mb-1">
                                  <span className="font-medium">Formula:</span> <code className="bg-gray-100 px-1 rounded">{rule.formula}</code>
                                </div>
                              )}
                              
                              {rule.questions && rule.questions.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  Questions: {rule.questions.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Actions - 1/4 width */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-3">
                  <a
                    href={`/survey/demo-${survey.id}`}
                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm"
                  >
                    <Eye className="h-4 w-4 inline mr-2" />
                    Preview Survey
                  </a>
                  
                  {isLoggedIn && (
                    <button
                      onClick={onCreateLink}
                      className="w-full px-4 py-3 bg-white border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all duration-200 text-sm"
                    >
                      <LinkIcon className="h-4 w-4 inline mr-2" />
                      Create Survey Link
                    </button>
                  )}
                  
                  {visibility?.can_edit && (
                    <button
                      onClick={onManage}
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 text-sm"
                    >
                      <Edit className="h-4 w-4 inline mr-2" />
                      Manage Survey
                    </button>
                  )}
                  
                  {!isLoggedIn && (
                    <div className="text-center p-3 bg-white border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Sign in to create survey links</p>
                      <a 
                        href="/signin" 
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Researcher Sign In →
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {stats && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Your Usage</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Responses:</span>
                      <span className="font-medium text-blue-900">{stats.usage_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Last used:</span>
                      <span className="font-medium text-blue-900">{new Date(stats.last_used).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Norms and Validation Info */}
              {(metadata.norms || metadata.validated) && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Validation</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-700">Peer reviewed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-700">Clinical grade</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-700">Auto scoring</span>
                    </div>
                    {metadata.norms && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-green-700">Normative data</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};