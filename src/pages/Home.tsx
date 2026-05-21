import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Shield, Activity, Brain, MessageSquare, ArrowRight, Star } from "lucide-react";

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 md:pt-20">
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] medical-gradient blur-[120px] opacity-20 rounded-full" />
        
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full border-medical-green/20"
          >
            <Star className="w-4 h-4 text-medical-green fill-medical-green" />
            <span className="text-sm font-medium text-medical-green">Насли нави зеҳни сунъии тиббӣ</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight"
          >
            Коршиноси <br />
            <span className="text-medical-green drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">тиббии шахсии шумо</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white font-black max-w-2xl mx-auto leading-relaxed"
          >
            MADAD AI кумаки оқилонаи тиббӣ, таҳлили аломатҳо ва пешниҳодҳои ёрии аввалинро 24/7 пешкаш мекунад. Бе интизорӣ, танҳо роҳнамоии касбӣ.
          </motion.p>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link 
              to="/chat" 
              className="medical-gradient px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              Оғози машварат
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/doctors" 
              className="glass px-8 py-4 rounded-2xl font-black text-lg text-medical-green flex items-center justify-center gap-2 hover:bg-white/15 transition-all border-white/10"
            >
              Духтурони тавсияшуда
            </Link>
            <Link 
              to="/sms" 
              className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-lg text-emerald-400 flex items-center justify-center gap-2 hover:bg-white/15 hover:border-emerald-500/30 transition-all shadow-xl"
            >
              <MessageSquare className="w-5 h-5 text-emerald-400 animate-pulse" />
              Панели СМС
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={item} className="glass p-8 rounded-3xl space-y-4 hover:border-medical-green/30 transition-colors">
          <div className="bg-medical-green/10 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Brain className="text-medical-green w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-medical-green">Таҳлили амиқи аломатҳо</h3>
          <p className="text-white font-bold text-sm leading-relaxed">
            Шабакаи нейронии мо аломатҳои шуморо дар асоси махзанҳои бузурги маълумоти тиббӣ таҳлил карда, сабабҳои имконпазирро пешниҳод мекунад.
          </p>
        </motion.div>

        <motion.div variants={item} className="glass p-8 rounded-3xl space-y-4 hover:border-medical-green/30 transition-colors">
          <div className="bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Shield className="text-blue-500 w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-medical-green">Роҳнамоии ёрии аввалин</h3>
          <p className="text-white font-bold text-sm leading-relaxed">
            Протоколҳои фаврии ҳолатҳои фавқулодда ва дастурҳои зина ба зинаи ёрии аввалин пеш аз расидан ба беморхона.
          </p>
        </motion.div>

        <motion.div variants={item} className="glass p-8 rounded-3xl space-y-4 hover:border-medical-green/30 transition-colors">
          <div className="bg-purple-500/10 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Activity className="text-purple-500 w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-medical-green">Интихоби духтур</h3>
          <p className="text-white font-bold text-sm leading-relaxed">
            Тавсияҳои инфиродӣ барои мутахассисони тиббӣ дар асоси нигарониҳои мушаххаси саломатии шумо гиред.
          </p>
        </motion.div>
      </motion.section>

      {/* SMS Section Showcase */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950/20 via-zinc-900/40 to-black/30 border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-medical-green/10 blur-[100px] rounded-full" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-6 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <MessageSquare className="w-3.5 h-3.5 animate-pulse" /> Навсозии навбат ва СМСҳои мустақим
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight text-left">
              Даъватномаҳои расмии духтур <br />
              ва <span className="text-medical-green">паёмакҳои СМС ба телефон</span>
            </h2>
            <p className="text-zinc-300 font-bold text-sm leading-relaxed text-left">
              Вақте ки духтур дархостро тасдиқ мекунад ё шуморо ба қабул даъват менамояд, огоҳинома фавран ҳам дар сомона ва ҳам ҳамчун паёми СМС ба рақами телефони шумо ирсол мешавад. Дигар лозим нест, ки дар навбатҳои тӯлонӣ вақти худро интизор шавед.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 justify-start">
              <Link 
                to="/sms" 
                className="medical-gradient text-black font-black text-sm uppercase px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-medical-green/20"
              >
                <MessageSquare className="w-4 h-4" />
                Санҷиши паёмҳои ман (SMS Inbox)
              </Link>
              <Link
                to="/doctors"
                className="bg-white/5 border border-white/10 text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                Навбат гирифтан ба духтур
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-96 bg-zinc-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 font-sans relative text-left">
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black animate-bounce shadow-lg">
              1
            </div>
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">🔔 Даъват аз духтур</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">10:45 AM</span>
            </div>
            
            <p className="text-xs text-zinc-400 font-black text-left">СМС-хабарнома аз ҷониби доктор Садриддин Зокиров:</p>
            
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl italic text-xs text-zinc-200 font-medium leading-relaxed text-left">
              "Бемори азиз, навбати шумо расид. Лутфан ба ҳуҷраи кории духтур ворид шавед. Сана ва соати даъват: Имрӯз соати 10:45."
            </div>
            
            <div className="flex justify-between items-center text-[9px] text-emerald-400/80 font-mono border-t border-white/10 pt-2">
              <span>Статус: Расонида шуд</span>
              <span>MADAD AI SMS Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="glass rounded-[40px] p-10 md:p-20 border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] medical-gradient blur-[100px] opacity-10 rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative z-10">
          <motion.div whileHover={{ y: -5 }} className="space-y-3 p-4 rounded-3xl transition-colors hover:bg-white/5">
            <div className="text-4xl md:text-6xl font-black text-medical-green drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">24/7</div>
            <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/40 font-black">Дастрасӣ</div>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="space-y-3 p-4 rounded-3xl transition-colors hover:bg-white/5">
            <div className="text-4xl md:text-6xl font-black text-medical-green drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">99%</div>
            <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/40 font-black">Вақти кор</div>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="space-y-3 p-4 rounded-3xl transition-colors hover:bg-white/5">
            <div className="text-4xl md:text-6xl font-black text-medical-green drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">5k+</div>
            <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/40 font-black">Истифодабарандагон</div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-8 bg-zinc-900/50 py-20 rounded-[40px] border border-white/5">
        <h2 className="text-3xl md:text-4xl font-black text-medical-green drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">Ба кумаки фаврӣ ниёз доред?</h2>
        <p className="text-white font-black max-w-xl mx-auto">
          Ёвари мо бо зеҳни сунъӣ омода аст, ки аломатҳои шуморо шунавад ва ҳозир роҳнамоии касбӣ диҳад.
        </p>
        <Link 
          to="/chat" 
          className="medical-gradient inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl shadow-[0_15px_30px_rgba(16,185,129,0.1)] hover:scale-105 transition-transform"
        >
          <MessageSquare className="w-6 h-6" />
          Сӯҳбат бо ёвари сунъӣ
        </Link>
      </section>
    </div>
  );
}
