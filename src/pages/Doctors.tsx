import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Phone, 
  MapPin, 
  Star, 
  GraduationCap, 
  X, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  Search, 
  Trash2, 
  MapPinned, 
  Settings, 
  Edit3, 
  Stethoscope,
  MessageSquare,
  Calendar,
  Bell,
  Mail,
  MessageCircle,
  Inbox,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import api from "@/src/lib/api";
import { io } from "socket.io-client";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  phone: string;
  location: string;
  city: string;
  rating: number;
}

const CITIES = [
  "Н.СИНО",
  "Н.РУДАКИ",
  "Н.ФИРДАВСИ",
  "Н.ШОХМАНСУР"
];

const fallbackDoctors: Doctor[] = [
  {
    id: "1",
    name: "Д-р Алишер Воҳидов",
    specialty: "Кардиология",
    experience: "15 сол",
    phone: "+992 900 11 22 33",
    location: "Маркази тиббии Душанбе",
    city: "Н.СИНО",
    rating: 4.9
  },
  {
    id: "2",
    name: "Д-р Малика Раҳимова",
    specialty: "Неврология",
    experience: "12 сол",
    phone: "+992 918 44 55 66",
    location: "Клиникаи Ависенна",
    city: "Н.ФИРДАВСИ",
    rating: 4.8
  },
  {
    id: "3",
    name: "Д-р Бахтиёр Саидов",
    specialty: "Педиатрия",
    experience: "20 сол",
    phone: "+992 935 77 88 99",
    location: "Беморхонаи марказии шаҳр",
    city: "Н.ШОХМАНСУР",
    rating: 5.0
  }
];

interface DoctorsProps {
  user: any;
}

export default function Doctors({ user }: DoctorsProps) {
  const [activeTab, setActiveTab] = useState<"doctors" | "sms_panel">("doctors");
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [isFetchingAppointments, setIsFetchingAppointments] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("Ҳама");
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    experience: "",
    phone: "",
    location: "",
    city: CITIES[0],
    rating: 5.0
  });

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState({
    symptoms: "",
  });
  const [isBooking, setIsBooking] = useState(false);

  const fetchPatientAppointments = async () => {
    if (!user || user.role !== "PATIENT") return;
    setIsFetchingAppointments(true);
    try {
      const res = await api.get("/appointments");
      setPatientAppointments(res.data);
    } catch (err) {
      console.warn("Could not load patient appointments", err);
    } finally {
      setIsFetchingAppointments(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Лутфан аввал ба система ворид шавед (Login)");
      return;
    }
    if (!selectedDoctor) return;

    setIsBooking(true);
    try {
      await api.post("/appointments", {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        symptoms: bookingData.symptoms,
      });
      toast.success("Дархости шумо бомуваффақият фиристода шуд! Духтур ба зудӣ тамос мегирад.");
      setShowBookingModal(false);
      setBookingData({ symptoms: "" });
      fetchPatientAppointments(); // Reload list
    } catch (err) {
      toast.error("Хатогӣ ҳангоми фармоиши навбат");
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/doctors");
        setDoctors(res.data);
      } catch (err) {
        toast.error("Хатогӣ ҳангоми боркунии рӯйхати духтурон");
        setDoctors(fallbackDoctors);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();

    if (user && user.role === "PATIENT") {
      fetchPatientAppointments();
    }

    const savedCity = localStorage.getItem("user_city");
    if (savedCity && (CITIES.includes(savedCity) || savedCity === "Ҳама")) {
      setSelectedCity(savedCity);
    } else {
      setSelectedCity("Ҳама");
      setShowLocationPrompt(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "PATIENT") return;

    const socket = io();
    socket.emit("join", { userId: user.id, role: user.role });

    socket.on("patient_summoned", (data) => {
      if (data.patientId === user.id) {
        // Refresh local appointments to instantly show the new SMS and status
        fetchPatientAppointments();
      }
    });

    socket.on("appointment_update", (updatedApt) => {
      if (updatedApt.patientId === user.id) {
        setPatientAppointments(prev => 
          prev.map(apt => apt.id === updatedApt.id ? updatedApt : apt)
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem("user_city", city);
    setShowLocationPrompt(false);
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === "Ҳама" || doc.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [doctors, searchQuery, selectedCity]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'ADMIN') return;
    
    setIsAdding(true);
    try {
      if (editingDoctorId) {
        const res = await api.put(`/doctors/${editingDoctorId}`, formData);
        setDoctors(doctors.map(doc => doc.id === editingDoctorId ? res.data : doc));
        toast.success("Маълумоти духтур нав карда шуд!");
      } else {
        const res = await api.post("/doctors", formData);
        setDoctors([...doctors, res.data]);
        toast.success("Духтур бомуваффақият илова шуд!");
      }
      
      setShowModal(false);
      setEditingDoctorId(null);
      setFormData({
        name: "",
        specialty: "",
        experience: "",
        phone: "",
        location: "",
        city: CITIES[0],
        rating: 5.0
      });
    } catch (error) {
      toast.error("Хатогӣ ҳангоми иҷрои амалиёт дар база");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (doc: Doctor) => {
    setEditingDoctorId(doc.id);
    setFormData({
      name: doc.name,
      specialty: doc.specialty,
      experience: doc.experience,
      phone: doc.phone,
      location: doc.location,
      city: doc.city,
      rating: doc.rating
    });
    setShowModal(true);
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!user || user.role !== 'ADMIN') return;

    try {
      await api.delete(`/doctors/${id}`);
      setDoctors(doctors.filter(doc => doc.id !== id));
      toast.success("Маълумот нест карда шуд");
    } catch (error) {
      toast.error("Хатогӣ ҳангоми нест кардан аз сервер");
    }
  };

  return (
    <div className="space-y-12 relative">
      <AnimatePresence>
        {showLocationPrompt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-dark p-8 md:p-10 rounded-[40px] border-white/10 max-w-2xl w-full shadow-2xl space-y-8 text-center"
            >
              <div className="space-y-4">
                <div className="w-20 h-20 bg-medical-green/20 rounded-3xl flex items-center justify-center mx-auto">
                  <MapPinned className="w-10 h-10 text-medical-green" />
                </div>
                <h2 className="text-3xl font-bold">Хуш омадед!</h2>
                <p className="text-gray-400 text-lg">
                  Лутфан макони зисти худро интихоб кунед, то мо тавонем духтурони наздиктарини шуморо пешниҳод кунем.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSelectCity("Ҳама")}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-medical-green hover:bg-medical-green/10 transition-all font-bold text-sm"
                >
                  Ҳамаи маконҳо
                </button>
                {CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => handleSelectCity(city)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-medical-green hover:bg-medical-green/10 transition-all font-bold text-sm leading-tight"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showAdminPanel && user?.role === 'ADMIN' && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminPanel(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-dark p-8 md:p-10 rounded-[40px] border-white/10 max-w-4xl w-full shadow-2xl space-y-8 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-medical-green/20 rounded-2xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-medical-green" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Тағйирот ва Идоракунӣ</h2>
                    <p className="text-gray-400 text-sm">Рӯйхати пурраи духтурони воридшуда</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAdminPanel(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {doctors.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-medical-green/10 rounded-[1.5rem] flex items-center justify-center shrink-0">
                        <User className="w-8 h-8 text-medical-green" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xl font-bold text-white group-hover:text-medical-green transition-colors">{doc.name}</h4>
                        <p className="text-sm text-gray-400 font-medium">{doc.specialty} • {doc.city}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEditClick(doc)}
                        className="flex-1 md:flex-none px-6 py-3 bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Тағйир додан
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doc.id)}
                        className="flex-1 md:flex-none px-6 py-3 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Нест кардан
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center shrink-0">
                <p className="text-white/80 text-sm font-black">Ҳамагӣ: <span className="text-white underline">{doctors.length} духтур</span></p>
                <button
                  onClick={() => {
                    setEditingDoctorId(null);
                    setShowModal(true);
                  }}
                  className="px-8 py-3 medical-gradient rounded-xl font-bold shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Духтури нав
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-dark p-8 md:p-10 rounded-[40px] border-white/10 max-w-lg w-full shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>

              {user?.role === 'ADMIN' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      {editingDoctorId ? <Edit3 className="w-6 h-6 text-blue-500" /> : <Plus className="w-6 h-6 text-blue-500" />}
                    </div>
                    <h3 className="text-2xl font-bold">{editingDoctorId ? "Тағйир додани маълумот" : "Иловаи духтур"}</h3>
                  </div>
                  
                  <form onSubmit={handleAddDoctor} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white">Ному насаб</label>
                      <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="масалан: Д-р Алишер Воҳидов"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white">Ихтисос</label>
                        <input 
                          required
                          type="text"
                          value={formData.specialty}
                          onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Кардиология"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white">Таҷриба</label>
                        <input 
                          required
                          type="text"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="15 сол"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white">Телефон</label>
                      <input 
                        required
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-mono"
                        placeholder="+992 000 00 00 00"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white">Макон (Суроға)</label>
                        <input 
                          required
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="масалан: Маркази тиббии №1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white">Шаҳр / Ноҳия</label>
                        <select 
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                        >
                          {CITIES.map(city => (
                            <option key={city} value={city} className="bg-gray-900">{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <button 
                      disabled={isAdding}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : editingDoctorId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingDoctorId ? "Захира кардани тағйирот" : "Илова кардан"}
                    </button>
                    {editingDoctorId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingDoctorId(null);
                          setShowModal(false);
                        }}
                        className="w-full bg-white/5 hover:bg-white/10 py-4 rounded-xl font-bold transition-all"
                      >
                        Бекор кардан
                      </button>
                    )}
                  </form>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-medical-green/20 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-medical-green" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Ҳамкории тиббӣ</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Агар шумо духтури ботаҷриба дар соҳаи худ ҳастед, пас барои ҳамкорӣ ба админ муроҷиат кунед. Шуморо сари вақт ба платформа илова мекунад то ба беморон ёрӣ расонед.
                    </p>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                      <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-bold">Тамос бо Админ</p>
                      <p className="text-2xl font-mono font-bold text-medical-green">+992 901 66 00 65</p>
                      <p className="text-sm text-gray-400">ЗОКИРОВ САДРИДДИН</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full py-4 medical-gradient rounded-2xl font-bold shadow-lg"
                  >
                    Фаҳмо, ташаккур
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
        {showBookingModal && selectedDoctor && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-dark p-8 md:p-10 rounded-[40px] border-white/10 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-medical-green/10 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-medical-green" />
                </div>
                <div>
                  <h3 id="booking-modal-title" className="text-2xl font-black text-white">Навбат ба {selectedDoctor.name}</h3>
                  <p className="text-medical-green font-bold text-sm uppercase">{selectedDoctor.specialty}</p>
                </div>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white">Аломатҳои шумо (ё сабаби муроҷиат)</label>
                  <textarea 
                    required
                    rows={4}
                    value={bookingData.symptoms}
                    onChange={(e) => setBookingData({ symptoms: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-medical-green/50 placeholder:text-zinc-600 italic"
                    placeholder="масалан: Дарди сар, табларза ..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    id="booking-modal-cancel"
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 py-7 rounded-2xl text-zinc-400 font-bold"
                  >
                    Бекор кардан
                  </Button>
                  <Button 
                    id="booking-modal-submit"
                    type="submit"
                    disabled={isBooking}
                    className="flex-[2] py-7 rounded-2xl medical-gradient text-white font-black uppercase tracking-wider shadow-xl shadow-medical-green/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Тасдиқи навбат"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-medical-green tracking-tight">Мутахассисони тавсияшуда</h1>
        <div className="space-y-2">
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Шумо дар ин панел духтурони беҳтарини Ҷумҳурии Тоҷикистонро пайдо мекунед.
          </p>
          <p className="text-medical-green font-bold italic text-sm tracking-wide">
            Шиори мо: "Саломатии халқ ҳадафи асосии мост!"
          </p>
        </div>
      </div>

      {user && user.role === "PATIENT" && (
        <div className="flex justify-center max-w-sm mx-auto mb-10 bg-white/5 border border-white/10 p-1.5 rounded-2xl shadow-xl">
          <button
            onClick={() => setActiveTab("doctors")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === "doctors"
                ? "medical-gradient text-black font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Духтурон
          </button>
          <button
            onClick={() => {
              setActiveTab("sms_panel");
              fetchPatientAppointments();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 relative ${
              activeTab === "sms_panel"
                ? "medical-gradient text-black font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Панели СМС
            {patientAppointments.some(a => a.status === "IN_PROGRESS") && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
            {patientAppointments.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 bg-white/15 rounded-md text-white font-mono ml-1">
                {patientAppointments.length}
              </span>
            )}
          </button>
        </div>
      )}

      {activeTab === "sms_panel" ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="bg-medical-green/10 p-3 rounded-2xl">
                <Mail className="w-6 h-6 text-medical-green animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Қуттии СМС-ҳои шумо (SMS Inbox)</h2>
                <p className="text-zinc-400 text-xs font-bold">Дар ин ҷо паёмҳо ва даъватномаҳои духтурон намоиш дода мешаванд.</p>
              </div>
            </div>

            {isFetchingAppointments ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-medical-green" />
                <p className="text-xs text-zinc-400">Боркунии рӯйхати паёмҳо...</p>
              </div>
            ) : patientAppointments.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Inbox className="w-16 h-16 text-zinc-600 mx-auto opacity-35" />
                <h3 className="text-lg font-black text-zinc-300">Ягон СМС ё даъватнома нест</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Шумо то ҳол ба ягон духтур навбат нагирифтаед. Аз рӯйхати духтурон якеро интихоб намуда ва тугмаи "Навбат гирифтан"-ро пахш созед.
                </p>
                <Button 
                  onClick={() => setActiveTab("doctors")}
                  className="bg-medical-green hover:bg-emerald-600 text-black font-black text-xs uppercase px-6 py-4 rounded-xl"
                >
                  Интихоби духтур
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {patientAppointments.slice().reverse().map((apt) => {
                  const hasSummonSms = apt.smsHistory && apt.smsHistory.length > 0;
                  return (
                    <div 
                      key={apt.id} 
                      className={`p-6 rounded-2xl border transition-all ${
                        apt.status === "IN_PROGRESS"
                          ? "bg-medical-green/5 border-medical-green/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                          : "bg-zinc-950/40 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${apt.status === "IN_PROGRESS" ? "bg-medical-green/20" : "bg-white/5"}`}>
                            <Stethoscope className={`w-5 h-5 ${apt.status === "IN_PROGRESS" ? "text-medical-green" : "text-zinc-400"}`} />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-base">{apt.doctorName}</h4>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{apt.doctorSpecialty}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {apt.status === "PENDING" && (
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                              Дар навбат (Pending)
                            </span>
                          )}
                          {apt.status === "IN_PROGRESS" && (
                            <span className="text-[10px] bg-medical-green text-black px-3 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
                              Шуморо фарёд карданд!
                            </span>
                          )}
                          {apt.status === "COMPLETED" && (
                            <span className="text-[10px] bg-zinc-850 text-zinc-400 border border-white/5 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                              Қабул хатм шуд
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Stated Symptoms */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Аломатҳои нишондодаи шумо:</p>
                          <p className="text-zinc-300 text-xs italic bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                            "{apt.symptoms}"
                          </p>
                        </div>

                        {/* If summoned or has SMS history, render SMS panel inside */}
                        {hasSummonSms ? (
                          <div className="mt-4 space-y-3">
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-medical-green" /> СМС Паёмҳо аз духтур ({apt.smsHistory.length})
                            </p>
                            <div className="space-y-2.5">
                              {apt.smsHistory.map((sms: any, idx: number) => (
                                <div key={idx} className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-3">
                                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                                    <span className="text-medical-green font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Bell className="w-3 h-3 text-medical-green animate-bounce" /> СМС даъватнома
                                    </span>
                                    <span>{new Date(sms.sentAt).toLocaleString()}</span>
                                  </div>
                                  <p className="text-zinc-200 text-sm leading-relaxed font-bold bg-white/5 p-3.5 rounded-xl border border-white/5 italic">
                                    {sms.text}
                                  </p>
                                  {sms.date && sms.time && (
                                    <div className="flex gap-4 pt-1 border-t border-white/5">
                                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                        <Calendar className="w-3.5 h-3.5 text-medical-green" />
                                        Сана: <span className="text-white font-mono font-bold">{sms.date}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                        <Clock className="w-3.5 h-3.5 text-medical-green" />
                                        Вақт: <span className="text-white font-mono font-bold">{sms.time}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2">
                            <p className="text-xs text-zinc-500 italic flex items-center gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5">
                              <Bell className="w-3.5 h-3.5 text-zinc-600" />
                              Барои ин навбат ҳоло ягон паём ё даъватномаи СМС фиристода нашудааст. Лутфан хабарномаро интизор шавед.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative group max-w-md mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-500 group-focus-within:text-medical-green transition-colors" />
              </div>
              <input 
                type="text"
                placeholder="Ҷустуҷӯи духтур (Ном ё ихтисос)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-medical-green/50 transition-all font-black text-lg text-medical-green placeholder:text-medical-green/50"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 p-2 glass rounded-[2rem]">
              <button
                onClick={() => handleSelectCity("Ҳама")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  selectedCity === "Ҳама" 
                    ? "bg-medical-green text-white border-medical-green" 
                    : "bg-white/5 text-gray-400 border-white/5 hover:border-white/10"
                }`}
              >
                Ҳамаи маконҳо
              </button>
              {CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    selectedCity === city 
                      ? "bg-medical-green text-white border-medical-green" 
                      : "bg-white/5 text-gray-400 border-white/5 hover:border-white/10"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
            
            {selectedCity === "Ҳама" && (
               <div className="flex items-center justify-center gap-2 text-gray-400 animate-pulse">
                 <MapPinned className="w-4 h-4" />
                 <span className="text-sm">Лутфан макони худро интихоб кунед, то духтурони наздики шуморо нишон диҳем.</span>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-medical-green" />
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="col-span-full text-center py-20 glass rounded-3xl space-y-4">
                <Search className="w-12 h-12 text-gray-600 mx-auto opacity-20" />
                <p className="text-gray-400 font-medium">Ҳеҷ духтуре бо ин ном ё ихтисос ёфт нашуд.</p>
              </div>
            ) : (
              filteredDoctors.map((doc, i) => (
                <motion.div
                  key={doc.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-3xl p-6 space-y-6 group hover:translate-y-[-8px] transition-all duration-300 border-white/5 hover:border-medical-green/40 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-medical-green/10 flex items-center justify-center shrink-0">
                      <User className="w-8 h-8 text-medical-green" />
                    </div>
                    <div>
                      <h3 className="font-black text-medical-green text-xl leading-tight">{doc.name}</h3>
                      <p className="text-medical-green text-sm font-semibold uppercase tracking-wider">{doc.specialty}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-gray-300">{doc.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-sm text-white font-black">
                      <GraduationCap className="w-4 h-4 text-medical-green shrink-0" />
                      <span>Таҷриба: {doc.experience}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white font-black">
                      <MapPin className="w-4 h-4 text-medical-green shrink-0" />
                      <div className="flex flex-col">
                        <span className="truncate">{doc.location}</span>
                        <span className="text-[10px] text-medical-green font-bold">{doc.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white font-black">
                      <Phone className="w-4 h-4 text-medical-green shrink-0" />
                      <span className="font-mono">{doc.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <a 
                      href={`tel:${doc.phone}`}
                      className="bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setShowBookingModal(true);
                      }}
                      className="medical-gradient text-black py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      Навбат гирифтан
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
      
      <div className="glass p-8 rounded-3xl text-center space-y-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-medical-green">{user?.role === 'ADMIN' ? "Панели Админ" : "Шумо духтур ҳастед?"}</h2>
        <p className="text-gray-400 italic">
          {user?.role === 'ADMIN' 
            ? "Маълумоти духтурони навро илова кунед, то дар барнома намоиш дода шаванд."
            : '"Ба шабакаи мутахассисони элитаи тиббии мо ҳамроҳ шавед ва ба мо дар тағир додани дастрасии соҳаи тандурустӣ кумак кунед."'
          }
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => {
              setEditingDoctorId(null);
              setShowModal(true);
            }}
            className={`px-8 py-3 rounded-xl font-bold shadow-lg shrink-0 transition-all ${
              user?.role === 'ADMIN' ? "bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" : "medical-gradient w-full sm:w-auto"
            }`}
          >
            {user?.role === 'ADMIN' ? "Илова кардани духтур" : "Дархост барои ҳамроҳшавӣ"}
          </button>
          
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="px-8 py-3 rounded-xl font-bold shadow-lg shrink-0 transition-all border w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600/10 text-purple-500 border-purple-600/20 hover:bg-purple-600/20"
            >
              <Settings className="w-5 h-5" />
              Тағйирот
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
