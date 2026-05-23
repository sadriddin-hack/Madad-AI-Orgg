import { useEffect, useState, useRef } from "react";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Search, 
  Bell, 
  User as UserIcon,
  ChevronRight,
  Stethoscope,
  MoreVertical,
  Send,
  MessageSquare,
  Sparkles,
  Trash2,
  Plus,
  Save,
  Check,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import { io } from "socket.io-client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const BUILT_IN_TEMPLATES = [
  {
    id: "default_summon",
    title: "Даъвати умумӣ",
    text: "Салом, {patient}! Шуморо духтур {doctor} ба рӯзи {date} соати {time} ба қабули худ фарёд кард. Лутфан бо худатон варақаҳои тиббиро гиред ва сари вақт ҳозир шавед. Бо эҳтиром, MADAD AI."
  },
  {
    id: "lab_results",
    title: "Натиҷаи таҳлилҳо",
    text: "Салом, {patient}! Натиҷаҳои таҳлилҳои шумо омода шудаанд. Лутфан рӯзи {date} соати {time} ба қабули духтур {doctor} биёед."
  },
  {
    id: "urgent_call",
    title: "Даъвати фаврӣ",
    text: "Салом, {patient}! Аломатҳои шумо боиси нигаронист. Лутфан рӯзи {date} соати {time} фаврӣ барои қабул ба духтур {doctor} ҳозир шавед."
  },
  {
    id: "treatment_followup",
    title: "Назорати кунунӣ",
    text: "Салом, {patient}! Барои назорати ҷараёни табобат ва вазъи саломатии худ, лутфан рӯзи {date} соати {time} ба қабули духтур {doctor} ҳозир шавед."
  }
];

const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

function DoctorDirectChat({ doctorId, patientId, patientName }: { doctorId: string; patientId: string; patientName: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/messages?contactId=${patientId}`);
      setMessages(res.data);
    } catch (err) {
      console.warn("Could not load direct messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const socket = io();
    socket.emit("join", { userId: doctorId, role: "DOCTOR" });

    socket.on("new_sms", (msg: any) => {
      if (
        (msg.senderId === patientId && msg.receiverId === doctorId) ||
        (msg.senderId === doctorId && msg.receiverId === patientId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [patientId, doctorId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setSending(true);
    try {
      const res = await api.post("/messages", {
        receiverId: patientId,
        text: messageText,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setText("");
    } catch (err) {
      toast.error("СМС паём фиристода нашуд.");
    } finally {
      setSending(false);
    }
  };

  const doctorDirectReplies = [
    "Салом, ман омодаам шуморо қабул кунам. Марҳамат дароед.",
    "Лутфан ба қабулгоҳ (регистратура) муроҷиат кунед.",
    "Таҳлилҳои худро бо худатон биёред.",
    "Салом, рӯзи дигар қабул карда метавонам."
  ];

  return (
    <div className="bg-black/45 border border-white/5 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl flex flex-col h-[340px] animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs text-medical-green font-black uppercase tracking-wider flex items-center gap-1.5ClassName bg-transparent">
          <span className="w-1.5 h-1.5 bg-medical-green rounded-full animate-ping" />
          СҲҲБАТИ МУСТАҚИМ БО: {patientName}
        </span>
        <button 
          onClick={fetchMessages}
          className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 px-2 py-0.5 rounded transition-all font-bold"
        >
          Навсозӣ
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar text-xs"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-medical-green" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-20" />
            <p className="italic font-bold text-center">Мукотибаи СМС бо ин бемор холӣ аст. Аввалин паёмокро фиристед.</p>
          </div>
        ) : (
          messages.map((m: any) => {
            const isMe = m.senderId === doctorId;
            return (
              <div 
                key={m.id} 
                className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
              >
                <div 
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-md font-bold",
                    isMe 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : "bg-zinc-800 text-zinc-100 rounded-tl-none border border-white/5"
                  )}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 px-1 font-mono">
                  {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Instant quick comments */}
      <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none shrink-0 border-t border-white/5 pt-2">
        {doctorDirectReplies.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setText(q)}
            className="whitespace-nowrap bg-zinc-900 border border-white/5 text-[10px] text-zinc-300 font-bold px-2.5 py-1.5 rounded-xl hover:border-medical-green/45 transition-all cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Send interface */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0 border-t border-white/5 pt-2">
        <input 
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ҷавоб ба бемор (СМС)..."
          className="flex-grow bg-zinc-950 border border-white/10 text-white font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-medical-green/50 placeholder:text-zinc-600 shadow-inner animate-pulse duration-1000"
        />
        <Button 
          type="submit"
          disabled={!text.trim() || sending}
          size="sm"
          className="bg-medical-green hover:bg-emerald-500 text-black font-black px-4 h-9 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer text-xs"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>ҶАВОБ</span>
        </Button>
      </form>
    </div>
  );
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    today: 0,
    active: 0,
    completed: 0,
    pending: 0
  });

  const [showSummonForm, setShowSummonForm] = useState(false);
  const [summonDate, setSummonDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [summonTime, setSummonTime] = useState(() => {
    const today = new Date();
    const hh = String(today.getHours()).padStart(2, '0');
    const mm = String(today.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [isSummoning, setIsSummoning] = useState(false);
  const [customSmsText, setCustomSmsText] = useState("");
  const [isAnalyzingSymptom, setIsAnalyzingSymptom] = useState(false);

  // Custom SMS template states
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default_summon");
  const [isManualEdit, setIsManualEdit] = useState<boolean>(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState<string>("");

  // Load custom templates after user is set
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`madad_custom_templates_${user.id}`);
        if (saved) {
          setCustomTemplates(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Error loading templates:", err);
      }
    }
  }, [user]);

  // Handle template compile
  useEffect(() => {
    if (selectedAppointment && !isManualEdit) {
      const patientName = selectedAppointment.patientName || "Бемор";
      const docName = user?.fullName || user?.name || "Духтур";
      
      const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];
      const match = allTemplates.find(t => t.id === selectedTemplateId);
      if (match) {
        const text = match.text
          .replace(/{patient}/g, patientName)
          .replace(/{doctor}/g, docName)
          .replace(/{date}/g, summonDate)
          .replace(/{time}/g, summonTime);
        setCustomSmsText(text);
      }
    }
  }, [selectedAppointment, summonDate, summonTime, user, selectedTemplateId, customTemplates, isManualEdit]);

  const handleSaveAsTemplate = () => {
    if (!newTemplateTitle.trim()) {
      toast.error("Лутфан номи шаблонро ворид кунед!");
      return;
    }
    if (!customSmsText.trim()) {
      toast.error("Матни шаблон холӣ буда наметавонад!");
      return;
    }

    const patientName = selectedAppointment?.patientName || "Бемор";
    const docName = user?.fullName || user?.name || "Духтур";
    
    let templateText = customSmsText;
    
    // De-compile to create robust dynamic templates
    if (patientName) {
      templateText = templateText.replace(new RegExp(escapeRegExp(patientName), 'g'), "{patient}");
    }
    if (docName) {
      templateText = templateText.replace(new RegExp(escapeRegExp(docName), 'g'), "{doctor}");
    }
    if (summonDate) {
      templateText = templateText.replace(new RegExp(escapeRegExp(summonDate), 'g'), "{date}");
    }
    if (summonTime) {
      templateText = templateText.replace(new RegExp(escapeRegExp(summonTime), 'g'), "{time}");
    }

    const newTemplate = {
      id: `custom_${Date.now()}`,
      title: newTemplateTitle.trim(),
      text: templateText
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    if (user?.id) {
      localStorage.setItem(`madad_custom_templates_${user.id}`, JSON.stringify(updated));
    }
    
    setSelectedTemplateId(newTemplate.id);
    setIsManualEdit(false);
    setNewTemplateTitle("");
    toast.success("Шаблони нав бомуваффақият захира шуд!");
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    if (user?.id) {
      localStorage.setItem(`madad_custom_templates_${user.id}`, JSON.stringify(updated));
    }
    if (selectedTemplateId === id) {
      setSelectedTemplateId("default_summon");
      setIsManualEdit(false);
    }
    toast.success("Шаблон нест карда шуд");
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
      
      const today = res.data.length;
      const active = res.data.filter((a: any) => a.status === "IN_PROGRESS").length;
      const completed = res.data.filter((a: any) => a.status === "COMPLETED").length;
      const pending = res.data.filter((a: any) => a.status === "WAITING").length;
      
      setStats({ today, active, completed, pending });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    
    const savedUser = JSON.parse(localStorage.getItem("madad_user") || "{}");
    setUser(savedUser);
    
    const socket = io();
    
    socket.emit("join", { userId: savedUser.id, role: savedUser.role });
    
    socket.on("new_appointment", (appointment) => {
      setAppointments(prev => [...prev, appointment]);
      toast.success("Бемори нав дар навбат қарор гирифт!");
    });

    socket.on("appointment_update", (updatedApt) => {
      setAppointments(prev => prev.map(apt => apt.id === updatedApt.id ? updatedApt : apt));
      setSelectedAppointment((selected: any) => 
        selected && selected.id === updatedApt.id ? updatedApt : selected
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      fetchAppointments();
      toast.success(`Ҳолати бемор ба '${status}' нав карда шуд`);
    } catch (err) {
      toast.error("Хатогӣ ҳангоми навсозии ҳолат");
    }
  };

  const handleSendSummon = async () => {
    if (!selectedAppointment) return;
    setIsSummoning(true);
    try {
      const res = await api.post(`/appointments/${selectedAppointment.id}/summon`, {
        date: summonDate,
        time: summonTime,
        customMessage: customSmsText
      });
      
      await fetchAppointments();
      
      setSelectedAppointment(res.data.appointment || { 
        ...selectedAppointment, 
        status: "IN_PROGRESS", 
        summonedDate: summonDate, 
        summonedTime: summonTime,
        smsHistory: [
          ...(selectedAppointment.smsHistory || []),
          {
            text: res.data.smsText || customSmsText,
            sentAt: new Date().toISOString(),
            to: selectedAppointment.patientPhone || "+992 000 00 0000",
            date: summonDate,
            time: summonTime
          }
        ]
      });
      
      toast.success("СМС даъватнома бомуваффақият расонида шуд!");
      setShowSummonForm(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Хатогӣ ҳангоми фиристодани СМС ба бемор");
    } finally {
      setIsSummoning(false);
    }
  };

  const handleAnalyzeSymptoms = async () => {
    if (!selectedAppointment) return;
    setIsAnalyzingSymptom(true);
    try {
      const res = await api.post(`/appointments/${selectedAppointment.id}/analyze-ai`);
      
      const updatedSummary = res.data.aiSummary;
      setSelectedAppointment((prev: any) => ({
        ...prev,
        aiSummary: updatedSummary
      }));
      
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, aiSummary: updatedSummary } : apt
      ));
      
      toast.success("Аломатҳо бо муваффақият аз ҷониби СС таҳлил шуданд!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Хатогӣ ҳангоми таҳлил бо СС");
    } finally {
      setIsAnalyzingSymptom(false);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-zinc-950/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Мушовири Духтур</h1>
          <p className="text-zinc-400 mt-1">Хуш омадед ба панели идоракунии Madad AI</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full bg-white/5 border-white/10 text-zinc-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user?.fullName || "Духтур"}</p>
              <p className="text-xs text-medical-green font-medium">{user?.specialty || "Мутахассис"}</p>
            </div>
            <Avatar className="w-10 h-10 border-2 border-medical-green/50">
              <AvatarFallback className="bg-medical-green/20 text-medical-green font-bold text-xs">
                {user?.fullName?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Имрӯз", value: stats.today, icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Дар навбат", value: stats.active, icon: Users, color: "text-medical-green", bg: "bg-medical-green/10" },
          { label: "Иҷрошуда", value: stats.completed, icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Интизорӣ", value: stats.pending, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" }
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 hover:border-white/20 transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                  <h3 className="text-2xl font-black text-white mt-1">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Appointments Table */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-white">Рӯйхати беморони имрӯз</CardTitle>
              <CardDescription className="text-zinc-400">Навбати зинда ва қабули беморон</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input className="pl-9 bg-white/5 border-white/10 w-[200px]" placeholder="Ҷустуҷӯ..." />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400 uppercase text-xs font-bold">Бемор</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs font-bold">Вақт</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs font-bold">Аломатҳо</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs font-bold">Ҳолат</TableHead>
                  <TableHead className="text-right text-zinc-400 uppercase text-xs font-bold">Амалиёт</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow 
                    key={apt.id} 
                    className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedAppointment(apt)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-white/10">
                          <AvatarFallback className="bg-medical-green/20 text-medical-green text-xs font-bold">
                            {apt.patientName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-white">{apt.patientName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {new Date(apt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm max-w-[200px] truncate">
                      {apt.symptoms}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                        apt.status === "WAITING" && "bg-orange-500/10 text-orange-500 border-orange-500/20",
                        apt.status === "IN_PROGRESS" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        apt.status === "COMPLETED" && "bg-medical-green/10 text-medical-green border-medical-green/20"
                      )}>
                        {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger 
                          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                          <DropdownMenuItem onClick={() => updateStatus(apt.id, "WAITING")}>Интизорӣ</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(apt.id, "IN_PROGRESS")}>Қабул</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(apt.id, "COMPLETED")}>Ба итмом расид</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {appointments.length === 0 && (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-white font-black">Ҳоло ягон бемор нест</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Patient Details */}
        <div className="space-y-6">
          {selectedAppointment ? (
            <Card className="bg-white/5 border-white/10 h-full">
              <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-medical-green" />
                  Маълумоти бемор
                </CardTitle>
                <div className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-zinc-400 font-mono">
                  тел: {selectedAppointment.patientPhone || "Нишон надодааст"}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-medical-green/30">
                    <AvatarFallback className="text-2xl font-black bg-medical-green/10 text-medical-green">
                      {selectedAppointment.patientName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-xl font-black text-white">{selectedAppointment.patientName}</h4>
                    <p className="text-sm text-zinc-400">Навбат: #{selectedAppointment.id.slice(-3)}</p>
                  </div>
                </div>
 
                <div className="space-y-4">
                  {/* Basic symptoms stated by patient */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-medical-green uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Аломатҳои бемор (Symptoms)
                    </p>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">"{selectedAppointment.symptoms}"</p>
                  </div>
 
                  {/* AI Symptom Explanation Section */}
                  <div className="bg-medical-green/5 p-4 rounded-2xl border border-medical-green/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-medical-green uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-medical-green animate-pulse" /> Хулоса ва таҳлили СС (AI)
                      </p>
                      {selectedAppointment.aiSummary && !isAnalyzingSymptom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAnalyzeSymptoms}
                          className="text-[10px] text-zinc-400 hover:text-white font-black bg-white/5 hover:bg-white/10 h-6 px-2.5 rounded-md"
                        >
                          Навсозии таҳлил
                        </Button>
                      )}
                    </div>
 
                    {isAnalyzingSymptom ? (
                      <div className="space-y-2 py-4 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                        <p className="text-xs text-medical-green italic font-bold">Зеҳни сунъии MADAD AI аломатҳоро таҳлил карда истодааст...</p>
                      </div>
                    ) : selectedAppointment.aiSummary ? (
                      <div className="markdown-body prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed max-h-[300px] overflow-y-auto pr-1">
                        <ReactMarkdown>{selectedAppointment.aiSummary}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="space-y-3 py-2 text-center">
                        <p className="text-xs text-zinc-400 italic">Таҳлили AI барои ин аломатҳо ҳоло сохта нашудааст.</p>
                        <Button
                          onClick={handleAnalyzeSymptoms}
                          className="text-xs w-full py-2 bg-medical-green/20 hover:bg-medical-green/30 text-white font-black border border-medical-green/35 rounded-xl flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Интиқоли аломатҳо ба СС барои шарҳсупорӣ
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* SMS Summoning History */}
                  {selectedAppointment.smsHistory && selectedAppointment.smsHistory.length > 0 && (
                    <div className="bg-blue-950/20 border border-blue-500/10 p-4 rounded-2xl space-y-2.5">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> СМС-ҳои фиристодашуда ба бемор
                      </p>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {selectedAppointment.smsHistory.map((sms: any, idx: number) => (
                          <div key={idx} className="text-xs bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                              <span>Ба: {sms.to}</span>
                              <span>{new Date(sms.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-zinc-300 italic">"{sms.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real-time Bidirectional SMS/Chat with Patient */}
                  <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-1 mt-4">
                    <DoctorDirectChat 
                      doctorId={user?.id || selectedAppointment.doctorId}
                      patientId={selectedAppointment.patientId} 
                      patientName={selectedAppointment.patientName} 
                    />
                  </div>
 
                  {/* Summon Form / Controls */}
                  <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                    {showSummonForm ? (
                      <div className="bg-black/30 border border-white/10 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <p className="text-sm font-black text-white flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-medical-green" /> Интихоби вақт барои даъват
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Рӯз / Сана</label>
                            <Input 
                              type="date" 
                              value={summonDate} 
                              onChange={(e) => setSummonDate(e.target.value)}
                              className="bg-zinc-950 border-white/10 text-white font-mono rounded-xl focus:ring-medical-green"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Соат</label>
                            <Input 
                              type="time" 
                              value={summonTime} 
                              onChange={(e) => setSummonTime(e.target.value)}
                              className="bg-zinc-950 border-white/10 text-white font-mono rounded-xl focus:ring-medical-green"
                            />
                          </div>
                        </div>
                        
                        {/* Custom Templates UI */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between items-center">
                            <span>Шаблонҳои СМС (SMS Templates)</span>
                            <span className="text-[9px] text-zinc-500 font-mono">Шаблони омодаро интихоб кунед</span>
                          </label>
                          
                          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {BUILT_IN_TEMPLATES.map((t) => {
                              const isSelected = selectedTemplateId === t.id && !isManualEdit;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTemplateId(t.id);
                                    setIsManualEdit(false);
                                  }}
                                  className={cn(
                                    "text-[11px] px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 cursor-pointer font-bold",
                                    isSelected 
                                      ? "bg-medical-green/10 border-medical-green text-medical-green" 
                                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                                  )}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                  <span>{t.title}</span>
                                </button>
                              );
                            })}

                            {customTemplates.map((t) => {
                              const isSelected = selectedTemplateId === t.id && !isManualEdit;
                              return (
                                <div
                                  key={t.id}
                                  onClick={() => {
                                    setSelectedTemplateId(t.id);
                                    setIsManualEdit(false);
                                  }}
                                  className={cn(
                                    "text-[11px] px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold",
                                    isSelected 
                                      ? "bg-medical-green/10 border-medical-green text-medical-green" 
                                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                                  )}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                  <span>{t.title}</span>
                                  <button 
                                    type="button"
                                    onClick={(e) => handleDeleteTemplate(e, t.id)}
                                    className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-zinc-500 transition-colors ml-1"
                                    title="Нест кардан"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-zinc-500 font-medium px-0.5">
                            {isManualEdit ? (
                              <button 
                                type="button"
                                onClick={() => setIsManualEdit(false)}
                                className="text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                              >
                                ✍️ Паёмак дастӣ таҳрир шуд (Барқарорсозии Шаблон)
                              </button>
                            ) : (
                              <span>✨ Алоқа бо тафсилоти бемори кунунӣ фаъол аст</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between items-center">
                            <span>Матни СМС барои бемор (Custom Message)</span>
                            <span className="text-[9px] text-zinc-500 font-mono">Бо дастгирии СМС</span>
                          </label>
                          <textarea
                            value={customSmsText}
                            onChange={(e) => {
                              setCustomSmsText(e.target.value);
                              setIsManualEdit(true);
                            }}
                            className="w-full bg-zinc-950 border border-white/10 text-zinc-200 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-medical-green/45 placeholder:text-zinc-600 min-h-[90px] font-medium leading-relaxed"
                            placeholder="Матни СМС-ро нависед..."
                          />
                        </div>

                        {/* Save custom template input form */}
                        <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 space-y-2">
                          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="w-3 h-3 text-medical-green" /> Захира кардани СМС-и кунунӣ ҳамчун шаблон
                          </p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Номи Шаблон (масалан: Барои дубора дидан)..."
                              value={newTemplateTitle}
                              onChange={(e) => setNewTemplateTitle(e.target.value)}
                              className="bg-zinc-950 border-white/10 text-xs rounded-xl h-8 text-white placeholder:text-zinc-600 focus:ring-medical-green"
                            />
                            <Button
                              type="button"
                              onClick={handleSaveAsTemplate}
                              className="h-8 text-xs bg-medical-green/10 text-medical-green hover:bg-medical-green/20 border border-medical-green/20 font-black px-3.5 rounded-xl flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" /> Сабт
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <Button 
                            variant="outline" 
                            className="flex-1 bg-white/5 border-white/10 hover:bg-neutral-800 text-white rounded-xl py-5 text-xs font-bold"
                            onClick={() => setShowSummonForm(false)}
                          >
                            Ба қафо
                          </Button>
                          <Button 
                            className="flex-1 medical-gradient text-black font-black uppercase tracking-wider rounded-xl py-5 text-xs shadow-lg shadow-medical-green/10"
                            disabled={isSummoning}
                            onClick={handleSendSummon}
                          >
                            {isSummoning ? "Фиристода истодааст..." : "Фиристодани СМС"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button 
                          className="w-full medical-gradient text-black font-black uppercase tracking-wider py-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-medical-green/10 hover:scale-[1.01] active:scale-[0.99]"
                          onClick={() => setShowSummonForm(true)}
                        >
                          <Bell className="w-5 h-5 animate-bounce" />
                          Фарёд кардани бемор
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full bg-white/5 border-white/10 text-white font-bold py-6 rounded-2xl"
                          disabled={selectedAppointment.status === "COMPLETED"}
                          onClick={() => {
                            updateStatus(selectedAppointment.id, "COMPLETED");
                            setSelectedAppointment(null);
                          }}
                        >
                          Хатми қабул
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10 flex flex-col items-center justify-center p-12 text-center h-full">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <ChevronRight className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Беморро интихоб кунед</h3>
              <p className="text-white font-black text-sm">Барои дидани тафсилот ба ягон сатри ҷадвал клик кунед</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function
// Done via import from utils
