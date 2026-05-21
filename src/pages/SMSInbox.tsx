import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Bell, 
  Mail, 
  Inbox, 
  Loader2, 
  User, 
  ArrowRight,
  MessageCircle
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/src/lib/api";
import { io } from "socket.io-client";

interface SMSInboxProps {
  user: any;
}

export default function SMSInbox({ user }: SMSInboxProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAppointments = async () => {
    if (!user || user.role !== "PATIENT") return;
    setIsLoading(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.warn("Хатогӣ ҳангоми боркунии навбатҳо:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAppointments();

    const socket = io();
    socket.emit("join", { userId: user.id, role: user.role });

    socket.on("patient_summoned", (data) => {
      if (data.patientId === user.id) {
        toast.success("Даъватномаи нав аз духтур дастрас шуд!");
        fetchAppointments();
      }
    });

    socket.on("appointment_update", (updatedApt) => {
      if (updatedApt.patientId === user.id) {
        setAppointments(prev => 
          prev.map(apt => apt.id === updatedApt.id ? updatedApt : apt)
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8 min-h-[70vh]">
      {/* Page Header */}
      <div className="relative overflow-hidden glass rounded-3xl p-8 border-white/5 shadow-2xl flex flex-col md:flex-row items-center md:justify-between gap-6">
        <div className="absolute top-0 right-0 -z-10 w-64 h-64 medical-gradient blur-[80px] opacity-15 rounded-full" />
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="bg-medical-green/10 p-4 rounded-2xl shrink-0">
            <MessageSquare className="w-10 h-10 text-medical-green animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Панели СМС ва даъватномаҳо</h1>
            <p className="text-zinc-400 text-sm font-bold mt-1">
              Дар ин ҷо паёмҳо, раҳнамоиҳо ва даъватномаҳои фиристодаи духтурро дар вақти воқеӣ дастрас кунед.
            </p>
          </div>
        </div>
        <div className="text-center md:text-right shrink-0">
          <span className="text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-zinc-300 font-bold">
            Нархнома: ройгон (бо дастгирии MADAD AI)
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 glass rounded-3xl">
          <Loader2 className="w-12 h-12 animate-spin text-medical-green" />
          <p className="text-sm font-semibold text-zinc-400">Паёмҳо бор карда мешаванд...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
          <Inbox className="w-20 h-20 text-zinc-600 mx-auto opacity-30 animate-bounce" />
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white">Ягон СМС ё даъватнома дастрас нест</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Шумо то ҳол барои гирифтани навбат ба духтурон муроҷиат накардаед ё навбатҳои шумо холӣ ҳастанд.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Link 
              to="/doctors" 
              className="medical-gradient text-black font-black text-sm uppercase px-8 py-4 rounded-xl shadow-lg shadow-medical-green/10 hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              Интихоби духтур ва гирифтани навбат
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-black text-zinc-400 uppercase tracking-widest px-1">Ҳамаи муроҷиатҳо ва СМС-ҳо ({appointments.length})</h2>
          <div className="space-y-6">
            <AnimatePresence>
              {appointments.slice().reverse().map((apt, index) => {
                const hasSms = apt.smsHistory && apt.smsHistory.length > 0;
                return (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 md:p-8 rounded-3xl border transition-all ${
                      apt.status === "IN_PROGRESS"
                        ? "bg-medical-green/5 border-medical-green/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        : "bg-zinc-950/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Top Row: Doctor details & Status badging */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${apt.status === "IN_PROGRESS" ? "bg-medical-green/25" : "bg-white/5"}`}>
                          <Stethoscope className={`w-6 h-6 ${apt.status === "IN_PROGRESS" ? "text-medical-green animate-pulse" : "text-zinc-400"}`} />
                        </div>
                        <div>
                          <h4 className="font-black text-white text-lg">{apt.doctorName}</h4>
                          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{apt.doctorSpecialty}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.status === "PENDING" && (
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                            Дар навбат (Pending)
                          </span>
                        )}
                        {apt.status === "IN_PROGRESS" && (
                          <span className="text-[10px] bg-medical-green text-black px-3 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
                            Омода бошед! Даъват шудед
                          </span>
                        )}
                        {apt.status === "COMPLETED" && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-white/5 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                            Қабул хатм шуд
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Problem/Symptoms Description */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Аломатҳо ва нишонаҳои баёнкардаи шумо:</p>
                        <p className="text-zinc-300 text-xs italic bg-white/5 px-4 py-3 rounded-2xl border border-white/5 leading-relaxed">
                          "{apt.symptoms}"
                        </p>
                      </div>

                      {/* AI explanation of symptoms (if any) */}
                      {apt.aiSummary && (
                        <div className="bg-medical-green/5 border border-medical-green/10 p-4 rounded-2xl space-y-2">
                          <p className="text-[10px] text-medical-green font-black uppercase tracking-widest">Шарҳи тиббии MADAD AI:</p>
                          <p className="text-zinc-300 text-xs leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                            {apt.aiSummary}
                          </p>
                        </div>
                      )}

                      {/* Sent SMS List */}
                      {hasSms ? (
                        <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-medical-green" /> СМС паёмҳо ва даъватномаҳои духтур ({apt.smsHistory.length}):
                          </p>
                          <div className="space-y-3">
                            {apt.smsHistory.map((sms: any, idx: number) => (
                              <div key={idx} className="bg-black/50 border border-white/5 rounded-2xl p-4 md:p-5 space-y-3 shadow-lg">
                                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                                  <span className="text-medical-green font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Bell className="w-3 h-3 text-medical-green animate-bounce" /> СМС Даъватномаи расмӣ
                                  </span>
                                  <span>{new Date(sms.sentAt).toLocaleString()}</span>
                                </div>
                                <p className="text-zinc-100 text-sm leading-relaxed font-bold bg-white/5 p-4 rounded-xl border border-white/5 italic">
                                  {sms.text}
                                </p>
                                {sms.date && sms.time && (
                                  <div className="flex gap-4 pt-1 border-t border-white/5">
                                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                                      <Calendar className="w-3.5 h-3.5 text-medical-green" />
                                      Санаи қабул: <span className="text-white font-mono font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{sms.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                                      <Clock className="w-3.5 h-3.5 text-medical-green" />
                                      Соати қабул: <span className="text-white font-mono font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{sms.time}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <p className="text-xs text-zinc-500 italic flex items-center gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <Bell className="w-4 h-4 text-zinc-600" />
                            Барои ин навбат ҳало паёми СМС фиристода нашудааст. Алоқа бо телефон одатан сурат мегирад.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
