import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Shield, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { PricingSection } from './Pricing/PricingSection';

export const Home: React.FC = () => {
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
            SurveyStack empowers researchers with a comprehensive platform for deploying
            validated psychological and behavioral surveys with automatic scoring and instant results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/surveys"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
            >
              View Survey Library
            </Link>
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
            From validated instruments to real-time analytics, SurveyStack provides the complete toolkit for modern research.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-indigo-100 rounded-lg p-3 w-fit mb-6">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Validated Survey Library</h3>
            <p className="text-gray-600 mb-4">
              Access professionally validated instruments including PHQ-9, GAD-7, Big Five, and more. 
              Each survey comes with peer-reviewed scoring algorithms.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Peer-reviewed instruments</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Automated scoring rules</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-purple-100 rounded-lg p-3 w-fit mb-6">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-Time Scoring Engine</h3>
            <p className="text-gray-600 mb-4">
              Responses are automatically scored using validated algorithms with support for 
              reverse scoring, subscales, and clinical thresholds.
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
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-green-100 rounded-lg p-3 w-fit mb-6">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Compliant</h3>
            <p className="text-gray-600 mb-4">
              Built with research ethics in mind. Support for anonymous responses, 
              consent management, and secure data handling.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Anonymous data collection</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Consent management</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-blue-100 rounded-lg p-3 w-fit mb-6">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Mobile-Optimized</h3>
            <p className="text-gray-600 mb-4">
              Surveys are fully responsive and optimized for mobile devices, 
              ensuring high completion rates across all platforms.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Responsive design</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Touch-friendly interface</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-yellow-100 rounded-lg p-3 w-fit mb-6">
              <BarChart3 className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Live Analytics</h3>
            <p className="text-gray-600 mb-4">
              Monitor response rates, view summary statistics, and track data collection 
              progress in real-time through your researcher dashboard.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Real-time monitoring</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Summary statistics</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
            <div className="bg-red-100 rounded-lg p-3 w-fit mb-6">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Export</h3>
            <p className="text-gray-600 mb-4">
              Export your data in multiple formats including CSV and JSON. 
              Get both raw responses and computed scores for comprehensive analysis.
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
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-16 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Research?</h2>
        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
          Join researchers worldwide who trust SurveyStack for their data collection needs.
          Start your free trial today and experience the future of survey research.
        </p>
        <Link
          to="/signup"
          className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <span>Get Started Free</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
};