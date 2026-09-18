import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { airGuardApi } from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ModelProvider } from './context/ModelContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Pollutants from './pages/Pollutants';
import Compare from './pages/Compare';
import Advisory from './pages/Advisory';
import ModelInsights from './pages/ModelInsights';
import History from './pages/History';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { activeTheme } = useTheme();
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [cities, setCities] = useState([
    { name: 'Delhi', country: 'India' },
    { name: 'Mumbai', country: 'India' },
    { name: 'Bengaluru', country: 'India' },
    { name: 'London', country: 'United Kingdom' },
    { name: 'New York', country: 'United States' },
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      airGuardApi.getCities()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setCities(res.data);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch cities dynamically; using defaults:', err.message);
        });
    }
  }, [isAuthenticated]);

  const handleCityAdded = (newCity) => {
    if (!newCity || !newCity.name) return;
    setCities((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === newCity.name.toLowerCase());
      if (exists) return prev;
      return [newCity, ...prev];
    });
    setSelectedCity(newCity.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-brand-400">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs text-slate-400 tracking-wider uppercase font-medium">Initializing AirGuard Intelligence...</p>
      </div>
    );
  }

  // Gate the entire dashboard behind user authentication
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <div className={`min-h-screen ${activeTheme.bgClass} flex flex-col selection:bg-brand-500 selection:text-slate-950 transition-colors duration-300`}>
        <Navbar
          selectedCity={selectedCity}
          onSelectCity={setSelectedCity}
          cities={cities}
          onCityAdded={handleCityAdded}
        />
        
        {/* Main Content with bottom padding on mobile to clear bottom nav */}
        <main className="flex-1 pb-20 md:pb-0">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  selectedCity={selectedCity}
                  onSelectCity={setSelectedCity}
                  cities={cities}
                />
              }
            />
            <Route
              path="/forecast"
              element={
                <Forecast
                  selectedCity={selectedCity}
                  onSelectCity={setSelectedCity}
                  cities={cities}
                />
              }
            />
            <Route
              path="/pollutants"
              element={<Pollutants selectedCity={selectedCity} onSelectCity={setSelectedCity} />}
            />
            <Route
              path="/compare"
              element={<Compare cities={cities} selectedCity={selectedCity} onSelectCity={setSelectedCity} />}
            />
            <Route
              path="/advisory"
              element={
                <Advisory
                  selectedCity={selectedCity}
                  onSelectCity={setSelectedCity}
                  cities={cities}
                />
              }
            />
            <Route
              path="/models"
              element={<ModelInsights selectedCity={selectedCity} onSelectCity={setSelectedCity} />}
            />
            <Route
              path="/history"
              element={
                <History
                  selectedCity={selectedCity}
                  onSelectCity={setSelectedCity}
                />
              }
            />
          </Routes>
        </main>

        <Footer />
        
        {/* Native Mobile Bottom Navigation (Smartphones & Small Tablets) */}
        <MobileBottomNav />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ModelProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ModelProvider>
    </ThemeProvider>
  );
}

