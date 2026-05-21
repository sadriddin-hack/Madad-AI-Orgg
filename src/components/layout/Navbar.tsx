import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Stethoscope, User, LogOut, HeartPulse, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: "Асосӣ", path: "/" },
    { name: "Ёвари сунъӣ", path: "/chat" },
    { name: "Духтурон", path: "/doctors" },
    { name: "СМС-Паёмҳо", path: "/sms" },
    { name: "Телеграм Бот", path: "/telegram" },
    { name: "Инстаграми мо", path: "https://www.instagram.com/madad_ai_tj?igsh=MW82aG42bDk0bjc0bA%3D%3D&utm_source=qr", external: true },
  ];

  const handleLogout = () => {
    onLogout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <nav className="z-50 py-3 px-4 sm:px-6">
      <div className="container mx-auto flex flex-col items-center gap-4">
        <div className="flex w-full justify-between items-center md:justify-center">
          <div className="flex items-center gap-2 sm:gap-6 bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[4rem] p-1.5 sm:p-2 hover:border-medical-green/20 transition-all duration-500 shadow-2xl backdrop-blur-3xl">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group px-3 sm:px-5 shrink-0 transition-transform hover:scale-[1.02] active:scale-95">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-medical-green/10 blur-md rounded-full group-hover:bg-medical-green/30 transition-all duration-700" />
                <img 
                  src="/src/assets/images/madad_ai_logo_1779016666737.png" 
                  alt="MADAD AI" 
                  className="w-5 h-5 sm:w-8 sm:h-8 object-contain relative z-10 group-hover:rotate-6 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[8px] sm:text-base font-black tracking-tighter text-white leading-none uppercase italic">
                  MADAD <span className="text-medical-green not-italic">AI</span>
                </h1>
                <div className="flex items-center gap-1 mt-0.5 border-t border-white/5 pt-0.5">
                  <span className="text-[4px] sm:text-[6px] font-black text-medical-green/80 uppercase tracking-widest whitespace-nowrap">
                    Medical Intelligence
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Menu - Integrated fixed width items */}
            <div className="hidden md:flex items-center gap-0.5 pr-2">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.name}
                    href={item.path}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-white transition-all font-black text-[7px] lg:text-[8px] uppercase tracking-widest px-2.5 py-1.5 hover:bg-white/5 rounded-full border border-transparent hover:border-white/10 whitespace-nowrap"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="text-gray-400 hover:text-white transition-all font-black text-[7px] lg:text-[8px] uppercase tracking-widest px-2.5 py-1.5 hover:bg-white/5 rounded-full border border-transparent hover:border-white/10 whitespace-nowrap"
                  >
                    {item.name}
                  </Link>
                )
              ))}
              {user ? (
                <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/10">
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className="text-[6px] font-black text-medical-green border border-medical-green/40 px-2 py-0.5 rounded-md hover:bg-medical-green hover:text-black transition-all uppercase tracking-widest">
                      ADMIN
                    </Link>
                  )}
                  {user.role === 'DOCTOR' && (
                    <Link to="/doctor/dashboard" className="text-[6px] font-black text-blue-500 border border-blue-500/40 px-2 py-0.5 rounded-md hover:bg-blue-500 hover:text-white transition-all uppercase tracking-widest">
                      DASHBOARD
                    </Link>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-medical-green">
                      <User className="w-2.5 h-2.5" />
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md transition-all border border-red-500/20"
                    >
                      <LogOut className="w-2 h-2" />
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="medical-gradient hover:scale-105 active:scale-95 text-black px-3 py-1.5 rounded-full font-black text-[6px] uppercase tracking-widest transition-all shadow-md ml-1"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-300"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="md:hidden absolute top-[100%] left-4 right-4 mt-2 glass-dark rounded-[2.5rem] py-8 px-8 flex flex-col gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 z-[60] backdrop-blur-3xl"
          >
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xl font-black text-gray-400 hover:text-white py-4 border-b border-white/5 uppercase tracking-tighter transition-all flex items-center justify-between group"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                  <div className="w-2 h-2 rounded-full bg-medical-green opacity-0 group-hover:opacity-100 transition-all" />
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-xl font-black text-gray-400 hover:text-white py-4 border-b border-white/5 uppercase tracking-tighter transition-all flex items-center justify-between group"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                  <div className="w-2 h-2 rounded-full bg-medical-green opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              )
            ))}
            {user ? (
              <div className="mt-4 space-y-4">
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-between p-4 bg-medical-green/10 border border-medical-green/20 rounded-2xl text-medical-green font-black uppercase tracking-widest text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Admin Panel</span>
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                {user.role === 'DOCTOR' && (
                  <Link
                    to="/doctor/dashboard"
                    className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-500 font-black uppercase tracking-widest text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Doctor Dashboard</span>
                    <Stethoscope className="w-4 h-4" />
                  </Link>
                )}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-medical-green/20 flex items-center justify-center text-medical-green">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-300 truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="medical-gradient text-black py-5 rounded-[2rem] text-center font-black uppercase tracking-[0.2em] text-sm mt-6 shadow-xl shadow-medical-green/20"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
