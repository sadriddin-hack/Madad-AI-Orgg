import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Bell, 
  Loader2, 
  User, 
  ArrowLeft,
  MessageCircle,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/src/lib/api";
import { io } from "socket.io-client";
import { cn } from "@/src/lib/utils";

interface SMSInboxProps {
  user: any;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  text: string;
  sentAt: string;
}

interface Contact {
  id: string; // Patient or Doctor ID
  name: string;
  role: "DOCTOR" | "PATIENT";
  specialty?: string;
  phone?: string;
  appointmentId: string;
  appointmentStatus: string;
  symptoms: string;
  aiSummary?: string;
  smsHistory: any[];
}

export default function SMSInbox({ user }: SMSInboxProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Chatting state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState<"chat" | "official">("chat");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Mobile navigation
  const [showMobileChat, setShowMobileChat] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Fetch all appointments (contacts)
  const fetchAppointmentsAndContacts = async () => {
    if (!user) return;
    setIsLoadingContacts(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
      
      // Process appointments to find unique contacts depending on role
      const apts = res.data || [];
      const contactMap: Record<string, Contact> = {};

      apts.forEach((apt: any) => {
        if (user.role === "PATIENT") {
          // Contact is the doctor
          contactMap[apt.doctorId] = {
            id: apt.doctorId,
            name: apt.doctorName,
            role: "DOCTOR",
            specialty: apt.doctorSpecialty,
            appointmentId: apt.id,
            appointmentStatus: apt.status,
            symptoms: apt.symptoms,
            aiSummary: apt.aiSummary,
            smsHistory: apt.smsHistory || []
          };
        } else if (user.role === "DOCTOR") {
          // Contact is the patient
          contactMap[apt.patientId] = {
            id: apt.patientId,
            name: apt.patientName,
            role: "PATIENT",
            phone: apt.patientPhone,
            appointmentId: apt.id,
            appointmentStatus: apt.status,
            symptoms: apt.symptoms,
            aiSummary: apt.aiSummary,
            smsHistory: apt.smsHistory || []
          };
        } else {
          // Admin can see both patients and doctors from appointments
          contactMap[apt.doctorId] = {
            id: apt.doctorId,
            name: apt.doctorName,
            role: "DOCTOR",
            specialty: apt.doctorSpecialty,
            appointmentId: apt.id,
            appointmentStatus: apt.status,
            symptoms: apt.symptoms,
            aiSummary: apt.aiSummary,
            smsHistory: apt.smsHistory || []
          };
          contactMap[apt.patientId] = {
            id: apt.patientId,
            name: apt.patientName,
            role: "PATIENT",
            phone: apt.patientPhone,
            appointmentId: apt.id,
            appointmentStatus: apt.status,
            symptoms: apt.symptoms,
            aiSummary: apt.aiSummary,
            smsHistory: apt.smsHistory || []
          };
        }
      });

      const processedContacts = Object.values(contactMap);
      setContacts(processedContacts);

      // Restore active selected contact if it exists in the new list
      if (selectedContact) {
        const updatedSelected = processedContacts.find(c => c.id === selectedContact.id);
        if (updatedSelected) {
          setSelectedContact(updatedSelected);
        }
      }
    } catch (err) {
      console.error("Error fetching appointments and messages:", err);
      toast.error("Хатогӣ ҳангоми боркунии рӯйхати навбатҳо.");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Fetch messages with specific contact
  const fetchMessages = async (contactId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/messages?contactId=${contactId}`);
      setMessages(res.data || []);
    } catch (err) {
      console.warn("Could not load messages:", err);
      toast.error("Канал ёфт нашуд ё хатогии шабака.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Connect WebSockets
  useEffect(() => {
    if (!user) return;
    
    fetchAppointmentsAndContacts();

    // Setup socket io
    const socket = io();
    socketRef.current = socket;
    socket.emit("join", { userId: user.id, role: user.role });

    // Live listening for SMS updates or chat messages
    socket.on("new_sms", (msg: Message) => {
      // Check if message is for/from current user
      const isRelevance = 
        msg.senderId === user.id || 
        msg.receiverId === user.id;

      if (isRelevance) {
        // If it's with our currently open chat, append it
        setSelectedContact((currentSel) => {
          if (currentSel && (msg.senderId === currentSel.id || msg.receiverId === currentSel.id)) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          } else {
            // Trigger background alert toast
            toast.info(`Паёми нав аз ${msg.senderName}: "${msg.text.substring(0, 30)}..."`);
          }
          return currentSel;
        });

        // Trigger updates to reload list totals
        fetchAppointmentsAndContacts();
      }
    });

    socket.on("patient_summoned", (data) => {
      if (user.role === "PATIENT" && data.patientId === user.id) {
        toast.success("Даъватномаи ҷадид аз тарафи духтур фиристода шуд!");
        fetchAppointmentsAndContacts();
      }
    });

    socket.on("appointment_update", () => {
      fetchAppointmentsAndContacts();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Read message when selectedContact changes
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact]);

  // Scroll to bottom helper
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoadingMessages, activeChatTab]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact || isSending) return;

    const textPayload = inputText.trim();
    setIsSending(true);
    setInputText("");

    try {
      const res = await api.post("/messages", {
        receiverId: selectedContact.id,
        text: textPayload
      });
      // Append message locally dynamically (it will be broadcast too, socket protects duplicates)
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
    } catch (err) {
      toast.error("СМС на рафт. Шабака ё калиди пайвастшавӣ қатъ аст.");
      setInputText(textPayload); // put back
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowMobileChat(true);
  };

  // Filter contacts by query
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.specialty && c.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const quickReplies = {
    DOCTOR: [
      "Салом, ман омодаам шуморо қабул кунам. Марҳамат дароед.",
      "Лутфан таҳлилҳоро бо худатон гиред.",
      "Доруҳои навишташударо мунтазам истеъмол кунед.",
      "Агар вазъият вазнин шавад, фавран тамос гиред."
    ],
    PATIENT: [
      "Салом доктор, ман дар берун мунтазири даъват ҳастам.",
      "Ташаккури зиёд барои тавсияҳо!",
      "Ман ҳозир ба клиника мерасам.",
      "Илтимос ба ман нишон диҳед, ки чӣ тавр доруро гирам."
    ],
    ADMIN: [
      "Салом, ҳамаи паёмҳо дар база сабт мешаванд."
    ]
  };

  const activeQuickReplies = quickReplies[user.role as "PATIENT" | "DOCTOR" | "ADMIN"] || quickReplies.PATIENT;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6 min-h-[75vh]">
      
      {/* Dynamic Dashboard Banner */}
      <div className="relative overflow-hidden glass rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center md:justify-between gap-6">
        <div className="absolute top-0 right-0 -z-10 w-64 h-64 medical-gradient blur-[100px] opacity-10 rounded-full animate-pulse" />
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="bg-medical-green/10 p-4 rounded-2xl shrink-0">
            <MessageSquare className="w-10 h-10 text-medical-green" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic sm:not-italic">
              Маркази СМС ва Чатӣ
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-bold mt-1">
              {user.role === "PATIENT" 
                ? "Бо духтури худ дар тамос бошед ва паёмҳои мустақими СМС гиред." 
                : "Муошират бо беморон ва расонидани ёрии аввал дар реҷаи воқеӣ (Real-Time)."}
            </p>
          </div>
        </div>
        <div className="text-center md:text-right shrink-0">
          <span className="text-[10px] bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-zinc-300 font-black uppercase tracking-widest">
            ЛОИҲАИ С. ЗОКИРОВ
          </span>
        </div>
      </div>

      {/* Main Inbox layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/20 border border-white/5 rounded-3xl min-h-[580px] overflow-hidden">
        
        {/* CONTACTS SIDEBAR Sized 4 cols */}
        <div className={cn(
          "lg:col-span-4 border-r border-white/5 flex flex-col bg-black/40",
          showMobileChat ? "hidden lg:flex" : "flex"
        )}>
          {/* Sidebar Search Bar Header */}
          <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">
              Ҳамсуҳбатон ({contacts.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Ҷустуҷӯ бо ном ва унвон..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-white/5 hover:border-white/10 text-xs rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-medical-green/50 font-bold transition-all"
              />
            </div>
          </div>

          {/* Sidebar scroll list list */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
            {isLoadingContacts ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-medical-green" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Боркунии рӯйхат...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-600 space-y-3">
                <User className="w-12 h-12 opacity-25" />
                <p className="text-xs font-bold leading-normal italic">
                  Ягон ҳамсуҳбат ёфт нашуд.
                </p>
                {user.role === "PATIENT" && (
                  <Link 
                    to="/doctors" 
                    className="text-[10px] uppercase font-black tracking-wider text-medical-green bg-medical-green/10 border border-medical-green/20 px-4 py-2 rounded-xl transition-all"
                  >
                    Интихоби духтур
                  </Link>
                )}
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                const statusTheme = 
                  contact.appointmentStatus === "IN_PROGRESS" ? "text-medical-green border-medical-green/40 bg-medical-green/10 animate-pulse" :
                  contact.appointmentStatus === "COMPLETED" ? "text-zinc-500 border-zinc-500/20 bg-zinc-500/5" :
                  "text-yellow-500 border-yellow-500/20 bg-yellow-500/5";

                const displayStatus = 
                  contact.appointmentStatus === "IN_PROGRESS" ? "ҚАБУЛ ОҒОЗ ШУД" :
                  contact.appointmentStatus === "COMPLETED" ? "ХАТМ ШУД" : "ДАР НАВБАТ";

                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl flex items-center justify-between border cursor-pointer transition-all gap-3",
                      isSelected 
                        ? "bg-medical-green/5 border-medical-green text-white shadow-lg" 
                        : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black relative shrink-0",
                        contact.role === "DOCTOR" ? "bg-emerald-600/20 text-medical-green border border-emerald-500/20" : "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                      )}>
                        {contact.name.substring(0, 2).toUpperCase()}
                        <span className={cn(
                          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-950",
                          contact.role === "DOCTOR" ? "bg-emerald-500" : "bg-blue-500"
                        )} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-sm text-white line-clamp-1">{contact.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {contact.role === "DOCTOR" ? (contact.specialty || "Мутахассис") : (contact.phone || "Бемор")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("text-[8px] font-black border px-2 py-0.5 rounded-md", statusTheme)}>
                        {displayStatus}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT MAIN CONTAINER Sized 8 cols */}
        <div className={cn(
          "lg:col-span-8 flex flex-col bg-zinc-950/10",
          !showMobileChat ? "hidden lg:flex" : "flex"
        )}>
          {selectedContact ? (
            <div className="flex-grow flex flex-col h-full h-[580px]">
              {/* Header profile info */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowMobileChat(false)}
                    className="lg:hidden p-2 text-zinc-400 hover:text-white bg-white/5 rounded-xl border border-white/5 scale-95 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 bg-medical-green/10 rounded-2xl flex items-center justify-center text-medical-green shrink-0 border border-medical-green/25">
                    {selectedContact.role === "DOCTOR" ? <Stethoscope className="w-5 h-5 text-medical-green" /> : <UserCheck className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">{selectedContact.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {selectedContact.role === "DOCTOR" ? `${selectedContact.specialty} (ДУХТУРИ ЛОИҲА)` : `тел: ${selectedContact.phone || "Нишон надорад"} (БЕМОР)`}
                    </p>
                  </div>
                </div>

                {/* Sub-tabs Selection for Direct Chat vs Summons */}
                <div className="flex gap-1.5 bg-black/50 p-1 border border-white/5 rounded-xl shrink-0">
                  <button
                    onClick={() => setActiveChatTab("chat")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer",
                      activeChatTab === "chat" 
                        ? "bg-medical-green text-black font-black" 
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    💬 ЧАТ БАРОИ СУҲБАТ
                  </button>
                  <button
                    onClick={() => setActiveChatTab("official")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1",
                      activeChatTab === "official" 
                        ? "bg-medical-green text-black font-black" 
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Bell className="w-3 h-3" /> СМС-Ҳушдорҳо
                  </button>
                </div>
              </div>

              {/* Chat Viewport Area */}
              <div 
                ref={scrollContainerRef}
                className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-black/5"
              >
                {activeChatTab === "chat" ? (
                  isLoadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-medical-green" />
                      <span className="text-xs text-zinc-500 font-bold uppercase">СМС паёмҳо кушода шуда истодаанд...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full max-w-sm mx-auto space-y-3 py-10">
                      <MessageCircle className="w-12 h-12 text-zinc-700 opacity-40 animate-pulse" />
                      <h4 className="font-black text-white text-sm">Таърихи суҳбати кушод холӣ аст</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-bold">
                        Шумо метавонед аввалин паёми худро дар ин ҷо нависед. Паёми шумо дар база сабт мешавад ва фавран дастрас мегардад.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === user.id;
                      return (
                        <div 
                          key={m.id} 
                          className={cn(
                            "flex flex-col max-w-[80%] md:max-w-[70%]",
                            isMe ? "ml-auto items-end" : "mr-auto items-start animate-fade-in"
                          )}
                        >
                          <div className={cn(
                            "px-4 py-3 rounded-[20px] text-xs leading-relaxed shadow-lg font-bold transition-all",
                            isMe 
                              ? "bg-medical-green text-black rounded-tr-none hover:bg-emerald-400" 
                              : "bg-zinc-900 text-zinc-200 border border-white/5 rounded-tl-none hover:border-white/10"
                          )}>
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </div>
                          <span className="text-[8px] text-zinc-600 mt-1.5 font-mono px-1">
                            {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )
                ) : (
                  /* Official Summons SMS Tab View */
                  <div className="space-y-4 py-2">
                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 flex gap-3 text-xs leading-normal font-bold text-yellow-500/90 items-start">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>
                        Дар ин қисмат паёмҳои расмии кутоҳи СМС ва даъватномаҳои сиёҳии духтур (Summons) нишон дода мешаванд, ки бевосита ба рақами телефони шумо низ ҳамчун СМС дастрас шудаанд.
                      </p>
                    </div>

                    {selectedContact.smsHistory && selectedContact.smsHistory.length > 0 ? (
                      selectedContact.smsHistory.map((sms: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 md:p-5 space-y-3 shadow-md">
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                            <span className="text-medical-green font-black uppercase tracking-wider flex items-center gap-1">
                              <Bell className="w-3.5 h-3.5 text-medical-green" /> СМС ДАЪВАТНОМАИ РАСМӢ
                            </span>
                            <span>{new Date(sms.sentAt).toLocaleString()}</span>
                          </div>
                          <p className="text-zinc-200 text-sm italic font-black leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                            "{sms.text}"
                          </p>
                          {sms.date && sms.time && (
                            <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5">
                              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-bold">
                                <Calendar className="w-4 h-4 text-medical-green" />
                                Рӯз: <span className="text-white font-mono bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">{sms.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-bold">
                                <Clock className="w-4 h-4 text-medical-green" />
                                Соат: <span className="text-white font-mono bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">{sms.time}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-12 text-zinc-600 space-y-2">
                        <Bell className="w-10 h-10 opacity-30 animate-pulse" />
                        <p className="text-xs italic font-bold">Барои ин навбат ягон СМС ҳушдор навишта нашудааст.</p>
                      </div>
                    )}

                    {/* Show original symptoms */}
                    <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 space-y-2 mt-6">
                      <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Вазъияти баёнкардаи бемор:</h4>
                      <p className="text-white text-xs font-semibold bg-black/50 px-3.5 py-3 rounded-xl border border-white/10 shadow-inner">
                        "{selectedContact.symptoms}"
                      </p>
                      {selectedContact.aiSummary && (
                        <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                          <h4 className="text-[10px] text-medical-green font-black uppercase tracking-wider">Таҳлили AI:</h4>
                          <p className="text-zinc-400 text-[11px] leading-relaxed max-h-[120px] overflow-y-auto pr-1">
                            {selectedContact.aiSummary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Send Controls form */}
              {activeChatTab === "chat" && (
                <div className="p-4 border-t border-white/5 bg-black/45 space-y-3 shrink-0">
                  {/* Active quick replies */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {activeQuickReplies.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInputText(q)}
                        className="whitespace-nowrap bg-zinc-900 border border-white/5 text-[10px] text-zinc-300 font-black px-3.5 py-2 rounded-xl hover:border-medical-green/40 hover:bg-zinc-850 active:scale-95 transition-all shrink-0 cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Send Input Panel Form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2.5">
                    <input 
                      type="text"
                      placeholder="СМС паёми мустақим нависед..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-grow bg-zinc-950 border border-white/10 text-white font-bold text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-medical-green/50 placeholder:text-zinc-650 shadow-inner"
                    />
                    <button 
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className="px-6 py-3.5 bg-medical-green text-black rounded-xl hover:scale-102 active:scale-98 disabled:opacity-50 transition-all font-black text-xs tracking-widest uppercase flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>ИРСОЛ</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Chat default placeholder when no contact selected */
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 py-24 space-y-4 h-[580px]">
              <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center border border-white/5 shadow-inner">
                <MessageSquare className="w-8 h-8 text-zinc-500 animate-bounce" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-white font-black text-sm uppercase tracking-wide">Паёмокро кушоед</h4>
                <p className="text-xs text-zinc-500 leading-normal font-bold">
                  Лутфан аз рӯйхати суҳбатҳои тарафи чап яке аз ҳамсуҳбатҳоро интихоб кунед то мукотибаи СМС дар вақти воқеӣ кушода шавад.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
