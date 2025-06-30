import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Survey, SurveyVisibilityInfo, Researcher } from '../../types/survey';
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
  Building,
  SlidersHorizontal,
  X,
  Zap,
  Brain,
  Heart,
  Activity,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Timer,
  Users2,
  ShieldCheck
} from 'lucide-react';
import { CreateSurveyModal } from './CreateSurveyModal';
import { CreateSurveyLinkModal } from '../Dashboard/CreateSurveyLinkModal';
import { SurveyManagementModal } from './SurveyManagementModal';

// Enhanced interfaces
interface SurveyWithResearcher extends Survey {
  researcher?: Pick<Researcher, 'name'>;
}

type SurveySection = 'all' | 'official' | 'community' | 'my-surveys' | 'favorites';

interface FilterState {
  search: string;
  category: string;
  section: SurveySection;
  sortBy: 'title' | 'created' | 'popular' | 'recent';
  showAdvancedFilters: boolean;
  validated: boolean | null;
  timeRange: string;
}

export const SurveyLibrary: React.FC = () => {
  const { user, researcher } = useAuth();
  
  // State management
  const [surveys, setSurveys] = useState<SurveyWithResearcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    section: 'official',
    sortBy: 'title',
    showAdvancedFilters: false,
    validated: null,
    timeRange: 'all'
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showSurveyDetailsModal, setShowSurveyDetailsModal] = useState(false);
  const [selectedSurveyForLink, setSelectedSurveyForLink] = useState<string | null>(null);
  const [selectedSurveyForManagement, setSelectedSurveyForManagement] = useState<SurveyWithResearcher | null>(null);
  const [selectedSurveyForDetails, setSelectedSurveyForDetails] = useState<SurveyWithResearcher | null>(null);
  
  // Data states
  const [surveyStats, setSurveyStats] = useState<Record<string, { usage_count: number; last_used: string }>>({});
  const [surveyVisibility, setSurveyVisibility] = useState<Record<string, SurveyVisibilityInfo>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({
    all: 0,
    official: 0,
    community: 0,
    mySurveys: 0,
    favorites: 0
  });

  // Fetch surveys with enhanced filtering
  const fetchSurveys = async () => {
    setLoading(true);
    try {
      let query = supabase.from('surveys').select(`
        *,
        researcher:researchers(name)
      `);

      // Apply section filters
      switch (filters.section) {
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
        case 'favorites':
          if (user && favorites.size > 0) {
            query = query.in('id', Array.from(favorites));
          } else {
            setSurveys([]);
            setLoading(false);
            return;
          }
          break;
        // 'all' case - no additional filters
      }

      const { data, error } = await query.order('title');

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      setSurveys(data || []);

      // Fetch visibility info for authenticated users
      if (user && data) {
        await fetchSurveyVisibility(data.map(s => s.id));
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      // Set empty array so the page still renders with an error state
      setSurveys([]);
      // You might want to add an error state here to show users what happened
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
        const responses = Array.isArray(link.response_counts) && link.response_counts.length > 0 
          ? link.response_counts[0]?.total_responses || 0 
          : 0;
        
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

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('survey_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(new Set(data?.map(f => f.survey_id) || []));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchSectionCounts = async () => {
    try {
      // Fetch all surveys count
      const { count: allCount, error: allError } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true });

      if (allError) throw allError;

      // Fetch official surveys count
      const { count: officialCount, error: officialError } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('is_official', true);

      if (officialError) throw officialError;

      // Fetch community surveys count
      const { count: communityCount, error: communityError } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('is_official', false)
        .eq('is_public', true);

      if (communityError) throw communityError;

      // Fetch my surveys count
      let mySurveysCount = 0;
      if (researcher) {
        const { count, error: myError } = await supabase
          .from('surveys')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', researcher.id);

        if (myError) throw myError;
        mySurveysCount = count || 0;
      }

      // Update section counts
      setSectionCounts({
        all: allCount || 0,
        official: officialCount || 0,
        community: communityCount || 0,
        mySurveys: mySurveysCount,
        favorites: favorites.size
      });
    } catch (error) {
             console.error('Error fetching section counts:', error);
     }
   };

  // Fetch data on component mount and filter changes
  useEffect(() => {
    fetchSurveys();
    if (user) {
      fetchSurveyStats();
      fetchFavorites();
    }
    // Only fetch section counts after favorites are loaded on initial load
  }, [user, researcher, filters.section]);

  // Update section counts when favorites change (after initial load)
  useEffect(() => {
    fetchSectionCounts();
  }, [favorites, researcher]);

  // Enhanced filtering and sorting
  const getCategory = (survey: Survey): string => {
    const metadata = survey.schema.metadata || {};
    if (metadata.category) return metadata.category;
    
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

  const filteredAndSortedSurveys = useMemo(() => {
    let result = surveys.filter(survey => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = survey.title.toLowerCase().includes(searchLower) ||
                             survey.description.toLowerCase().includes(searchLower) ||
                             survey.source.toLowerCase().includes(searchLower) ||
                             (survey.researcher?.name && survey.researcher.name.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (filters.category !== 'all' && getCategory(survey) !== filters.category) {
        return false;
      }
      
      // Validation filter
      if (filters.validated !== null) {
        const isValidated = survey.schema.metadata?.validated === true;
        if (filters.validated !== isValidated) return false;
      }
      
      return true;
    });

    // Sort surveys
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          const aUsage = surveyStats[a.id]?.usage_count || 0;
          const bUsage = surveyStats[b.id]?.usage_count || 0;
          return bUsage - aUsage;
        case 'recent':
          const aRecent = surveyStats[a.id]?.last_used || a.created_at;
          const bRecent = surveyStats[b.id]?.last_used || b.created_at;
          return new Date(bRecent).getTime() - new Date(aRecent).getTime();
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [surveys, filters, surveyStats]);

  // Get category counts
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: surveys.length };
    surveys.forEach(survey => {
      const category = getCategory(survey);
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }, [surveys]);

  // Get section counts
  const sectionStats = sectionCounts;

  // Event handlers
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewSurveyDetails = (survey: SurveyWithResearcher) => {
    setSelectedSurveyForDetails(survey);
    setShowSurveyDetailsModal(true);
  };

  const handleCreateSurveyLink = (surveyId: string) => {
    setSelectedSurveyForLink(surveyId);
    setShowCreateLinkModal(true);
  };

  const handleManageSurvey = (survey: SurveyWithResearcher) => {
    setSelectedSurveyForManagement(survey);
    setShowManagementModal(true);
  };

  const toggleFavorite = async (surveyId: string) => {
    if (!user) return;
    
    try {
      const isFavorited = favorites.has(surveyId);
      
      if (isFavorited) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('survey_id', surveyId);
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(surveyId);
          return newSet;
        });
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, survey_id: surveyId });
        
        setFavorites(prev => new Set([...prev, surveyId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <Header 
          onCreateSurvey={() => setShowCreateModal(true)}
          isLoggedIn={!!user}
        />

        {/* Navigation Tabs */}
        <SectionTabs 
          currentSection={filters.section}
          sectionStats={sectionCounts}
          onSectionChange={(section) => updateFilter('section', section)}
          isLoggedIn={!!user}
        />

        {/* Enhanced Search and Filters */}
        <SearchAndFilters 
          filters={filters}
          categoryStats={categoryStats}
          onFilterChange={updateFilter}
          resultCount={filteredAndSortedSurveys.length}
          totalCount={sectionCounts[filters.section === 'my-surveys' ? 'mySurveys' : filters.section] || 0}
        />

        {/* Section Description */}
        <SectionDescription section={filters.section} />

        {/* Main Content */}
        <MainContent 
          surveys={filteredAndSortedSurveys}
          filters={filters}
          surveyStats={surveyStats}
          surveyVisibility={surveyVisibility}
          favorites={favorites}
          isLoggedIn={!!user}
          currentSection={filters.section}
          onCreateLink={handleCreateSurveyLink}
          onManage={handleManageSurvey}
          onToggleFavorite={toggleFavorite}
          onViewDetails={handleViewSurveyDetails}
          getCategory={getCategory}
        />

        {/* Modals */}
        <Modals 
          showCreateModal={showCreateModal}
          showCreateLinkModal={showCreateLinkModal}
          showManagementModal={showManagementModal}
          selectedSurveyForLink={selectedSurveyForLink}
          selectedSurveyForManagement={selectedSurveyForManagement}
          onCloseCreateModal={() => setShowCreateModal(false)}
          onCloseCreateLinkModal={() => {
            setShowCreateLinkModal(false);
            setSelectedSurveyForLink(null);
          }}
          onCloseManagementModal={() => {
            setShowManagementModal(false);
            setSelectedSurveyForManagement(null);
          }}
          onSurveyCreated={() => {
            setShowCreateModal(false);
            fetchSurveys();
          }}
          onSurveyLinkCreated={() => {
            setShowCreateLinkModal(false);
            setSelectedSurveyForLink(null);
            fetchSurveyStats();
          }}
          onSurveyUpdated={() => {
            setShowManagementModal(false);
            setSelectedSurveyForManagement(null);
            fetchSurveys();
          }}
        />

        {/* Survey Details Modal */}
        <SurveyDetailsModal
          survey={selectedSurveyForDetails}
          isOpen={showSurveyDetailsModal}
          onClose={() => {
            setShowSurveyDetailsModal(false);
            setSelectedSurveyForDetails(null);
          }}
          onCreateLink={() => {
            setShowSurveyDetailsModal(false);
            setSelectedSurveyForDetails(null);
            handleCreateSurveyLink(selectedSurveyForDetails?.id || '');
          }}
          isLoggedIn={!!user}
          stats={selectedSurveyForDetails ? surveyStats[selectedSurveyForDetails.id] : undefined}
        />
      </div>
    </div>
  );
};

// Component: Loading State
const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center space-x-3 mb-6">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-200 border-t-indigo-600"></div>
        <div className="text-xl font-semibold text-gray-700">Loading Survey Library...</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 p-6 animate-pulse">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-gray-200 rounded-lg w-12 h-12"></div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded w-3/4 h-4 mb-2"></div>
                <div className="bg-gray-200 rounded w-1/2 h-3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-gray-200 rounded w-full h-3"></div>
              <div className="bg-gray-200 rounded w-5/6 h-3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Component: Header
interface HeaderProps {
  onCreateSurvey: () => void;
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCreateSurvey, isLoggedIn }) => (
  <div className="text-center mb-12">
    <div className="inline-flex items-center space-x-4 mb-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4">
        <BookOpen className="h-12 w-12 text-white" />
      </div>
      <div className="text-left">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Survey Library</h1>
        <div className="flex items-center space-x-2 text-lg text-gray-600">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <span>Validated research instruments at your fingertips</span>
        </div>
      </div>
    </div>
    
    <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
      Explore our curated collection of peer-reviewed psychological and behavioral assessment instruments. 
      Each survey includes automated scoring, detailed documentation, and normative data.
    </p>
    
    {isLoggedIn && (
      <button
        onClick={onCreateSurvey}
        className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <span className="flex items-center space-x-3">
          <Plus className="h-5 w-5" />
          <span>Create Custom Survey</span>
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
    )}
  </div>
);

// Component: Section Tabs
interface SectionTabsProps {
  currentSection: SurveySection;
  sectionStats: Record<string, number>;
  onSectionChange: (section: SurveySection) => void;
  isLoggedIn: boolean;
}

const SectionTabs: React.FC<SectionTabsProps> = ({ 
  currentSection, 
  sectionStats, 
  onSectionChange, 
  isLoggedIn 
}) => {
  const tabs = [
    { 
      id: 'official' as SurveySection, 
      label: 'Official', 
      icon: ShieldCheck, 
      count: sectionStats.official,
      color: 'blue'
    },
    { 
      id: 'all' as SurveySection, 
      label: 'All Surveys', 
      icon: Globe, 
      count: sectionStats.all,
      color: 'indigo'
    },
    { 
      id: 'community' as SurveySection, 
      label: 'Community', 
      icon: Users2, 
      count: sectionStats.community,
      color: 'green'
    },
    ...(isLoggedIn ? [
      { 
        id: 'my-surveys' as SurveySection, 
        label: 'My Surveys', 
        icon: UserCheck, 
        count: sectionStats.mySurveys,
        color: 'purple'
      },
      { 
        id: 'favorites' as SurveySection, 
        label: 'Favorites', 
        icon: Heart, 
        count: sectionStats.favorites,
        color: 'pink'
      }
    ] : [])
  ];

  const getTabStyles = (tabId: SurveySection, isActive: boolean) => {
    const baseStyles = "flex items-center space-x-3 px-6 py-4 font-semibold transition-all duration-200 border-b-3 relative";
    
    if (isActive) {
      switch (tabId) {
        case 'all':
          return `${baseStyles} text-indigo-600 border-indigo-600 bg-indigo-50/50`;
        case 'official':
          return `${baseStyles} text-blue-600 border-blue-600 bg-blue-50/50`;
        case 'community':
          return `${baseStyles} text-green-600 border-green-600 bg-green-50/50`;
        case 'my-surveys':
          return `${baseStyles} text-purple-600 border-purple-600 bg-purple-50/50`;
        case 'favorites':
          return `${baseStyles} text-pink-600 border-pink-600 bg-pink-50/50`;
        default:
          return `${baseStyles} text-indigo-600 border-indigo-600 bg-indigo-50/50`;
      }
    }
    
    switch (tabId) {
      case 'all':
        return `${baseStyles} text-gray-600 border-transparent hover:text-indigo-600 hover:bg-indigo-50/30`;
      case 'official':
        return `${baseStyles} text-gray-600 border-transparent hover:text-blue-600 hover:bg-blue-50/30`;
      case 'community':
        return `${baseStyles} text-gray-600 border-transparent hover:text-green-600 hover:bg-green-50/30`;
      case 'my-surveys':
        return `${baseStyles} text-gray-600 border-transparent hover:text-purple-600 hover:bg-purple-50/30`;
      case 'favorites':
        return `${baseStyles} text-gray-600 border-transparent hover:text-pink-600 hover:bg-pink-50/30`;
      default:
        return `${baseStyles} text-gray-600 border-transparent hover:text-indigo-600 hover:bg-indigo-50/30`;
    }
  };

  const getBadgeStyles = (tabId: SurveySection, isActive: boolean) => {
    const baseStyles = "px-2 py-1 rounded-full text-xs font-bold";
    
    if (isActive) {
      switch (tabId) {
        case 'all':
          return `${baseStyles} bg-indigo-100 text-indigo-700`;
        case 'official':
          return `${baseStyles} bg-blue-100 text-blue-700`;
        case 'community':
          return `${baseStyles} bg-green-100 text-green-700`;
        case 'my-surveys':
          return `${baseStyles} bg-purple-100 text-purple-700`;
        case 'favorites':
          return `${baseStyles} bg-pink-100 text-pink-700`;
        default:
          return `${baseStyles} bg-indigo-100 text-indigo-700`;
      }
    }
    
    return `${baseStyles} bg-gray-100 text-gray-600`;
  };

  const getBottomBorder = (tabId: SurveySection) => {
    switch (tabId) {
      case 'all':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
      case 'official':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'community':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'my-surveys':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'favorites':
        return 'bg-gradient-to-r from-pink-500 to-pink-600';
      default:
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg mb-8 overflow-hidden">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const isActive = currentSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={getTabStyles(id, isActive)}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              <span className={getBadgeStyles(id, isActive)}>
                {count}
              </span>
              {isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${getBottomBorder(id)} rounded-full`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Component: Search and Filters
interface SearchAndFiltersProps {
  filters: FilterState;
  categoryStats: Record<string, number>;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  resultCount: number;
  totalCount: number;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  filters,
  categoryStats,
  onFilterChange,
  resultCount,
  totalCount
}) => {
  const categories = Object.keys(categoryStats).filter(cat => cat !== 'all');
  
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg p-6 mb-8">
      {/* Main search and filter row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        {/* Enhanced Search */}
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search by title, description, author, or keyword..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Category Filter */}
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm appearance-none transition-all duration-200"
          >
            <option value="all">All Categories ({categoryStats.all})</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category} ({categoryStats[category] || 0})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Sort By */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm appearance-none transition-all duration-200"
          >
            <option value="title">Sort by Title</option>
            <option value="created">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="recent">Recently Used</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{resultCount}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalCount}</span> surveys
          </span>
          
          <button
            onClick={() => onFilterChange('showAdvancedFilters', !filters.showAdvancedFilters)}
            className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Advanced Filters</span>
            {filters.showAdvancedFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {filters.showAdvancedFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Validation Status</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="validated"
                    checked={filters.validated === null}
                    onChange={() => onFilterChange('validated', null)}
                    className="mr-2"
                  />
                  <span className="text-sm">All Surveys</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="validated"
                    checked={filters.validated === true}
                    onChange={() => onFilterChange('validated', true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Validated Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="validated"
                    checked={filters.validated === false}
                    onChange={() => onFilterChange('validated', false)}
                    className="mr-2"
                  />
                  <span className="text-sm">Unvalidated</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => onFilterChange('timeRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component: Section Description
interface SectionDescriptionProps {
  section: SurveySection;
}

const SectionDescription: React.FC<SectionDescriptionProps> = ({ section }) => {
  const getDescriptionInfo = (section: SurveySection) => {
    switch (section) {
      case 'official':
        return {
          icon: ShieldCheck,
          title: "Official Survey Collection",
          description: "Peer-reviewed, clinically validated instruments from established psychological and medical organizations. These surveys include comprehensive normative data and automated scoring algorithms.",
          containerBg: "bg-blue-50",
          containerBorder: "border-blue-200",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          titleColor: "text-blue-900",
          textColor: "text-blue-800"
        };
      case 'community':
        return {
          icon: Users2,
          title: "Community Contributions",
          description: "Research instruments created and shared by our community of researchers. While valuable for research, these are user-contributed and may not have official validation.",
          containerBg: "bg-green-50",
          containerBorder: "border-green-200",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          titleColor: "text-green-900",
          textColor: "text-green-800"
        };
      case 'my-surveys':
        return {
          icon: UserCheck,
          title: "Your Custom Surveys",
          description: "Surveys you've created and customized for your specific research needs. Manage, edit, and track usage statistics for all your custom instruments.",
          containerBg: "bg-purple-50",
          containerBorder: "border-purple-200",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
          titleColor: "text-purple-900",
          textColor: "text-purple-800"
        };
      case 'favorites':
        return {
          icon: Heart,
          title: "Your Favorite Surveys",
          description: "Quick access to the surveys you use most frequently. Build your personal collection of go-to research instruments.",
          containerBg: "bg-pink-50",
          containerBorder: "border-pink-200",
          iconBg: "bg-pink-100",
          iconColor: "text-pink-600",
          titleColor: "text-pink-900",
          textColor: "text-pink-800"
        };
      default:
        return null;
    }
  };

  const info = getDescriptionInfo(section);
  if (!info) return null;

  const { icon: Icon, title, description, containerBg, containerBorder, iconBg, iconColor, titleColor, textColor } = info;
  
  return (
    <div className={`${containerBg} border ${containerBorder} rounded-xl p-5 mb-8`}>
      <div className="flex items-start space-x-4">
        <div className={`${iconBg} rounded-lg p-2 flex-shrink-0`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className={`font-semibold ${titleColor} mb-2`}>{title}</h3>
          <p className={`${textColor} leading-relaxed`}>{description}</p>
        </div>
      </div>
    </div>
  );
};

// Component: Main Content
interface MainContentProps {
  surveys: SurveyWithResearcher[];
  filters: FilterState;
  surveyStats: Record<string, { usage_count: number; last_used: string }>;
  surveyVisibility: Record<string, SurveyVisibilityInfo>;
  favorites: Set<string>;
  isLoggedIn: boolean;
  currentSection: SurveySection;
  onCreateLink: (surveyId: string) => void;
  onManage: (survey: SurveyWithResearcher) => void;
  onToggleFavorite: (surveyId: string) => void;
  onViewDetails: (survey: SurveyWithResearcher) => void;
  getCategory: (survey: Survey) => string;
}

const MainContent: React.FC<MainContentProps> = ({
  surveys,
  filters,
  surveyStats,
  surveyVisibility,
  favorites,
  isLoggedIn,
  currentSection,
  onCreateLink,
  onManage,
  onToggleFavorite,
  onViewDetails,
  getCategory
}) => {
  if (surveys.length === 0) {
    return <EmptyState section={currentSection} hasFilters={!!filters.search || filters.category !== 'all'} />;
  }

  return (
    <div className="space-y-4">
      {surveys.map((survey) => (
        <SurveyListItem
          key={survey.id}
          survey={survey}
          category={getCategory(survey)}
          stats={surveyStats[survey.id]}
          visibility={surveyVisibility[survey.id]}
          isFavorited={favorites.has(survey.id)}
          isLoggedIn={isLoggedIn}
          currentSection={currentSection}
          onCreateLink={() => onCreateLink(survey.id)}
          onManage={() => onManage(survey)}
          onToggleFavorite={() => onToggleFavorite(survey.id)}
          onViewDetails={() => onViewDetails(survey)}
        />
      ))}
    </div>
  );
};

// Component: Empty State
interface EmptyStateProps {
  section: SurveySection;
  hasFilters: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ section, hasFilters }) => {
  const getEmptyStateContent = () => {
    if (hasFilters) {
      return {
        icon: Search,
        title: "No surveys match your search",
        description: "Try adjusting your search terms or filters to find what you're looking for.",
        action: null
      };
    }

    switch (section) {
      case 'my-surveys':
        return {
          icon: Plus,
          title: "Create your first custom survey",
          description: "Build personalized research instruments tailored to your specific needs.",
          action: "Create Survey"
        };
      case 'favorites':
        return {
          icon: Heart,
          title: "No favorite surveys yet",
          description: "Bookmark surveys you use frequently for quick access.",
          action: null
        };
      default:
        return {
          icon: BookOpen,
          title: "No surveys available",
          description: "We're working on adding more surveys to this section.",
          action: null
        };
    }
  };

  const { icon: Icon, title, description, action } = getEmptyStateContent();

  return (
    <div className="text-center py-16">
      <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      {action && (
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          {action}
        </button>
      )}
    </div>
  );
};

// Enhanced Survey Card Components
interface SurveyCardProps {
  survey: SurveyWithResearcher;
  category: string;
  stats?: { usage_count: number; last_used: string };
  visibility?: SurveyVisibilityInfo;
  isFavorited: boolean;
  isLoggedIn: boolean;
  currentSection: SurveySection;
  onCreateLink: () => void;
  onManage: () => void;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
}

const SurveyListItem: React.FC<SurveyCardProps> = ({
  survey,
  category,
  stats,
  visibility,
  isFavorited,
  isLoggedIn,
  currentSection,
  onCreateLink,
  onManage,
  onToggleFavorite,
  onViewDetails
}) => {
  const questionCount = survey.schema.questions.length;
  const scoringRuleCount = Object.keys(survey.schema.scoring_rules).length;
  const metadata = survey.schema.metadata || {};

  const getCategoryColors = (category: string) => {
    switch (category) {
      case 'Mental Health': return {
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        icon: 'text-rose-600'
      };
      case 'Personality': return {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: 'text-purple-600'
      };
      case 'Well-being': return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: 'text-green-600'
      };
      case 'Cognitive': return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: 'text-blue-600'
      };
      case 'Medical': return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: 'text-orange-600'
      };
      default: return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: 'text-gray-600'
      };
    }
  };

  const colors = getCategoryColors(category);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/30 shadow-md hover:shadow-lg transition-all duration-200">
      {/* Main Survey Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Left side - Survey info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {survey.title}
                  </h3>
                  
                  {isLoggedIn && (
                    <button
                      onClick={onToggleFavorite}
                      className={`p-2 rounded-lg transition-colors ${
                        isFavorited 
                          ? 'text-pink-600 bg-pink-100 hover:bg-pink-200' 
                          : 'text-gray-400 hover:text-pink-600 hover:bg-pink-50'
                      }`}
                    >
                      {isFavorited ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                    {category}
                  </span>
                  
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${
                    survey.is_official 
                      ? 'bg-blue-100 text-blue-700' 
                      : survey.is_public 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {survey.is_official ? <ShieldCheck className="h-3 w-3" /> : 
                     survey.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    <span>{survey.is_official ? 'Official' : survey.is_public ? 'Public' : 'Private'}</span>
                  </span>
                  
                  {metadata.validated && (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Validated
                    </span>
                  )}
                  
                  {stats && stats.usage_count > 0 && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      {stats.usage_count} responses
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 leading-relaxed">{survey.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
              <span className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{questionCount} questions</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calculator className="h-4 w-4" />
                <span>{scoringRuleCount} scores</span>
              </span>
              <span className="flex items-center space-x-1">
                <Timer className="h-4 w-4" />
                <span>{metadata.administration_time || `~${Math.ceil(questionCount * 0.5)} min`}</span>
              </span>
              {metadata.population && (
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{metadata.population}</span>
                </span>
              )}
            </div>

            {/* Survey metadata */}
            <div className="text-sm text-gray-500 mb-4">
              <div className="flex items-center justify-between">
                <span>Source: {survey.source}</span>
                <span>Version {survey.version} • Added {new Date(survey.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex-shrink-0 space-y-2 ml-6 grid">
            <button
              onClick={onViewDetails}
              className="block text-center px-4 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all duration-200 text-sm"
            >
              <ExternalLink className="h-4 w-4 inline mr-1" />
              View Details
            </button>

            <a
              href={`/survey/demo-${survey.id}`}
              className="block text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 text-sm"
            >
              <Eye className="h-4 w-4 inline mr-1" />
              Preview
            </a>
            
            {isLoggedIn && (
              <button
                onClick={onCreateLink}
                className="block text-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Create
              </button>
            )}
            
            {visibility?.can_edit && (
              <button
                onClick={onManage}
                className="block text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 text-sm"
              >
                <Edit className="h-4 w-4 inline mr-1" />
                Manage
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Modals
interface ModalsProps {
  showCreateModal: boolean;
  showCreateLinkModal: boolean;
  showManagementModal: boolean;
  selectedSurveyForLink: string | null;
  selectedSurveyForManagement: SurveyWithResearcher | null;
  onCloseCreateModal: () => void;
  onCloseCreateLinkModal: () => void;
  onCloseManagementModal: () => void;
  onSurveyCreated: () => void;
  onSurveyLinkCreated: () => void;
  onSurveyUpdated: () => void;
}

const Modals: React.FC<ModalsProps> = ({
  showCreateModal,
  showCreateLinkModal,
  showManagementModal,
  selectedSurveyForLink,
  selectedSurveyForManagement,
  onCloseCreateModal,
  onCloseCreateLinkModal,
  onCloseManagementModal,
  onSurveyCreated,
  onSurveyLinkCreated,
  onSurveyUpdated
}) => (
  <>
    {showCreateModal && (
      <CreateSurveyModal
        onClose={onCloseCreateModal}
        onSuccess={onSurveyCreated}
      />
    )}

    {showCreateLinkModal && selectedSurveyForLink && (
      <CreateSurveyLinkModal
        preSelectedSurveyId={selectedSurveyForLink}
        onClose={onCloseCreateLinkModal}
        onSuccess={onSurveyLinkCreated}
      />
    )}

    {showManagementModal && selectedSurveyForManagement && (
      <SurveyManagementModal
        survey={selectedSurveyForManagement}
        onClose={onCloseManagementModal}
        onSuccess={onSurveyUpdated}
      />
    )}
  </>
);

// Component: Survey Details Modal
interface SurveyDetailsModalProps {
  survey: SurveyWithResearcher | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateLink?: () => void;
  isLoggedIn: boolean;
  stats?: { usage_count: number; last_used: string };
}

const SurveyDetailsModal: React.FC<SurveyDetailsModalProps> = ({ 
  survey, 
  isOpen, 
  onClose, 
  onCreateLink,
  isLoggedIn,
  stats 
}) => {
  if (!isOpen || !survey) return null;

  const questionCount = survey.schema.questions.length;
  const scoringRuleCount = Object.keys(survey.schema.scoring_rules).length;
  const metadata = survey.schema.metadata || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Modal Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{survey.title}</h3>
                <p className="text-gray-600 mt-2">{survey.description}</p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="bg-gray-50/50 px-6 py-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Survey Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-blue-600" />
                    Survey Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">{questionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scoring Rules:</span>
                      <span className="font-medium">{scoringRuleCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Time:</span>
                      <span className="font-medium">{metadata.administration_time || `~${Math.ceil(questionCount * 0.5)} minutes`}</span>
                    </div>
                    {metadata.license && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">License:</span>
                        <span className="font-medium">{metadata.license}</span>
                      </div>
                    )}
                  </div>
                </div>

                {stats && stats.usage_count > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                      Your Usage Statistics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Responses:</span>
                        <span className="font-medium text-purple-600">{stats.usage_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Used:</span>
                        <span className="font-medium">{new Date(stats.last_used).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions Section */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                    Survey Questions ({questionCount})
                  </h4>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-4">
                    {survey.schema.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0">
                            Q{index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium mb-2">{question.text}</p>
                            
                            {question.timeframe && (
                              <div className="mb-2">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {question.timeframe}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="bg-white border border-gray-200 px-2 py-1 rounded">
                                {question.type}
                              </span>
                              
                              {question.reverse_score && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Reverse Scored
                                </span>
                              )}
                              
                              {question.subscale && (
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {question.subscale}
                                </span>
                              )}
                              
                              {question.dimension && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {question.dimension}
                                </span>
                              )}
                              
                              {question.options && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {question.options.length} options
                                </span>
                              )}
                            </div>
                            
                            {question.options && question.options.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Response Options:</p>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  {question.options.map((option, optIndex) => (
                                    <div key={optIndex} className="bg-white px-2 py-1 rounded border text-gray-700">
                                      {typeof option === 'object' ? `${option.value}: ${option.label}` : option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scoring Section */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-green-600" />
                    Scoring & Grading Rules ({scoringRuleCount})
                  </h4>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {Object.entries(survey.schema.scoring_rules).map(([ruleName, rule]) => (
                      <div key={ruleName} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 capitalize">
                            {ruleName.replace(/_/g, ' ')}
                          </span>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="bg-white border border-gray-200 px-2 py-1 rounded text-xs font-medium">
                                {rule.type}
                              </span>
                              
                              {rule.questions && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                  {rule.questions.length} questions
                                </span>
                              )}
                              
                              {rule.formula && (
                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                                  Custom Formula
                                </span>
                              )}
                            </div>
                            
                            {rule.description && (
                              <p className="text-sm text-gray-700 mb-3">{rule.description}</p>
                            )}
                            
                            {rule.formula && (
                              <div className="mb-3 p-3 bg-white rounded border">
                                <p className="text-xs text-gray-500 mb-1">Formula:</p>
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">
                                  {rule.formula}
                                </code>
                              </div>
                            )}
                            
                            {rule.questions && rule.questions.length > 0 && (
                              <div className="mb-3 p-3 bg-white rounded border">
                                <p className="text-xs text-gray-500 mb-2">Questions included:</p>
                                <div className="flex flex-wrap gap-1">
                                  {rule.questions.map((qId, index) => (
                                    <span key={index} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                                      Q{survey.schema.questions.findIndex(q => q.id === qId) + 1}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Psychometric Properties */}
              {metadata.psychometric_properties && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-yellow-600" />
                      Psychometric Properties
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {metadata.psychometric_properties.reliability && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Reliability</h5>
                          <div className="space-y-1 text-sm">
                            {metadata.psychometric_properties.reliability.cronbach_alpha && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cronbach's α:</span>
                                <span className="font-medium">{metadata.psychometric_properties.reliability.cronbach_alpha}</span>
                              </div>
                            )}
                            {metadata.psychometric_properties.reliability.test_retest && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Test-retest:</span>
                                <span className="font-medium">{metadata.psychometric_properties.reliability.test_retest}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {metadata.psychometric_properties.validity && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Validity</h5>
                          <p className="text-sm text-gray-600">{metadata.psychometric_properties.validity}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
            <a
              href={`/survey/demo-${survey.id}`}
              className="px-4 py-2 bg-white border border-indigo-600 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Eye className="h-4 w-4 inline mr-1" />
              Preview
            </a>
            {isLoggedIn && onCreateLink && (
              <button
                onClick={onCreateLink}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Create
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};