
import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-rgukt-blue text-white mt-10">
      <div className="container py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">Contact Us</h3>
            <p className="mb-2">RGUKT Srikakulam</p>
            <p className="mb-2">SM Puram, Etcherla</p>
            <p className="mb-2">Srikakulam, Andhra Pradesh</p>
            <p className="mb-2">Email: messoffice@rguktsklm.ac.in</p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-rgukt-gold">Home</Link></li>
              <li><Link to="/complaints" className="hover:text-rgukt-gold">Complaints</Link></li>
              <li><Link to="/polls" className="hover:text-rgukt-gold">Polls & Feedback</Link></li>
              <li><Link to="/login" className="hover:text-rgukt-gold">Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">Connect With Us</h3>
            <p className="mb-2">Stay updated with RGUKT Srikakulam Mess Office updates</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-rgukt-gold" aria-label="Facebook">
                Facebook
              </a>
              <a href="#" className="hover:text-rgukt-gold" aria-label="Twitter">
                Twitter
              </a>
              <a href="#" className="hover:text-rgukt-gold" aria-label="Instagram">
                Instagram
              </a>
            </div>
          </div>
        </div>
        
        <Separator className="my-6 bg-white/20" />
        
        <div className="text-center">
          <p>© {new Date().getFullYear()} RGUKT Srikakulam Mess Office. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
