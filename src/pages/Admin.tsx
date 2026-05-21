import { useState, useEffect } from "react";
import { 
  Settings, Users, BarChart3, Instagram, MessageCircle, 
  Plus, Trash2, Edit3, Save, Globe, Activity, ShieldCheck,
  Video, ImageIcon, Loader2, Upload, UserPlus, Phone, MapPin, Star, GraduationCap
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import api from "@/src/lib/api";

export default function Admin() {
  const [config, setConfig] = useState({
    instagram: "",
    telegramBot: "",
    emergencyContact: "",
    aiModel: "gemini-3.5-flash"
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [adForm, setAdForm] = useState({
    text: "",
    mediaUrl: "",
    mediaType: 'image' as 'image' | 'video'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  // Users & Doctors Management States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialty: "",
    experience: "",
    phone: "",
    location: "",
    city: "Н.СИНО",
    rating: 5.0
  });

  const fetchConfig = async () => {
    try {
      const res = await api.get("/config");
      setConfig(res.data);
    } catch (err) {
      console.error("Failed to fetch config", err);
    }
  };

  const fetchAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get("/admin/users");
      setUsersList(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      const res = await api.get("/doctors");
      setDoctorsList(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAppointments();
    fetchUsers();
    fetchDoctors();

    const savedAd = localStorage.getItem("madad_promo_ad");
    if (savedAd) {
      setAdForm(JSON.parse(savedAd));
    }
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("Корбар бомуваффақият нест карда шуд");
      fetchUsers();
      fetchDoctors();
    } catch (err) {
      toast.error("Хатогӣ ҳангоми нест кардани корбар");
    }
  };

  const handleDeleteDoctor = async (docId: string) => {
    try {
      await api.delete(`/doctors/${docId}`);
      toast.success("Духтур нест карда шуд");
      fetchDoctors();
    } catch (err) {
      toast.error("Хатогӣ ҳангоми нест кардани духтур");
    }
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDoctor(true);
    try {
      if (editingDoctorId) {
        await api.put(`/doctors/${editingDoctorId}`, doctorForm);
        toast.success("Маълумоти духтур нав карда шуд!");
      } else {
        await api.post("/doctors", doctorForm);
        toast.success("Духтури нав ҳамроҳ карда шуд!");
      }
      setShowDoctorModal(false);
      setEditingDoctorId(null);
      setDoctorForm({
        name: "",
        specialty: "",
        experience: "",
        phone: "",
        location: "",
        city: "Н.СИНО",
        rating: 5.0
      });
      fetchDoctors();
    } catch (err) {
      toast.error("Хатогӣ ҳангоми захираи маълумоти духтур");
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const handleOpenDoctorAdd = () => {
    setEditingDoctorId(null);
    setDoctorForm({
      name: "",
      specialty: "",
      experience: "5 сол",
      phone: "+992900000000",
      location: "Маркази тиббии Душанбе",
      city: "Н.СИНО",
      rating: 5.0
    });
    setShowDoctorModal(true);
  };

  const handleOpenDoctorEdit = (doc: any) => {
    setEditingDoctorId(doc.id);
    setDoctorForm({
      name: doc.name,
      specialty: doc.specialty,
      experience: doc.experience || "5 сол",
      phone: doc.phone || "+992900000000",
      location: doc.location || "Маркази тиббии Душанбе",
      city: doc.city || "Н.СИНО",
      rating: doc.rating || 5.0
    });
    setShowDoctorModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Файл хеле калон аст (Максимум 2MB)");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setAdForm(prev => ({
        ...prev,
        mediaUrl: reader.result as string,
        mediaType: type as 'image' | 'video'
      }));
      setIsUploading(false);
      toast.success("Файл бомуваффақият бор шуд!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAd = async () => {
    if (!adForm.mediaUrl) {
      toast.error("Лутфан аввал файлро интихоб кунед");
      return;
    }
    const fullAd = {
      ...adForm,
      updatedAt: Date.now()
    };
    
    try {
      localStorage.setItem("madad_promo_ad", JSON.stringify(fullAd));
      await api.post("/admin/update-config", { promoAd: fullAd });
      toast.success("Реклама бомуваффақият дар сервер захира шуд!");
    } catch (err) {
      toast.error("Хатогӣ ҳангоми захираи реклама дар сервер");
    }
  };

  const handleUpdate = () => {
    toast.promise(
      api.post("/admin/update-config", config),
      {
        loading: "Дар ҳоли захираи танзимот...",
        success: "Платформа муваффақона навсозӣ шуд!",
        error: "Навсозии система ноком шуд."
      }
    );
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="text-medical-green w-8 h-8" />
            Панели Супер Админ
          </h1>
          <p className="text-white font-black uppercase tracking-widest text-xs mt-1">
            Администратори система: ЗОКИРОВ САДРИДДИН
          </p>
        </div>
        <button 
          onClick={handleUpdate}
          className="medical-gradient px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg"
        >
          <Save className="w-4 h-4" />
          Татбиқи тағирот
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hidden">
        {[
          { id: "overview", icon: <BarChart3 className="w-4 h-4" />, label: "Омор" },
          { id: "appointments", icon: <Activity className="w-4 h-4" />, label: "Навбатҳо" },
          { id: "settings", icon: <Settings className="w-4 h-4" />, label: "Танзимоти платформа" },
          { id: "users", icon: <Users className="w-4 h-4" />, label: "Идоракунии корбарон" },
          { id: "ads", icon: <Activity className="w-4 h-4" />, label: "Реклама" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id ? "glass admin-gradient text-medical-green border-medical-green/50" : "text-zinc-200 hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === "overview" && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass rounded-[32px] p-8 space-y-6">
              <h3 className="text-xl font-bold">Ҳаҷми машваратҳо</h3>
              <div className="h-64 flex items-end gap-2 px-4">
                {[40, 70, 45, 90, 65, 80, 100, 50, 60, 85].map((val, i) => (
                  <div key={i} className="flex-grow bg-medical-green/20 rounded-t-lg relative group transition-all">
                    <div 
                      style={{ height: `${val}%` }} 
                      className="w-full medical-gradient rounded-t-lg group-hover:opacity-80"
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 glass px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      {val * 12} саволҳо
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] uppercase font-black text-zinc-200 px-2">
                <span>Янв</span><span>Фев</span><span>Мар</span><span>Апр</span><span>Май</span><span>Июн</span><span>Июл</span><span>Авг</span><span>Сент</span><span>Окт</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-[32px] p-8 space-y-8">
              <h3 className="text-xl font-bold">Омори фаврӣ</h3>
              <div className="space-y-6">
                {[
                  { label: "Корбарони фаъол", val: "1,294", color: "text-blue-400" },
                  { label: "Дақиқии СУ", val: "94.2%", color: "text-emerald-400" },
                  { label: "Таъхири бот", val: "42ms", color: "text-purple-400" },
                  { label: "Вақти корӣ", val: "99.9%", color: "text-red-400" },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-sm font-black text-zinc-100 uppercase tracking-widest">{stat.label}</span>
                    <span className={`text-xl font-bold ${stat.color}`}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {activeTab === "appointments" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 glass rounded-[32px] p-10 space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div>
                <h3 className="text-2xl font-black text-medical-green">Рӯйхати навбатҳои воридшуда (Беморон)</h3>
                <p className="text-gray-400 text-sm mt-1">Ин ҷо тамоми навбатҳои ба духтурон гирифтаи беморонро дидан мумкин аст.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await api.get("/appointments");
                    setAppointments(res.data);
                    toast.success("Рӯйхат нав карда шуд!");
                  } catch (err) {
                    toast.error("Хатогӣ ҳангоми навсозӣ");
                  }
                }}
                className="bg-zinc-805 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Навсозӣ кунед
              </button>
            </div>

            {isLoadingAppointments ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-medical-green" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-white/5">
                <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4 opacity-40 animate-pulse" />
                <p className="text-gray-400 font-bold">Ҳоло ягон навбат ба қайд гирифта нашудааст.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.slice().reverse().map((apt) => (
                  <div key={apt.id} className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-4 hover:border-medical-green/40 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black bg-medical-green/20 text-medical-green px-3 py-1 rounded-full uppercase tracking-widest">{apt.status}</span>
                      </div>
                      <span className="text-zinc-500 font-mono text-xs">{new Date(apt.createdAt).toLocaleString("tg-TJ")}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-zinc-100 uppercase font-black tracking-wider">Бемор:</span>
                        <h4 className="font-bold text-white text-base">{apt.patientName}</h4>
                        {apt.patientPhone && <p className="text-xs text-medical-green font-mono">{apt.patientPhone}</p>}
                      </div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-zinc-100 uppercase font-black tracking-wider">Духтури тавсияшуда:</span>
                        <p className="font-bold text-white text-base">{apt.doctorName || "Нишон надодааст"}</p>
                        {apt.doctorSpecialty && <p className="text-xs text-zinc-400">{apt.doctorSpecialty}</p>}
                      </div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-zinc-100 uppercase font-black tracking-wider">Аломатҳо (Сабаби муроҷиат):</span>
                        <p className="text-sm text-gray-300 italic">"{apt.symptoms}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 glass rounded-[32px] p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Ҳамгироии иҷтимоӣ
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-100 uppercase ml-1">Истиноди Инстаграм</label>
                    <div className="relative">
                      <Instagram className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input 
                        className="w-full bg-medical-dark border border-white/10 rounded-xl py-3 pl-12 focus:ring-1 focus:ring-medical-green font-medium"
                        value={config.instagram}
                        onChange={(e) => setConfig({...config, instagram: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-100 uppercase ml-1">Истиноди Телеграм Бот</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input 
                        className="w-full bg-medical-dark border border-white/10 rounded-xl py-3 pl-12 focus:ring-1 focus:ring-medical-green font-medium"
                        value={config.telegramBot}
                        onChange={(e) => setConfig({...config, telegramBot: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Танзимоти СУ
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-100 uppercase ml-1">Модели СУ</label>
                    <select 
                      className="w-full bg-medical-dark border border-white/10 rounded-xl py-3 px-4 focus:ring-1 focus:ring-medical-green font-medium appearance-none"
                      value={config.aiModel}
                      onChange={(e) => setConfig({...config, aiModel: e.target.value})}
                    >
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (Беҳтарин ва Зуд - Тавсияшуда)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Мукаммал ва Иловагӣ)</option>
                      <option value="gemini-3-flash-preview">Gemini 3 Flash (Хеле зуд)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-100 uppercase ml-1">Хатти доимии дастгирӣ</label>
                    <input 
                      className="w-full bg-medical-dark border border-white/10 rounded-xl py-3 px-4 focus:ring-1 focus:ring-medical-green font-medium"
                      value={config.emergencyContact}
                      onChange={(e) => setConfig({...config, emergencyContact: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-white/5">
               <button 
                  onClick={handleUpdate}
                  className="bg-white/5 hover:bg-white/10 px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Танзимоти аввалия
                </button>
            </div>
          </motion.div>
        )}
        
        {activeTab === "ads" && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 glass rounded-[32px] p-10 space-y-10">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 bg-medical-green/20 rounded-xl flex items-center justify-center">
                  <Activity className="text-medical-green w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Идоракунии Реклама</h3>
                  <p className="text-gray-400 text-sm">Таблиғоти худро барои тамоми корбарон танзим кунед.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-100">Матни реклама</label>
                    <textarea 
                      className="w-full bg-medical-dark border border-white/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-medical-green font-medium min-h-[120px]"
                      placeholder="Матни таблиғотиро ин ҷо нависед..."
                      value={adForm.text}
                      onChange={(e) => setAdForm({...adForm, text: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-100">Боргузории медиа (Акс ё Видео)</label>
                    <div className="relative group cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 group-hover:border-medical-green/50 transition-all">
                        {isUploading ? (
                          <Loader2 className="w-10 h-10 text-medical-green animate-spin" />
                        ) : adForm.mediaUrl ? (
                          adForm.mediaType === 'image' ? (
                            <ImageIcon className="w-10 h-10 text-medical-green" />
                          ) : (
                            <Video className="w-10 h-10 text-medical-green" />
                          )
                        ) : (
                          <Upload className="w-10 h-10 text-zinc-200" />
                        )}
                        <p className="text-sm font-black text-white">
                          {adForm.mediaUrl ? "Файл интихоб шудааст" : "Барои интихоби файл пахш кунед"}
                        </p>
                        <span className="text-[10px] text-zinc-100 font-bold">Максимум: 2MB</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-100">Пешнамоиш</label>
                  <div className="glass rounded-[2rem] aspect-video w-full overflow-hidden relative flex items-center justify-center bg-black/40">
                    {adForm.mediaUrl ? (
                      adForm.mediaType === 'image' ? (
                        <img src={adForm.mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <video src={adForm.mediaUrl} className="w-full h-full object-contain" controls />
                      )
                    ) : (
                      <div className="text-zinc-200 text-sm font-black uppercase tracking-widest">Медиа вуҷуд надорад</div>
                    )}
                    {adForm.text && (
                      <div className="absolute bottom-4 left-4 right-4 p-4 glass rounded-xl bg-black/60 backdrop-blur-sm">
                        <p className="text-white text-xs font-bold truncate">{adForm.text}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                    <p className="text-xs text-blue-400 leading-relaxed font-medium">
                      Система ин таблиғотро ба тамоми корбарон ҳар 30 дақиқа барои 10 сония нишон медиҳад.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-white/5">
                <button 
                  onClick={handleSaveAd}
                  className="medical-gradient px-10 py-4 rounded-xl font-bold shadow-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  Захираи Реклама
                </button>
              </div>
           </motion.div>
        )}
      </div>
    </div>
  );
}
