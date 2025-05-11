
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, User } from "lucide-react";
import { Menu, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLoginClick = () => {
    navigate('/login');
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    await signOut();
    navigate('/');
    if (isMenuOpen) setIsMenuOpen(false);
  };

  return (
    <header className="w-full">
      {/* Top header with logos and title */}
      <div className="bg-rgukt-blue text-white py-3">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="/placeholder.svg" 
              alt="RGUKT Logo" 
              className="h-16 w-16 object-contain"
            />
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-bold">
                RGUKT Srikakulam
              </h1>
              <h2 className="text-lg md:text-xl">
                Mess Office Portal
              </h2>
            </div>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:block text-right">
                  <span className="text-sm block">{user.email}</span>
                  <span className="text-xs bg-rgukt-gold px-2 py-0.5 rounded-full">
                    {userRole === 'admin' ? 'Admin' : 'Visitor'}
                  </span>
                </div>
                <Button variant="outline" className="bg-white text-rgukt-blue hover:bg-gray-100" onClick={handleLogoutClick}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="bg-white text-rgukt-blue hover:bg-gray-100" onClick={handleLoginClick}>
                <User className="h-4 w-4 mr-2" /> Login
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* News ticker */}
      <div className="bg-rgukt-gold py-2">
        <div className="container">
          <div className="news-ticker-container">
            <div className="news-ticker">
              Welcome to RGUKT Srikakulam Mess Office Portal - Latest updates and notifications will appear here
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container">
          <div className="flex justify-between items-center py-3">
            {isMobile ? (
              <>
                <button 
                  onClick={toggleMenu} 
                  className="text-rgukt-blue p-2"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                
                <div 
                  className={cn(
                    "fixed inset-0 z-50 bg-white pt-16 transition-transform duration-300 ease-in-out",
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                  )}
                >
                  <div className="container flex flex-col gap-4">
                    <Link 
                      to="/" 
                      className="text-rgukt-blue text-lg font-medium hover:text-rgukt-lightblue py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Separator />
                    <Link 
                      to="/complaints" 
                      className="text-rgukt-blue text-lg font-medium hover:text-rgukt-lightblue py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Complaints
                    </Link>
                    <Separator />
                    <Link 
                      to="/polls" 
                      className="text-rgukt-blue text-lg font-medium hover:text-rgukt-lightblue py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Polls & Feedback
                    </Link>
                    <Separator />
                    <button 
                      className="absolute top-4 right-4"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <X size={24} className="text-rgukt-blue" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex space-x-8">
                <Link to="/" className="text-rgukt-blue font-medium hover:text-rgukt-lightblue">
                  Home
                </Link>
                <Link to="/complaints" className="text-rgukt-blue font-medium hover:text-rgukt-lightblue">
                  Complaints
                </Link>
                <Link to="/polls" className="text-rgukt-blue font-medium hover:text-rgukt-lightblue">
                  Polls & Feedback
                </Link>
                {userRole === 'admin' && (
                  <Link to="/admin" className="text-rgukt-gold font-medium hover:text-rgukt-lightblue">
                    Admin Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
