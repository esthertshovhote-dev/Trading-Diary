import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import { Auth } from './components/Auth';
import { auth, onAuthStateChanged, User } from './firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0A0B0E] flex items-center justify-center dark">
        <div className="w-10 h-10 border-4 border-bento-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dark">
      {user && user.emailVerified ? <Dashboard /> : <Auth />}
    </div>
  );
}
