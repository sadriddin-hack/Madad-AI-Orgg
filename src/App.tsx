/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import Navbar from "@/src/components/layout/Navbar";
import PromotionalAd from "@/src/components/PromotionalAd";
import Home from "@/src/pages/Home";
import AIChat from "@/src/pages/AIChat";
import Doctors from "@/src/pages/Doctors";
import TelegramBot from "@/src/pages/TelegramBot";
import SMSInbox from "@/src/pages/SMSInbox";
import Login from "@/src/pages/Auth/Login";
import Register from "@/src/pages/Auth/Register";
import Admin from "@/src/pages/Admin";
import DoctorDashboard from "@/src/pages/doctor/Dashboard";
import api from "@/src/lib/api";
import { io } from "socket.io-client";

type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("madad_token");
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem("madad_token");
          localStorage.removeItem("madad_user");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user || user.role !== "PATIENT") return;

    const socket = io();
    socket.emit("join", { userId: user.id, role: user.role });

    socket.on("patient_summoned", (data) => {
      if (data.patientId === user.id) {
        toast.custom((t) => (
          <div className="bg-zinc-900 border-2 border-medical-green text-white p-5 rounded-2xl shadow-2xl flex flex-col gap-2 max-w-sm pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-medical-green rounded-full animate-ping" />
              <p className="font-black text-xs text-medical-green uppercase tracking-widest">
                🔔 ДАЪВАТИ ДУХТУР (СМС ХАБАРНОМА)
              </p>
            </div>
            <p className="text-zinc-200 text-sm font-bold leading-relaxed">
              {data.message}
            </p>
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1 border-t border-white/5 pt-2">
              <span>СҲ: {data.time}</span>
              <span>РӮЗ: {data.date}</span>
            </div>
          </div>
        ), {
          duration: 20000,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("madad_token");
    localStorage.removeItem("madad_user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-medical-dark flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-medical-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-medical-dark">
        <PromotionalAd />
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={user ? <AIChat /> : <Navigate to="/login" />} />
            <Route path="/doctors" element={<Doctors user={user} />} />
            <Route path="/telegram" element={<TelegramBot />} />
            <Route path="/sms" element={<SMSInbox user={user} />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register onRegister={setUser} />} />
            
            {/* Doctor Dashboard */}
            <Route 
              path="/doctor/dashboard" 
              element={
                user?.role === "DOCTOR" ? <DoctorDashboard /> : <Navigate to="/login" />
              } 
            />

            {/* Admin Dashboard */}
            <Route 
              path="/admin" 
              element={
                user?.role === "ADMIN" ? <Admin /> : <Navigate to="/login" />
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="py-8 border-t border-white/10 text-center text-sm text-white font-black bg-black/20">
          <div className="container mx-auto px-4">
            <p className="font-black text-white">© 2026 MADAD AI - Кумаки оқилонаи тиббӣ</p>
            <p className="mt-2 text-white font-bold opacity-80">Лоиҳаи инноватсионии тиббии ЗОКИРОВ САДРИДДИН</p>
          </div>
        </footer>

        <Toaster position="top-right" expand={false} richColors theme="dark" />
      </div>
    </Router>
  );
}

