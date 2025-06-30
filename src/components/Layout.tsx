import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { BarChart3, LogOut, User, Crown } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, researcher, signOut } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SurveyStack
              </span>
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <Link
                  to="/surveys"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  Survey Library
                </Link>
                
                {/* Subscription Status */}
                {!subscriptionLoading && subscription && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                    <Crown className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">
                      {subscription.subscription_status === 'active' ? 'Pro Plan' : 
                       subscription.subscription_status === 'trialing' ? 'Trial' :
                       subscription.subscription_status === 'not_started' ? 'Free Plan' :
                       'Inactive'}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{researcher?.name || user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/signin"
                  className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};