import React, { useState, useEffect, useCallback } from 'react';
// Fix: Correctly import the AdminPage component now that the file has content.
import AdminPage from './pages/AdminPage';
import PegawaiPage from './pages/PegawaiPage';
import LoginPage from './pages/LoginPage';
import { UserProfile, UserRole } from './types';
import { apiService } from './services/apiService';
import { Logo } from './components/Logo';
import { supabase } from './services/supabase';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSessionAndSetUser = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        const userProfile = await apiService.getUserProfileById(session.user.id);

        if (userProfile) {
          setUser(userProfile);
        } else {
          // User has a session but no profile, force logout.
          await apiService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("App: CRITICAL - Error during session check:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Run the check on initial component mount.
    checkSessionAndSetUser();

    // Set up a listener for subsequent auth changes (e.g., login/logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // When user logs in or out, re-run the session check.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        checkSessionAndSetUser();
      }
    });

    // Cleanup the subscription on component unmount.
    return () => {
      subscription.unsubscribe();
    };
  }, [checkSessionAndSetUser]);


  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    // The onAuthStateChange listener will also fire and handle setting the user,
    // but we can set it here for a faster UI update after login.
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await apiService.logout();
    // The onAuthStateChange listener will handle setting the user to null.
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
            <Logo variant="login" className="mb-8 animate-pulse" />
            <p className="text-slate-600 font-semibold">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  
  // Route to the correct page based on user role
  if (user.role === UserRole.SuperAdmin || user.role === UserRole.Admin || user.role === UserRole.Manager) {
      return <AdminPage user={user} onLogout={handleLogout} />;
  } else {
      return <PegawaiPage user={user} onLogout={handleLogout} />;
  }
}

export default App;