import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import cors from "cors";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "madad-ai-secret-2026";
const DB_PATH = path.join(process.cwd(), "db.json");

// Helper to get DB
const getDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
      users: [], 
      appointments: [],
      doctors: [],
      config: {
        instagram: "https://www.instagram.com/madad_ai_tj",
        telegramBot: "https://t.me/MADADAI_ROBOT",
        emergencyContact: "+992 000 00 00",
        aiModel: "gemini-3.5-flash"
      }
    }));
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let changes = false;
  
  if (!db.doctors || db.doctors.length === 0) {
    db.doctors = [
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
    changes = true;
  }
  
  if (!db.users) {
    db.users = [];
    changes = true;
  }

  const hasAdmin = db.users.some((u: any) => u.email === "zokirovsadriddin65@gmail.com");
  if (!hasAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("Dushanbe24@", salt);
    db.users.push({
      id: "admin_sadriddin",
      fullName: "Садриддин Зокиров",
      email: "zokirovsadriddin65@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
      phone: "+992 93 999 9999",
      specialty: "",
      createdAt: new Date().toISOString()
    });
    changes = true;
  }

  if (!db.config) {
    db.config = {
      instagram: "https://www.instagram.com/madad_ai_tj",
      telegramBot: "https://t.me/MADADAI_ROBOT",
      emergencyContact: "+992 000 00 00",
      aiModel: "gemini-3.5-flash"
    };
    changes = true;
  }

  if (!db.config.promoAd) {
    db.config.promoAd = {
      text: "Маркази тиббии оилавии MADAD AI - Ҳамеша ба хидмати шумо!",
      mediaUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
      mediaType: "image",
      updatedAt: Date.now()
    };
    changes = true;
  }

  if (changes) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
  return db;
};

// Helper to save DB
const saveDB = (data: any) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const getGeminiApiKey = (): string | undefined => {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    try {
      const dotenvExamplePath = path.join(process.cwd(), ".env.example");
      if (fs.existsSync(dotenvExamplePath)) {
        const content = fs.readFileSync(dotenvExamplePath, "utf-8");
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("GEMINI_API_KEY")) {
            const parts = trimmed.split("=");
            if (parts.length > 1) {
              let val = parts.slice(1).join("=").trim();
              // Strip leading and trailing quotes if any
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
              }
              if (val && val !== "MY_GEMINI_API_KEY" && val !== "YOUR_GEMINI_API_KEY" && val.trim() !== "") {
                return val;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error reading .env.example for API key:", e);
    }
  }
  return apiKey;
};

let aiInstance: GoogleGenAI | null = null;
let currentApiKey: string | undefined = undefined;

const getAI = () => {
  const apiKey = getGeminiApiKey();
  if (!aiInstance || apiKey !== currentApiKey) {
    currentApiKey = apiKey;
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
};

const getLocalMedicalFeedback = (message: string, isChatFlow = true): string => {
  const norm = message.toLowerCase();
  
  let symptomsAnalysis = "";
  let potentialCauses = "";
  let firstAid = "";
  let recommendedSpecialty = "";
  let criticalTests = "";
  let doctorQuestions = "";
  
  if (norm.includes("дил") || norm.includes("фишор") || norm.includes("кардио") || norm.includes("нафас") || norm.includes("қафас")) {
    symptomsAnalysis = "Аломатҳои баёнгардида (дард дар соҳаи дил, халадоршавии фишори хун ё нооромии нафаскашӣ) метавонанд нишонаи фишори баланди хун, спазми рагҳои дил ё хастагии аз ҳад зиёди ҷисмонӣ бошанд.";
    potentialCauses = "- Гипертония (фишори баланди артериалӣ)\n- Спазми рагҳои коронарӣ (Стенокардия)\n- Омилҳои асабӣ ва стресси равонӣ (Кардионевроз)";
    firstAid = "1. Бодиққат ва дар оромии комил нишаста, гиребони либосҳоро холӣ кунед, то нафаскашӣ осон шавад.\n2. Фишори хун ва набзи худро чен кунед.\n3. Дар сурати дард аз ҳавои тоза нафас кашед ва ба духтури кардиолог муроҷиат намоед.";
    recommendedSpecialty = "Кардиолог. Тавсия медиҳем, ки фавран ба Д-р Алишер Воҳидов (Маркази тиббии Душанбе, Тел: +992 900 11 22 33) барои санҷиш муроҷиат кунед.";
    criticalTests = "ЭКГ (Электрокардиограмма), УЗИ-и дил (ЭхоКГ), санҷиши хун барои холестерин.";
    doctorQuestions = "Оё дард ба дасти чап ё китф мегузарад? Оё ҳангоми роҳ рафтан нафастангӣ мешается?";
  } 
  else if (norm.includes("таб") || norm.includes("ҳарорат") || norm.includes("грипп") || norm.includes("сулфа") || norm.includes("зуком") || norm.includes("гулӯ") || norm.includes("гулуяш") || norm.includes("сина")) {
    symptomsAnalysis = "Аломатҳои зикршуда (ҳарорати баланд, сулфа, зуком ё дарди гулӯ) бештар дар вақти илтиҳоби роҳҳои нафас ва сироятҳои вирусии фаслӣ ба миён меоянд.";
    potentialCauses = "- Сирояти вирусии роҳҳои нафас (АРВИ / Зуком)\n- Илтиҳоби бодомакҳо ё гулӯдард (Ангина / Фарингит)\n- Бронхит ё илтиҳоби шуш (Дар сурати сулфаи дурудароз)";
    firstAid = "1. Оби фаровон ва моеъҳои гарм (чойи кабуд, чойи лимӯ ё гиёҳӣ) бинӯшед.\n2. Ҳарорати баданро назорат кунед. Дар сурати аз 38.5 боло рафтан, доруҳои ҳароратпасткунанда (Паратсетамол) истифода шаванд.\n3. Дар ороиши гарми хона истироҳат намоед.";
    recommendedSpecialty = "Терапевт ё Педиатр (барои кӯдакон). Шумо метавонед ба Д-р Бахтиёр Саидов (Беморхонаи марказии шаҳр, Тел: +992 935 77 88 99) муроҷиат кунед.";
    criticalTests = "Таҳлили умумии хун (ОАК), рентгени қафаси сина (дар сурати сулфаи сахт хусусан).";
    doctorQuestions = "Сулфаи шумо хушк аст ё тар? Ҳарорати баланд чанд рӯз боз давом дорад?";
  }
  else if (norm.includes("сар") || norm.includes("асаб") || norm.includes("чарх") || norm.includes("хоб") || norm.includes("бехобӣ") || norm.includes("калла")) {
    symptomsAnalysis = "Дарди сар, чарх задани сар ё хастагии рӯҳӣ бисёр вақтҳо бо сабаби спазми рагҳо, бехобӣ, фишори баланд ва ё хастагии асабӣ ба вуҷуд меоянд.";
    potentialCauses = "- Мигрен ё дарди сари шиддатнок (Tension headache)\n- Остеохондрози гардан ва вайроншавии гардиши хун\n- Фишори баланди дохилиҷавҷавӣ ва стресс";
    firstAid = "1. Дар хонаи торик ва ором дароз кашида, чашмонатонро пӯшед.\n2. Ба пешонӣ компресси салқин гузоред.\n3. Оби оддии ошомиданӣ бинӯшед ва аз истифодаи телефон ё монитор худдорӣ кунед.";
    recommendedSpecialty = "Невролог. Мо ба шумо Д-р Малика Раҳимова-ро (Клиникаи Ависенна, Тел: +992 918 44 55 66) тавсия медиҳем.";
    criticalTests = "МРТ-и майнаи сар, Допплерографияи рагҳои гардан.";
    doctorQuestions = "Дард дар кадом қисми сар бештар аст (пешонӣ, пушти сар, ё як тараф)?";
  }
  else if (norm.includes("шикам") || norm.includes("меъда") || norm.includes("дарун") || norm.includes("қайъ") || norm.includes("дилбеҳузурӣ")) {
    symptomsAnalysis = "Дарди шикам, дилбеҳузурӣ ё халалдоршавии ҳазм метавонанд бо сабаби сирояти рӯда, заҳролудшавии ғизоӣ ва ё илтиҳоби меъда рух диҳад.";
    potentialCauses = "- Гастрити шадид ё захми меъда\n- Заҳролудшавии ғизоӣ (Токсикоинфексия)\n- Дисбактериоз ё панкреатит";
    firstAid = "1. Аз хӯрдани ғизоҳои вазнин, чарбдор ва тунд лаҳзае даст кашед.\n2. Моеъҳои соф ва сорбентҳо (Регидрон, Ангишти фаъолшуда) истифода кунед.\n3. Дар сурати дарди сахти ногаҳонӣ фавран кумаки таъҷилиро даъват кунед.";
    recommendedSpecialty = "Гастроэнтеролог ё терапевти умумӣ. Лутфан ба мутахассисони наздиктарин дар соҳаи меъдаву рӯда муроҷиат намоед.";
    criticalTests = "УЗИ-и узвҳои шикам, Копрограмма, санҷиши хун барои ферментҳо.";
    doctorQuestions = "Оё дард пас аз ғизохӯрӣ зиёд мешавад? Оё ҳарорат ё дарунравӣ доред?";
  }
  else {
    symptomsAnalysis = "Аломатҳои умумии баёншуда барои ташхиси аввалия ниёз ба таҳлили касбии духтур доранд. Эҳтимоли хастагии умумии бадан, норасоии витаминҳо ё илтиҳоби сабук мавҷуд аст.";
    potentialCauses = "- Омилҳои вирусӣ ё бактериявӣ дар марҳилаи аввал\n- Хастагии музмин ё норасоии маводи ғизоӣ\n- Фишори асабӣ-мушакӣ";
    firstAid = "1. Истироҳати кофии шабонарузиро таъмин намоед.\n2. Парҳези сабукро риоя карда, оби кофӣ ошомед.\n3. Саломатии худро назорат намуда, дар сурати бадтар шудан бо духтури оилавӣ тамос гиред.";
    recommendedSpecialty = "Терапевти оилавӣ (Умумипрофилӣ). Духтурони тавсияшудаи сомонаи моро дар панели асосӣ санҷед.";
    criticalTests = "Таҳлили умумии хун (ОАК) ва пешоб, таҳлили биохимиявии хун.";
    doctorQuestions = "Кадом муддат аст, ки ин ҳолатро ҳис мекунед? Оё вазъи умумии бадан устувор аст?";
  }

  if (isChatFlow) {
    return `🩺 **Таҳлили Аломатҳо ва Нишонаҳо** (аз ҷониби Ёвари MADAD AI):
${symptomsAnalysis}

💡 **Омилҳо ва Сабабҳои Эҳтимолии Клиникӣ**:
${potentialCauses}

🛑 **Ёрии Аввалиндараҷа ва Машваратҳои Хонагӣ**:
${firstAid}

👨‍⚕️ **Тавсия барои Муроҷиат ба Мутахассис**:
${recommendedSpecialty}

⚠️ **Раддияи Ҳатмии Тиббӣ**:
*Маълумоти пешниҳодшуда танҳо хусусияти омӯзишию иттилоотӣ дорад ва машварати касбии тиббӣ ё ташхиси духтури воқеиро иваз карда наметаоварад. Лутфан, барои гирифтани ташхиси дақиқ ва тартиб додани нақшаи табобат бо яке аз духтурони сомонаи мо тавассути бахши 'Навбат занед' тамос гиред.*`;
  } else {
    return `🩺 **1. Хулосаи Мухтасари Клиникӣ**:
${symptomsAnalysis}

⚠️ **2. Сабабҳои Имконпазир (Диагностикаи Дифференсиалӣ)**:
${potentialCauses}

📝 **3. Саволҳои Тавсиявӣ барои Духтур**:
${doctorQuestions}

🔬 **4. Ташхисҳои Лабораторӣ ва Асбобӣ**:
${criticalTests}

🛡 **5. Таввияҳои Ёрии Нахустин ва Пешгирӣ**:
${firstAid}

*Эзоҳ: Ин таҳлили фаврӣ бо усулҳои оқилонаи системаи дарунии MADAD AI омода гардид.*`;
  }
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Handle Socket.io connections and rooms
  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      socket.join(`patient_${userId}`);
      socket.join(`doctor_${userId}`);
      console.log(`User ${userId} joined WebSocket room.`);
    });
  });

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { fullName, email, password, role, phone, specialty, city, experience, location } = req.body;
    const db = getDB();
    
    if (db.users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = (email === "ssadriddin789@gmail.com" || email === "zokirovsadriddin65@gmail.com") ? "ADMIN" : role;
    
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      fullName,
      email,
      password: hashedPassword,
      role: assignedRole,
      phone,
      specialty: assignedRole === "DOCTOR" ? specialty : "",
      city: assignedRole === "DOCTOR" ? city : "",
      experience: assignedRole === "DOCTOR" ? experience : "",
      location: assignedRole === "DOCTOR" ? location : "",
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    // If registered as a doctor, automatically list in public doctors directory
    if (assignedRole === "DOCTOR") {
      const newDoctor = {
        id: newUser.id,
        name: fullName.startsWith("Д-р") || fullName.startsWith("Духтур") ? fullName : `Д-р ${fullName}`,
        specialty: specialty || "Мутахассис",
        experience: experience || "5 сол",
        phone: phone || "+992 000 00 00",
        location: location || "Маркази тиббии Душанбе",
        city: city || "Н.СИНО",
        rating: 5.0
      };
      
      if (!db.doctors) db.doctors = [];
      db.doctors.push(newDoctor);
    }

    saveDB(db);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: assignedRole }, JWT_SECRET);
    res.json({ token, user: { id: newUser.id, fullName, email, role: assignedRole, specialty } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const db = getDB();
    const user = db.users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, fullName: user.fullName, email, role: user.role, specialty: user.specialty } });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const db = getDB();
    const user = db.users.find((u: any) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, fullName: user.fullName, email: user.email, role: user.role, specialty: user.specialty });
  });

  // --- Admin Config Routes ---
  app.get("/api/config", (req, res) => {
    const db = getDB();
    res.json(db.config || {});
  });

  app.post("/api/admin/update-config", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    
    const db = getDB();
    db.config = { ...db.config, ...req.body };
    saveDB(db);
    res.json({ success: true, config: db.config });
  });

  // --- Admin User & Doctor Management Routes ---
  app.get("/api/admin/users", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const db = getDB();
    const sanitizedUsers = db.users.map(({ password, ...u }: any) => u);
    res.json(sanitizedUsers);
  });

  app.delete("/api/admin/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    const db = getDB();
    
    db.users = db.users.filter((u: any) => u.id !== id);
    if (db.doctors) {
      db.doctors = db.doctors.filter((d: any) => d.id !== id);
    }
    saveDB(db);
    res.json({ success: true });
  });

  // --- Doctors Public and Admin Management Routes ---
  app.get("/api/doctors", (req, res) => {
    const db = getDB();
    res.json(db.doctors || []);
  });

  app.post("/api/doctors", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const db = getDB();
    const newDoctor = {
      id: Math.random().toString(36).substr(2, 9),
      ...req.body,
      rating: parseFloat(req.body.rating) || 5.0
    };
    if (!db.doctors) db.doctors = [];
    db.doctors.push(newDoctor);
    saveDB(db);
    res.json(newDoctor);
  });

  app.put("/api/doctors/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    const db = getDB();
    
    if (!db.doctors) db.doctors = [];
    const index = db.doctors.findIndex((d: any) => d.id === id);
    if (index !== -1) {
      db.doctors[index] = { ...db.doctors[index], ...req.body, id };
      saveDB(db);
      res.json(db.doctors[index]);
    } else {
      res.status(404).json({ error: "Doctor not found" });
    }
  });

  app.delete("/api/doctors/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    const db = getDB();
    
    if (db.doctors) {
      db.doctors = db.doctors.filter((d: any) => d.id !== id);
    }
    saveDB(db);
    res.json({ success: true });
  });

  // --- Appointment Routes ---
  app.get("/api/appointments", authenticate, (req: any, res) => {
    const db = getDB();
    if (req.user.role === "ADMIN") {
      res.json(db.appointments);
    } else if (req.user.role === "DOCTOR") {
      const appointments = db.appointments.filter((a: any) => a.doctorId === req.user.id);
      res.json(appointments);
    } else {
      const appointments = db.appointments.filter((a: any) => a.patientId === req.user.id);
      res.json(appointments);
    }
  });

  app.post("/api/appointments", authenticate, (req: any, res) => {
    const { doctorId, doctorName, doctorSpecialty, symptoms, aiSummary } = req.body;
    const db = getDB();
    
    const userRecord = db.users.find((u: any) => u.id === req.user.id);
    const newAppointment = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: req.user.id,
      patientName: userRecord?.fullName || req.user.fullName || "Бемор",
      patientPhone: userRecord?.phone || req.user.phone || "Нишон дода нашудааст",
      doctorId,
      doctorName: doctorName || "Духтур",
      doctorSpecialty: doctorSpecialty || "Мутахассис",
      symptoms,
      aiSummary: aiSummary || "",
      status: "WAITING",
      createdAt: new Date().toISOString()
    };

    if (!db.appointments) db.appointments = [];
    db.appointments.push(newAppointment);
    saveDB(db);
    
    // Notify doctor
    io.to(`doctor_${doctorId}`).emit("new_appointment", newAppointment);
    res.json(newAppointment);
  });

  app.patch("/api/appointments/:id/status", authenticate, (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDB();
    const appointment = db.appointments.find((a: any) => a.id === id);

    if (!appointment || (appointment.doctorId !== req.user.id && req.user.role !== "ADMIN")) {
      return res.status(403).json({ error: "Access denied" });
    }

    appointment.status = status;
    saveDB(db);

    // Notify patient
    io.to(`patient_${appointment.patientId}`).emit("appointment_update", appointment);
    res.json(appointment);
  });

  // --- Symptom AI Analysis by Doctor Endpoint ---
  app.post("/api/appointments/:id/analyze-ai", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const db = getDB();
    const appointment = db.appointments.find((a: any) => a.id === id);

    if (!appointment) {
      return res.status(404).json({ error: "Маълумоти бемор ёфт нашуд" });
    }

    try {
      const apiKey = getGeminiApiKey();
      let analysisText = "";

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("Gemini API key is not configured. Using local medical diagnostic engine.");
        analysisText = getLocalMedicalFeedback(appointment.symptoms || "", false);
      } else {
        const modelName = db.config?.aiModel || "gemini-3.5-flash";
        const prompt = `Шумо ҳамчун зеҳни сунъии тиббии MADAD AI фаъолият мекунед. Ба духтур кӯмак кунед, ки аломатҳои зерини беморро дарк ва таҳлил намояд.
Аломатҳои бемор: "${appointment.symptoms}"
Номи бемор: "${appointment.patientName}"

Лутфан таҳлили муфассалро барои духтур бо забони тоҷикӣ бо истифода аз сохтори зерин ва бо оҳанги касбӣ омода кунед (ҳар бахш бошад мукаммал):
1. Хулосаи мухтасар ва баррасии клиникии нишонаҳо.
2. Сабабҳои имконпазири клиникии муайяншуда (ташхиси дифференсиалӣ).
3. Саволҳои пешниҳодшуда, ки духтур метавонад аз бемор бипурсад.
4. Таҳлилҳои лабораторӣ ва асбобҳои тавсиявӣ (рентген, узи, таҳлили хун, ва ғайра), ки барои ин бемор муҳиманд.
5. Машваратҳо ва тавсияҳои амнияти ёрии аввалин пеш аз гузаронидани ташхиси пурра.`;

        try {
          const response = await getAI().models.generateContent({
            model: modelName,
            contents: prompt,
          });
          analysisText = response.text || getLocalMedicalFeedback(appointment.symptoms || "", false);
        } catch (apiError: any) {
          console.error("Gemini API error occurred, triggering expert local diagnostics fallback:", apiError);
          analysisText = getLocalMedicalFeedback(appointment.symptoms || "", false);
        }
      }

      // Update appointment summary in db
      appointment.aiSummary = analysisText;
      saveDB(db);

      // Notify patient
      io.to(`patient_${appointment.patientId}`).emit("appointment_update", appointment);

      res.json({ success: true, aiSummary: analysisText });
    } catch (error: any) {
      console.error("Critical error in analysis route. Falling back:", error);
      const fallbackText = getLocalMedicalFeedback(appointment.symptoms || "", false);
      appointment.aiSummary = fallbackText;
      saveDB(db);
      io.to(`patient_${appointment.patientId}`).emit("appointment_update", appointment);
      res.json({ success: true, aiSummary: fallbackText });
    }
  });

  // --- AI Chat Endpoint ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const db = getDB();
      const modelName = db.config?.aiModel || "gemini-3.5-flash";

      const dbDoctors = db.doctors || [];
      const doctorsContext = dbDoctors.length > 0
        ? `\n\nДАР ПЛАТФОРМАИ МО ДУХТУРОНИ ЗЕРИН ФАЪОЛИЯТ МЕКУНАНД (БА ТАМОМИ МАЪЛУМОТИ ИНҲО ДАСТРАСӢ ДОРӢ):\n${dbDoctors.map((d: any) => `- ${d.name || "Номномаълум"}: Ихтисос ва соҳаи фаъолият: "${d.specialty || "Рӯшан нест"}", Собиқаи корӣ/таҷриба: "${d.experience || "номаълум"}", Рақами телефон: "${d.phone || "ворид нашудааст"}", Ҷойи кор (Клиника/Маркази тиббӣ): "${d.location || "номаълум"}", Ноҳияи фаъолият/зист: "${d.city || "номаълум"}", Рейтинги тиббии духтур: "${d.rating || "5.0"}".`).join("\n")}\n\nАгар корбар (бемор) аломатҳоеро тасвир кунад, ки ба яке аз ин духтурон ё соҳаи фаъолияти онҳо мувофиқ ояд, ту БОЯД мушаххасан ҳамин духтурро номбар карда, тавсия диҳӣ ва рақами телефон, суроға (клиника/маркази тиббӣ) ва ноҳияи фаъолият/зисти ӯро низ пешниҳод кунӣ. Ҳамчунин зикр намо, ки онҳо метавонанд дар бахши "Духтурон" навбати муроҷиатро сабт кунанд.`
        : "";

      const chatHistory = (history || []).map((h: any) => ({
        role: h.role === "model" ? "model" : "user",
        parts: [{ text: h.parts?.[0]?.text || "" }]
      }));

      const contents = [...chatHistory, { role: "user", parts: [{ text: message }] }];

      const apiKey = getGeminiApiKey();
      let responseText = "";

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("No active Gemini API key. Using local expert medical feedback system.");
        responseText = getLocalMedicalFeedback(message, true);
      } else {
        try {
          const response = await getAI().models.generateContent({ 
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: `You are MADAD AI, a highly advanced specialized medical AI platform for Tajikistan (СУ фармоишӣ барои Тоҷикистон).
              Your ultimate goal is to provide deep, exhaustive, and highly detailed medical/clinical guidance for users.
              
              CRITICAL INSTRUCTION FOR COMPLETENESS (ҶАВОБҲОИ ПУРРА ВА МУФАССАЛ):
              You must NEVER provide short, surface-level, or truncated answers. Always analyze symptoms thoroughly and generate comprehensive, richly-styled explanations using elegant markdown formatting (bullet points, bold highlights, code blocks for structure if needed).
              
              STRUCTURE YOUR EXHAUSTIVE RESPONSE WITH THESE DISTINCT SECTIONS:
              1. 🩺 **Таҳлили Аломатҳо ва Нишонаҳо** (In-depth analysis of symptoms stated by the user, outlining what they might indicate physically and clinically).
              2. 💡 **Сабабҳои Эҳтимолии Клиникӣ** (Provide multiple differential potential causes cautiously, describing the physiological mechanics in clear Tajik).
              3. 🛑 **Ёрии Аввалиндараҷа ва Машваратҳои Хонагӣ** (Offer highly specific first-aid steps, safety measures, nutrition context, and home remedies if applicable, coupled with clinical cautions).
              4. 👨‍⚕️ **Ихтисоси Тавсиявии Духтур** (Recommend exact medical specialist domains needed for this specific state. If matching doctors exist below, guide them to book an appointment with them immediately).
              5. ⚠️ **Радзияи Ҳатмии Тиббӣ** (A highly prominent medical disclaimer in Tajik warning that AI is not a definitive diagnosis and to seek in-person professional examination).

              RULES:
              1. ONLY answer medical, health, biological, or physiological questions.
              2. Analyze symptoms with extreme clinical detail. Use professional, flawless, and warmly empathetic Tajik language.
              3. Suggest precise, step-by-step first aid or lifestyle adjustments, and mention potential treatment paths clearly.
              4. RECOMMEND a specialty. If there is a matching doctor in our system, explicitly guide the user to the "Doctors" panel to book an appointment with them.
              5. REJECT completely non-medical, unrelated questions. Respond EXACTLY with: “Саволи шумо берун аз доираи тиб мебошад. Лутфан аломатҳои худро тасвир кунед.”
              6. Explaining 'MADAD AI': If asked 'Чаро MADAD AI?' or similar, explain that MADAD AI was created by ZOKIROV SADRIDDIN to revolutionize digital healthcare in Tajikistan by providing 24/7 AI-powered medical guidance and connecting patients with doctors.
              
              Tone: Highly professional, warmly empathetic, authoritative, and educational.
              Disclaimer: MUST always conclude with a distinct safety advisory in Tajik.
              
              Founder & Visionary: ZOKIROV SADRIDDIN. ${doctorsContext}`,
            },
          });
          responseText = response.text || "";
        } catch (apiError: any) {
          console.error("Gemini API call failed during live chat stream. Falling back gracefully to Local Medical Feedback:", apiError);
          responseText = getLocalMedicalFeedback(message, true);
        }
      }

      if (!responseText) {
        responseText = getLocalMedicalFeedback(message, true);
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Critical error in Live Chat fallback routing:", error);
      const fallbackText = getLocalMedicalFeedback(req.body.message || "", true);
      res.json({ text: fallbackText });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`MADAD AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
