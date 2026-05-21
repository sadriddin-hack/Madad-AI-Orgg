import { motion } from "motion/react";
import { Send, BookOpen, Atom, Globe, FlaskConical, Users, Phone } from "lucide-react";

export default function TelegramBot() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row items-center gap-10 glass p-8 md:p-12 rounded-[40px] border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-64 h-64 medical-gradient blur-[100px] opacity-20 rounded-full" />
        
        <div className="shrink-0 w-32 h-32 md:w-48 md:h-48 bg-blue-500/20 rounded-3xl flex items-center justify-center relative ring-4 ring-blue-500/10">
          <Send className="w-20 h-20 md:w-32 md:h-32 text-blue-500 animate-pulse -rotate-12" />
          <div className="absolute -bottom-4 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">@MADADAI_ROBOT</div>
        </div>

        <div className="space-y-6 text-center md:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Телеграм Боти мо</h1>
            <p className="text-gray-400 max-w-xl">
              Дастрасӣ ба рӯйхатҳои клиникӣ, захираҳои таълимӣ ва тамосҳои фаврӣ тавассути интерфейси босуръати Телеграм.
            </p>
          </div>
          <a 
            href="https://t.me/MADADAI_ROBOT" 
            target="_blank" 
            rel="noreferrer"
            className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] mx-auto md:mx-0 w-fit"
          >
            Кушодани Телеграм Бот
            <Send className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <Users className="w-6 h-6" />
            <h3 className="font-bold text-lg">Феҳристи духтурон</h3>
          </div>
          <ul className="space-y-3">
            {["Рӯйхати ҳамаи мутахассисон", "Хатҳои фаврии тамос", "Рейтингҳо дар асоси баррасиҳо"].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <BookOpen className="w-6 h-6" />
            <h3 className="font-bold text-lg">Дастгирии таълимӣ</h3>
          </div>
          <ul className="space-y-3">
            {["Интихоби беҳтарин омӯзгорон", "Маводҳои омӯзишии биология", "Тестҳои интерактивии химия", "Омӯзиши элитаи физика", "Мураббиёни забони тоҷикӣ"].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-purple-400">
            <Atom className="w-6 h-6" />
            <h3 className="font-bold text-lg">STEM ва Забон</h3>
          </div>
          <ul className="space-y-3">
            {["Омӯзиши элитаи физика", "Мураббиёни забони тоҷикӣ", "Роҳнамои стипендияҳои ҷаҳонӣ"].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="bg-medical-dark/50 border border-white/5 p-8 rounded-[32px] space-y-8">
        <h2 className="text-2xl font-bold text-center">Хусусиятҳои ҳамгироии бот</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: <FlaskConical className="text-red-400" />, label: "Химия" },
            { icon: <Atom className="text-blue-400" />, label: "Физика" },
            { icon: <Globe className="text-emerald-400" />, label: "Биология" },
            { icon: <BookOpen className="text-yellow-400" />, label: "Тоҷикӣ" },
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                {feat.icon}
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-white">{feat.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
