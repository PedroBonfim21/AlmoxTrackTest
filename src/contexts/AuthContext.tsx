"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Importe a sua instância de auth

// Define o tipo de dados que o contexto irá fornecer
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Cria o Provedor do contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpa o listener ao desmontar
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Cria um hook customizado para usar o contexto facilmente
export function useAuth() {
  return useContext(AuthContext);
}