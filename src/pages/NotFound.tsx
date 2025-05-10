
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-6xl font-bold text-rgukt-blue mb-6">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button className="bg-rgukt-blue hover:bg-rgukt-lightblue">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
