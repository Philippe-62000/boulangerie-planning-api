import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearStoredTokens } from '../config/apiConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const savedUser = localStorage.getItem('userRole');
    console.log('🔐 Vérification utilisateur sauvegardé:', savedUser);
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ Utilisateur récupéré:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Erreur lors du parsing des données utilisateur:', error);
        localStorage.removeItem('userRole');
      }
    } else {
      console.log('⚠️ Aucun utilisateur sauvegardé');
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    console.log('🔐 Connexion utilisateur:', userData);
    setUser(userData);
    localStorage.setItem('userRole', JSON.stringify(userData));
    console.log('✅ Utilisateur connecté et sauvegardé');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userRole');
    clearStoredTokens();
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isEmployee = () => {
    return user && user.role === 'employee';
  };

  const value = {
    user,
    login,
    logout,
    hasPermission,
    isAdmin,
    isEmployee,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
