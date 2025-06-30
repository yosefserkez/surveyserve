import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Globe, 
  Download, 
  Brain,
  Clock,
  DollarSign,
  Gift,
  Star,
  TrendingUp,
  Lock,
  Settings,
  Smartphone
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, researcher } = useAuth();

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Deploy Validated Surveys with
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Real-Time Scoring
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            SurveyServe empowers researchers with a comprehensive platform for deploying
            validated psychological and behavioral surveys with automatic scoring and instant results.
            Start with free surveys or pay per premium instrument.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Go to Dashboard</span>
                </Link>
                <Link
                  to="/surveys"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
                >
                  Browse Survey Library
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/surveys"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
                >
                  View Survey Library
                </Link>
              </>
            )}
          </div>
          {!user && (
            <p className="text-sm text-gray-500 mt-4">
              Free account • No credit card required • Start deploying surveys instantly
            </p>
          )}
        </div>
      </section>

      {/* Pricing Overview Bar */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200">
        <div className="text-center">
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-lg p-3">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Free Surveys Available</p>
                <p className="text-sm text-gray-600">Start with validated instruments at no cost</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Pay-Per-Survey</p>
                <p className="text-sm text-gray-600">Premium instruments for a fee</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Instant Results</p>
                <p className="text-sm text-gray-600">Real-time scoring and analytics included</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Professional Research
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From validated instruments to real-time analytics, SurveyServe provides the complete toolkit for modern research.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-indigo-100 rounded-lg p-3 w-fit mb-6">
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Validated Survey Library</h3>
            <p className="text-gray-600 mb-4">
              Access professionally validated instruments including PHQ-9, GAD-7, Big Five, and more. 
              Each survey comes with peer-reviewed scoring algorithms and clinical interpretations.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>50+ validated instruments</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free and premium options</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Research-grade reliability</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-purple-100 rounded-lg p-3 w-fit mb-6">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-Time Scoring Engine</h3>
            <p className="text-gray-600 mb-4">
              Responses are automatically scored using validated algorithms with support for 
              reverse scoring, subscales, clinical thresholds, and normative comparisons.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Instant score computation</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Clinical threshold alerts</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Subscale analysis</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-green-100 rounded-lg p-3 w-fit mb-6">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Research Ethics & Security</h3>
            <p className="text-gray-600 mb-4">
              Built with research ethics in mind. Support for anonymous responses, 
              informed consent management, and secure data handling with HIPAA compliance.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Anonymous data collection</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>IRB-ready consent forms</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Secure data encryption</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-blue-100 rounded-lg p-3 w-fit mb-6">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Mobile-First Design</h3>
            <p className="text-gray-600 mb-4">
              Surveys are fully responsive and optimized for mobile devices with touch-friendly 
              interfaces, ensuring high completion rates across all platforms and populations.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Mobile-optimized layouts</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Touch-friendly interactions</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Accessibility compliant</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-yellow-100 rounded-lg p-3 w-fit mb-6">
              <BarChart3 className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Live Analytics Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Monitor response rates, view summary statistics, track data collection 
              progress, and analyze results in real-time through your researcher dashboard.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Real-time monitoring</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Descriptive statistics</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Response tracking</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-red-100 rounded-lg p-3 w-fit mb-6">
              <Download className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Flexible Data Export</h3>
            <p className="text-gray-600 mb-4">
              Export your data in multiple formats including CSV, JSON, and SPSS. 
              Get both raw responses and computed scores for comprehensive statistical analysis.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Multiple export formats</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Raw + computed data</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Statistical software ready</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How SurveyServe Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Deploy validated surveys in minutes with our streamlined research workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-6 w-fit mx-auto mb-4">
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Choose Survey</h3>
            <p className="text-gray-600">
              Browse our library of validated instruments and select the perfect survey for your research needs.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Settings className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Configure</h3>
            <p className="text-gray-600">
              Customize settings like anonymity, consent forms, password protection, and result sharing preferences.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Collect</h3>
            <p className="text-gray-600">
              Share your survey link and watch responses pour in. Participants get instant, personalized results.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-6 w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Analyze</h3>
            <p className="text-gray-600">
              Export your data with computed scores and analyze results using your preferred statistical software.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Details Section */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No subscriptions, no hidden fees. Pay only for the premium surveys you use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="text-center mb-6">
              <div className="bg-green-100 rounded-full p-4 w-fit mx-auto mb-4">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Surveys</h3>
              <p className="text-4xl font-bold text-green-600 mb-4">$0</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Basic validated instruments</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Real-time scoring</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Data export (CSV/JSON)</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Basic analytics</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Unlimited responses</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 text-center">
              Perfect for getting started with validated research instruments
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                Popular Choice
              </span>
            </div>
            <div className="text-center mb-6">
              <div className="bg-indigo-100 rounded-full p-4 w-fit mx-auto mb-4">
                <Star className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Surveys</h3>
              <p className="text-4xl font-bold text-indigo-600 mb-4">Pay per use</p>
              {/* <p className="text-sm text-gray-600">Pay per survey deployment</p> */}
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">All free features included</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Premium validated instruments</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Advanced scoring algorithms</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Clinical interpretations</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">SPSS-ready exports</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 text-center">
              Access to specialized instruments like MMPI-2, Beck inventories, and more
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            <strong>What's included with every survey:</strong> Unlimited responses, real-time analytics, 
            secure data storage, mobile optimization, and full data export capabilities.
          </p>
          <p className="text-sm text-gray-500">
            Pricing varies by instrument based on licensing costs. View exact prices in our survey library.
          </p>
        </div>
      </section>

      {/* Testimonials/Trust Section */}
      {/* <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Researchers Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of researchers, clinicians, and educators using SurveyServe for their data collection needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">50,000+</div>
            <p className="text-gray-600">Survey responses collected</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
            <p className="text-gray-600">Active researchers</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
            <p className="text-gray-600">Validated instruments</p>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-16 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Research?</h2>
        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
          Join researchers worldwide who trust SurveyServe for their data collection needs.
          {user ? ' Access your dashboard to deploy your next survey.' : ' Create your free account and start deploying surveys instantly.'}
        </p>
        {user ? (
          <Link
            to="/dashboard"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Open Dashboard</span>
          </Link>
        ) : (
          <Link
            to="/signup"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}
      </section>
    </div>
  );
};