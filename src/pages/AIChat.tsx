import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import api from "@/src/lib/api";

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load config
    const loadConfig = async () => {
      try {
        const res = await api.get("/config");
        setConfig(res.data);
      } catch (err) {
        console.warn("Could not read server config under background load", err);
      }
    };
    loadConfig();

    // Load doctors for context from server database
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/doctors");
        setAvailableDoctors(res.data);
      } catch (err) {
        console.warn("Could not load doctors count under background load", err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/chat", {
        message: input,
        history: messages.slice(-10),
        availableDoctors: availableDoctors.map(d => ({
          name: d.name,
          specialty: d.specialty,
          location: d.location
        }))
      });

      const data = response.data;
      const aiMessage: Message = { role: "model", parts: [{ text: data.text }] };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message || "Could not reach the AI advisor. Please check your connection.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    toast.success("Consultation session reset.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto glass rounded-[32px] overflow-hidden border-white/5 relative shadow-2xl">
      {/* Header */}
      <div className="bg-white/5 px-6 py-3.5 border-b border-white/10 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full medical-gradient flex items-center justify-center relative">
            <Bot className="text-white w-6 h-6" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-medical-green border-2 border-medical-dark rounded-full shadow-lg" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-lg leading-none">Мушовири MADAD AI</h2>
            <p className="text-[10px] uppercase tracking-[0.15em] text-medical-green font-black mt-1 opacity-80">
              СУ: ЗОКИРОВ САДРИДДИН
            </p>
          </div>
        </div>
        <button 
          onClick={resetChat}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          title="Reset Consultation"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Warning/Disclaimer bar */}
      <div className="bg-yellow-500/10 px-4 py-2 flex items-center gap-2 border-b border-yellow-500/10 justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
          <p className="text-[10px] text-yellow-500 font-medium uppercase tracking-tight">
            ИН ГУНА ДИАГНОЗИ ТИББӢ НЕСТ. ДАР ҲОЛАТИ ХАТАР БА ХАДАМОТИ ФАВРӢ ЗАНГ ЗАНЕД.
          </p>
        </div>
        {config?.emergencyContact && (
          <a href={`tel:${config.emergencyContact}`} className="text-[10px] bg-red-500 text-white px-3 py-1 rounded-full font-black animate-pulse">
            {config.emergencyContact}
          </a>
        )}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-50">
            <ShieldCheck className="w-16 h-16 text-medical-green" />
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-xl font-bold">Мушовири тиббии сунъӣ</h3>
              <p className="text-sm text-gray-400">
                <span className="text-medical-green font-bold">Чаро MADAD AI?</span> MADAD AI барои таъмини дастрасии ҳамагонӣ ба машваратҳои тиббӣ тавассути зеҳни сунъии муосир сохта шудааст. 
                Ин лоиҳа аз ҷониби <span className="text-white font-bold">ЗОКИРОВ САДРИДДИН</span> бо мақсади кумак ба мардум дар ҳолатҳои зарурӣ ва роҳнамоии дурусти тиббӣ таҳия шудааст.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {["Чаро MADAD AI?", "Таҳлили пурраи дарди сар давоми 2 рӯз", "Маълумоти муфассал оид ба доғҳои пӯст", "Нақшаи пурраи солимгардонии дил"].map(hint => (
                <button 
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 hover:border-medical-green/40 hover:bg-white/10 transition-all text-xs font-bold text-gray-300"
                >
                  "{hint}"
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex items-start gap-4 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === "user" ? "bg-white/10" : "medical-gradient"
              )}>
                {msg.role === "user" ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className={cn(
                "px-5 py-3 rounded-[22px] text-sm sm:text-base leading-relaxed shadow-md",
                msg.role === "user" 
                  ? "bg-emerald-600 text-white rounded-tr-none green-glow font-medium" 
                  : "glass text-gray-100 rounded-tl-none border border-white/5"
              )}>
                <div className="markdown-body prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                   <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex items-start gap-4 mr-auto">
            <div className="w-8 h-8 rounded-full medical-gradient flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-medical-dark border border-white/10 px-5 py-3 rounded-[20px] rounded-tl-none">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-medical-green rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-medical-green rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-medical-green rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative group"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Саволҳои тиббии худро нависед..."
            className="w-full bg-medical-dark border border-white/10 rounded-xl py-3.5 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-medical-green/40 transition-all text-sm sm:text-base font-bold text-white placeholder:text-gray-600 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1.5 p-2.5 bg-medical-green text-white rounded-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[9px] text-center mt-2.5 text-white uppercase tracking-[0.2em] font-black">
          MADAD AI • ТЕХНОЛОГИЯИ ЗЕҲНИ СУНЪӢ
        </p>
      </div>
    </div>
  );
}
