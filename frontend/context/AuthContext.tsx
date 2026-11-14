"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginDemoUser, fetchFarms, fetchHealth, Farm, User } from "@/lib/api";

interface AuthContextType {
  farmerId: number;
  user: User | null;
  token: string;
  farms: Farm[];
  selectedFarm: Farm | null;
  isBackendOnline: boolean;
  isLoading: boolean;
  error: string | null;
  switchFarmer: (id: number) => Promise<void>;
  selectFarm: (farm: Farm) => void;
  refreshFarms: () => Promise<void>;
  checkBackend: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [farmerId, setFarmerId] = useState<number>(1);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ping backend health
  const checkBackend = useCallback(async (): Promise<boolean> => {
    try {
      const health = await fetchHealth();
      const online = health?.status === "healthy";
      setIsBackendOnline(online);
      if (online) setError(null);
      return online;
    } catch {
      setIsBackendOnline(false);
      return false;
    }
  }, []);

  const loadFarmer = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const online = await checkBackend();
      if (!online) {
        setIsBackendOnline(false);
        setError("Backend offline. Please start FastAPI server on port 8000.");
        return;
      }

      const auth = await loginDemoUser(id);
      setUser(auth.user);
      setToken(auth.access_token);
      setFarmerId(id);

      if (typeof window !== "undefined") {
        localStorage.setItem("fieldshift_farmer_id", id.toString());
      }

      const farmList = await fetchFarms(auth.access_token);
      setFarms(farmList);
      if (farmList.length > 0) {
        // Keep existing selected farm if in list, otherwise default to first
        setSelectedFarm((prev) => {
          const match = farmList.find((f) => f.id === prev?.id);
          return match || farmList[0];
        });
      } else {
        setSelectedFarm(null);
      }
      setIsBackendOnline(true);
    } catch (err: any) {
      console.error("AuthContext initialization error:", err);
      setIsBackendOnline(false);
      setError(err?.message || "Failed to connect to FieldShift backend");
    } finally {
      setIsLoading(false);
    }
  }, [checkBackend]);

  const switchFarmer = async (id: number) => {
    await loadFarmer(id);
  };

  const selectFarm = (farm: Farm) => {
    setSelectedFarm(farm);
  };

  const refreshFarms = async () => {
    if (!token) return;
    try {
      const farmList = await fetchFarms(token);
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarm) {
        setSelectedFarm(farmList[0]);
      }
    } catch (err) {
      console.error("Failed to refresh farms:", err);
    }
  };

  useEffect(() => {
    let savedId = 1;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fieldshift_farmer_id");
      if (stored) savedId = parseInt(stored, 10) || 1;
    }
    loadFarmer(savedId);

    // Periodic health check every 25 seconds
    const interval = setInterval(checkBackend, 25000);
    return () => clearInterval(interval);
  }, [loadFarmer, checkBackend]);

  return (
    <AuthContext.Provider
      value={{
        farmerId,
        user,
        token,
        farms,
        selectedFarm,
        isBackendOnline,
        isLoading,
        error,
        switchFarmer,
        selectFarm,
        refreshFarms,
        checkBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
