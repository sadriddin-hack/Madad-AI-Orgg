import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  UserPlus, 
  Stethoscope, 
  Heart,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/src/lib/api";

type Role = "PATIENT" | "DOCTOR";

export default function Register({ onRegister }: { onRegister: (user: any) => void }) {
  const [role, setRole] = useState<Role>("PATIENT");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    specialty: "",
    city: "Н.СИНО",
    experience: "5 сол",
    location: "Маркази тиббии Душанбе"
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Рамзҳо мувофиқат намекунанд");
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        ...formData,
        role
      });
      localStorage.setItem("madad_token", res.data.token);
      localStorage.setItem("madad_user", JSON.stringify(res.data.user));
      onRegister(res.data.user);
      
      toast.success("Бақайдгирӣ муваффақона анҷом ёфт!");
      
      if (res.data.user.role === "DOCTOR") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Хатогӣ ҳангоми бақайдгирӣ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center bg-medical-dark/50">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Promo */}
        <div className="hidden lg:flex flex-col space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-medical-green/10 rounded-2xl">
              <Stethoscope className="w-8 h-8 text-medical-green" />
            </div>
            <h1 className="text-3xl font-black text-white italic">
              MADAD <span className="text-medical-green not-italic">AI</span>
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-zinc-100 leading-tight">
              Инқилоби тиббӣ дар <span className="text-medical-green">Тоҷикистон</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Ба паноҳгоҳи тиббии рақамии мо ҳамроҳ шавед. Хоҳ шумо бемор бошед, хоҳ мутахассис, Madad AI барои шумост.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-8">
            {[
              { icon: ShieldCheck, title: "Махфияти пурра", desc: "Маълумоти шумо зери ҳимояи СС" },
              { icon: Heart, title: "Ғамхории 24/7", desc: "Мушовири интеллектуалии доимӣ" }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                <div className="p-2 bg-medical-green/20 rounded-xl h-fit">
                  <item.icon className="w-5 h-5 text-medical-green" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-zinc-100 font-bold">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <Card className="bg-zinc-900/80 border-white/10 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black text-white">Бақайдгирӣ</CardTitle>
            <CardDescription className="text-zinc-400">Нақши худро интихоб кунед ва маълумотро ворид намоед</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRole("PATIENT")}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                  role === "PATIENT" 
                  ? "bg-medical-green/10 border-medical-green text-white" 
                  : "bg-white/5 border-white/10 text-zinc-200 hover:border-white/20 font-black"
                }`}
              >
                <div className={`p-3 rounded-2xl ${role === "PATIENT" ? "bg-medical-green/20" : "bg-white/5"}`}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-sm uppercase tracking-wider text-white">Бемор</span>
              </button>
              <button
                onClick={() => setRole("DOCTOR")}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                  role === "DOCTOR" 
                  ? "bg-blue-500/10 border-blue-500 text-white" 
                  : "bg-white/5 border-white/10 text-zinc-200 hover:border-white/20 font-black"
                }`}
              >
                <div className={`p-3 rounded-2xl ${role === "DOCTOR" ? "bg-blue-500/20" : "bg-white/5"}`}>
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-sm uppercase tracking-wider text-white">Духтур</span>
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    required
                    placeholder="Ному насаби пурра" 
                    className="pl-12 py-6 bg-white/5 border-white/10 text-white focus:ring-medical-green focus:border-medical-green rounded-2xl"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    required
                    type="email"
                    placeholder="Почтаи электронӣ" 
                    className="pl-12 py-6 bg-white/5 border-white/10 text-white focus:ring-medical-green focus:border-medical-green rounded-2xl"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    placeholder="Рақами телефон" 
                    className="pl-12 py-6 bg-white/5 border-white/10 text-white focus:ring-medical-green focus:border-medical-green rounded-2xl"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                {role === "DOCTOR" && (
                  <div className="space-y-4 p-4 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-left">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Маълумоти касбии духтур</p>
                    
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input 
                        required
                        placeholder="Ихтисос (м-н: Кардиолог)" 
                        className="pl-12 py-6 bg-white/5 border-white/10 text-white focus:ring-blue-500 focus:border-blue-500 rounded-2xl"
                        value={formData.specialty}
                        onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                      />
                    </div>

                    <div className="relative">
                      <Input 
                        required
                        placeholder="Собиқаи корӣ (м-н: 12 сол)" 
                        className="pl-6 py-6 bg-white/5 border-white/10 text-white focus:ring-blue-500 focus:border-blue-500 rounded-2xl"
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      />
                    </div>

                    <div className="relative">
                      <Input 
                        required
                        placeholder="Ҷойи кор (м-н: Маркази тиббии Душанбе)" 
                        className="pl-6 py-6 bg-white/5 border-white/10 text-white focus:ring-blue-500 focus:border-blue-500 rounded-2xl"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-white uppercase ml-1 block">Ноҳияи фаъолият (Зист):</label>
                      <select
                        required
                        className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-1 focus:ring-blue-500 font-bold focus:outline-none"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      >
                        <option value="Н.СИНО">Н.СИНО</option>
                        <option value="Н.РУДАКИ">Н.РУДАКИ</option>
                        <option value="Н.ФИРДАВСИ">Н.ФИРДАВСИ</option>
                        <option value="Н.ШОХМАНСУР">Н.ШОХМАНСУР</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    required
                    type="password"
                    placeholder="Рамзи воридшавӣ" 
                    className="pl-12 py-6 bg-white/5 border-white/10 text-white focus:ring-medical-green focus:border-medical-green rounded-2xl"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    required
                    type="password"
                    placeholder="Тасдиқи рамз" 
                    className="pl-12 py-6 bg-white/5 border-white/10 text-white focus:ring-medical-green focus:border-medical-green rounded-2xl"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className={`w-full py-7 rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${
                  role === "PATIENT" ? "medical-gradient text-black" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {loading ? "Дар ҳоли кор..." : "Бақайдгирӣ"}
                <UserPlus className="ml-3 w-5 h-5" />
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-white font-bold text-sm">
                Аллакай аъзо ҳастед?{" "}
                <Link to="/login" className="text-medical-green font-black hover:underline">
                  Ворид шудан
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
