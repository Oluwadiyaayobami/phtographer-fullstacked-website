import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import About from '../components/About';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') navigate('/admin-dashboard');
      else navigate('/user-dashboard');
    }
  }, [user, loading, navigate]);

  // Only show Home content if no user is logged in
  if (loading || user) return null;

  return (
    <div>
      <Hero />
      <About />
      <Gallery />
      <Contact />
    </div>
  );
};

export default Home;
