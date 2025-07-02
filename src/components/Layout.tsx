import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, LogOut, User, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, researcher, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <img src="/logo.svg" alt="SurveyServe Logo" className="h-8 w-8" />
              <span className="text-xl  bg-gradient-to-r from-[#9313f9] to-[#9313f9] bg-clip-text text-transparent">
                SurveyServe
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
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
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">{researcher?.name || user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-gray-100 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white/90 backdrop-blur-sm border-t border-gray-200">
                {user ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border-b border-gray-100 mb-2">
                      <User className="h-4 w-4" />
                      <span>{researcher?.name || user.email}</span>
                    </div>
                    
                    {/* Navigation Links */}
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/surveys"
                      onClick={closeMobileMenu}
                      className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200"
                    >
                      Survey Library
                    </Link>
                    
                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full text-left text-gray-700 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      onClick={closeMobileMenu}
                      className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={closeMobileMenu}
                      className="bg-indigo-600 text-white hover:bg-indigo-700 block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 text-center"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {/* Built by Bolt Badge */}
      <div className="fixed bottom-4 left-4 z-50">
        <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
          <img
            src="/built_by_bolt.png"
            alt="Built by Bolt"
            className="w-16 h-16 rounded-full shadow-lg border border-gray-200 bg-white"
          />
        </a>
      </div>
    </div>
  );
};