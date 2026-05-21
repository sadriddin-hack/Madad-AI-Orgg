import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  LogIn, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/src/lib/api";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", formData);
      localStorage.setItem("madad_token", res.data.token);
      localStorage.setItem("madad_user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
      
      toast.success("Воридшавӣ муваффақона!") ;
      
      if (res.data.user.role === "ADMIN") {
        navigate("/admin");
      } else if (res.data.user.role === "DOCTOR") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Почта ё рамз хато аст");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <Card className="bg-zinc-900/90 border-white/10 backdrop-blur-3xl shadow-2xl rounded-[3rem] overflow-hidden">
          <div className="h-2 medical-gradient w-full" />
          <CardHeader className="p-10 pb-4 text-center">
            <div className="mx-auto w-16 h-16 bg-medical-green/10 rounded-full flex items-center justify-center mb-6">
              <LogIn className="w-8 h-8 text-medical-green" />
            </div>
            <CardTitle className="text-3xl font-black text-white">Хуш омадед</CardTitle>
            <CardDescription className="text-zinc-400 mt-2">Маълумоти худро барои воридшавӣ нависед</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4 space-y-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-medical-green transition-colors" />
                  <Input 
                    required
                    type="email"
                    placeholder="Почтаи электронӣ" 
                    className="pl-14 py-7 bg-white/5 border-white/10 text-white focus:ring-medical-green focus:border-medical-green rounded-2xl text-lg"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-medical-green transition-colors" />
                  <Input 
                    required
                    type="password"
                    placeholder="Рамзи воридшавӣ" 
                    className="pl-14 py-7 bg-white/5 border-white/10 text-white focus:ring-medical-green focus:border-medical-green rounded-2xl text-lg"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => toast.info("Функсияи ивази рамз ба зудӣ илова карда мешавад.")}
                  className="text-sm text-zinc-200 font-bold hover:text-medical-green transition-colors"
                >
                  Рамзро фаромӯш кардед?
                </button>
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className="w-full py-8 rounded-[1.5rem] font-black text-xl uppercase tracking-[0.2em] medical-gradient text-black shadow-[0_15px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                {loading ? "Дар ҳоли воридшавӣ..." : "Ворид шудан"}
              </Button>
            </form>

            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-4 text-white font-black tracking-widest">Ё ин ки</span>
              </div>
            </div>

            <Link 
              to="/register"
              className="w-full py-8 rounded-[1.5rem] border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 flex items-center justify-center"
            >
              Ҳисоб сохтан
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-2 text-white font-bold text-xs">
          <ShieldAlert className="w-4 h-4" />
          <span>Madad AI амнияти маълумоти шуморо кафолат медиҳад</span>
        </div>
      </div>
    </div>
  );
}
