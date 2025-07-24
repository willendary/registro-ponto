import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  getUserIdFromToken: () => string | null;
  getUserRolesFromToken: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwtToken'));

  useEffect(() => {
    console.log("AuthContext useEffect: token changed", token);
    if (token) {
      localStorage.setItem('jwtToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log("AuthContext: Authorization header set.");
    } else {
      localStorage.removeItem('jwtToken');
      delete axios.defaults.headers.common['Authorization'];
      console.log("AuthContext: Authorization header removed.");
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    console.log("AuthContext: Attempting login...");
    try {
      const response = await axios.post('http://localhost:5158/api/Auth/login', {
        email,
        password,
      });
      console.log("AuthContext: Full response.data from backend:", response.data);
      let newToken: string | null = null;

      // Verifica se a resposta é um objeto e tem a propriedade 'token'
      if (typeof response.data === 'object' && response.data !== null && 'token' in response.data) {
        // Se 'token' é um objeto e tem 'result', usa 'result', senão usa 'token' diretamente
        if (typeof response.data.token === 'object' && response.data.token !== null && 'result' in response.data.token) {
          newToken = String(response.data.token.result);
        } else {
          newToken = String(response.data.token);
        }
      } else if (typeof response.data === 'string') {
        // Assume que response.data já é a string do token
        newToken = response.data;
      }

      // Adiciona uma verificação final para garantir que newToken é uma string válida
      if (typeof newToken !== 'string' || newToken.length === 0) {
        console.error("AuthContext: Extracted token is not a valid string:", newToken);
        throw new Error("Token inválido recebido do servidor.");
      }

      console.log("AuthContext: Extracted token:", newToken);
      setToken(newToken);
    } catch (error: any) {
      console.error("AuthContext: Error during login:", error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Credenciais inválidas');
      } else {
        throw new Error('Erro de rede ou servidor indisponível');
      }
    }
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;

  const getUserIdFromToken = (): string | null => {
    if (typeof token !== 'string' || !token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decodedToken = JSON.parse(jsonPayload);
      return decodedToken.sub || null; // 'sub' é o Subject, que geralmente é o ID do usuário
    } catch (error) {
      console.error("Erro ao decodificar o token JWT:", error);
      return null;
    }
  };

  const getUserRolesFromToken = (): string[] => {
    if (typeof token !== 'string' || !token) return [];
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decodedToken = JSON.parse(jsonPayload);
      // Roles podem vir como string única ou array de strings
      if (decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
        const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        return Array.isArray(roles) ? roles : [roles];
      }
      return [];
    } catch (error) {
      console.error("Erro ao decodificar roles do token JWT:", error);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated, getUserIdFromToken, getUserRolesFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
