import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.js";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, try to restore the session using the httpOnly cookie
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        setUser(data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("medimart_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    localStorage.setItem("medimart_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // ignore network errors on logout
    }
    localStorage.removeItem("medimart_token");
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, isAdmin: user?.role === "admin", isPharmacist: user?.role === "pharmacist" }}
    >
      {children}
    </AuthContext.Provider>
  );
};
