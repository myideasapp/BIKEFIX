import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  MapPin, 
  Wrench, 
  ShieldCheck, 
  Zap, 
  User, 
  Settings, 
  Navigation, 
  Camera, 
  Mic, 
  Send,
  Phone,
  CreditCard,
  CheckCircle,
  X,
  Menu,
  Activity,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Clock,
  ChevronRight,
  Star,
  LogOut,
  ImageIcon,
  ThumbsUp,
  Award,
  ArrowLeft,
  LocateFixed,
  BarChart3,
  Users,
  LayoutDashboard,
  Wallet,
  History,
  Upload,
  FileText,
  BadgeCheck,
  Building2,
  ImagePlus,
  QrCode,
  Smartphone
} from 'lucide-react';

// --- Configuration & Helpers ---
const GOOGLE_API_KEY = process.env.API_KEY;

// Helper to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d.toFixed(1);
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI/180);
};

// Mock Services
const SERVICES = [
  { id: 1, name: 'General Service', price: 599, time: '60 min', icon: '🔧' },
  { id: 2, name: 'Engine Oil Change', price: 349, time: '30 min', icon: '🛢️' },
  { id: 3, name: 'Breakdown Assist', price: 499, time: '15 min', icon: '🚨' },
  { id: 4, name: 'Premium Wash', price: 199, time: '45 min', icon: '🚿' },
];

// Base Mechanics Data
const BASE_MECHANICS = [
  {
    id: 101,
    name: "Rajesh Verma",
    rating: 4.9,
    jobs: 142,
    specialty: "Royal Enfield Expert",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
    experience: "8 Years",
    gallery: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&q=80",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&q=80",
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=300&q=80"
    ],
    reviews: [
      { user: "Amit", text: "Best service for Bullet!", rating: 5 },
      { user: "Rahul", text: "Very quick and professional.", rating: 4.5 }
    ]
  },
  {
    id: 102,
    name: "Suresh Auto Works",
    rating: 4.6,
    jobs: 89,
    specialty: "Scooty & Mopeds",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh",
    experience: "5 Years",
    gallery: [
      "https://images.unsplash.com/photo-1626847037657-fd3622613ce3?w=300&q=80",
      "https://images.unsplash.com/photo-1599474924187-334a4ae513ab?w=300&q=80"
    ],
    reviews: [
      { user: "Priya", text: "Fixed my Activa engine nicely.", rating: 5 }
    ]
  },
  {
    id: 103,
    name: "Khan Performance",
    rating: 4.8,
    jobs: 210,
    specialty: "Sports Bikes (KTM/Yamaha)",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Khan",
    experience: "12 Years",
    gallery: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&q=80",
      "https://images.unsplash.com/photo-1544896796-22442436d408?w=300&q=80",
      "https://images.unsplash.com/photo-1558980394-0a06c4631733?w=300&q=80"
    ],
    reviews: [
      { user: "Vikram", text: "Tuned my R15 perfectly.", rating: 5 },
      { user: "Sameer", text: "A bit expensive but worth it.", rating: 4 }
    ]
  },
  {
    id: 104,
    name: "City Garage",
    rating: 4.2,
    jobs: 56,
    specialty: "General Repair",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=City",
    experience: "3 Years",
    gallery: [
      "https://images.unsplash.com/photo-1632823471457-3773199589d3?w=300&q=80"
    ],
    reviews: [
      { user: "Ankit", text: "Good for washing and oil change.", rating: 4 }
    ]
  }
];

// --- Types ---
type ViewMode = 'SPLASH' | 'LANDING' | 'CUSTOMER' | 'MECHANIC' | 'ADMIN' | 'MECHANIC_REGISTRATION' | 'WELCOME_LETTER';
type BookingStatus = 'IDLE' | 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';
type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Transaction {
  id: number;
  date: string;
  service: string;
  amount: number;
  commission: number;
  net: number;
  type: 'CREDIT' | 'DEBIT'; // Credit = Money In, Debit = Commission Cut
  method: PaymentMethod;
}

interface MechanicProfile {
    name: string;
    shopName: string;
    phone: string;
    experience: string;
    specialty: string;
    images: string[];
    isRegistered: boolean;
}

// --- Main Application Component ---

const App = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('SPLASH');
  
  // App Global State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyMechanics, setNearbyMechanics] = useState<any[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [activeBooking, setActiveBooking] = useState<{status: BookingStatus, mechanic?: any, serviceType?: string, startTime?: number, paymentMethod?: PaymentMethod} | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [mechanicOnline, setMechanicOnline] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  
  // Financial State
  const [totalRevenue, setTotalRevenue] = useState(12500); 
  const [walletBalance, setWalletBalance] = useState(8500); // Can go negative
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, date: 'Today, 10:30 AM', service: 'General Service', amount: 600, commission: 60, net: 540, type: 'CREDIT', method: 'UPI' },
    { id: 2, date: 'Yesterday', service: 'Commission Paid', amount: 0, commission: 50, net: -50, type: 'DEBIT', method: 'CASH' },
  ]);

  // Mechanic Profile State
  const [mechanicProfile, setMechanicProfile] = useState<MechanicProfile>({
      name: '',
      shopName: '',
      phone: '',
      experience: '',
      specialty: 'General Bike Service',
      images: [],
      isRegistered: false
  });

  // Splash Screen Effect & Location Fetching
  useEffect(() => {
    if (viewMode === 'SPLASH') {
      const timer = setTimeout(() => setViewMode('LANDING'), 3000);

      // Fetch Real Location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(loc);
            
            // Generate mechanics around this real location
            const generatedMechanics = BASE_MECHANICS.map((mec, index) => {
               const offsetLat = (Math.random() - 0.5) * 0.02; 
               const offsetLng = (Math.random() - 0.5) * 0.02;
               const mLat = loc.lat + offsetLat;
               const mLng = loc.lng + offsetLng;
               
               return {
                 ...mec,
                 lat: mLat,
                 lng: mLng,
                 distance: calculateDistance(loc.lat, loc.lng, mLat, mLng) + " km"
               };
            });
            setNearbyMechanics(generatedMechanics.sort((a,b) => parseFloat(a.distance) - parseFloat(b.distance)));
          },
          (error) => {
            console.error("Error fetching location", error);
            setLocationError("GPS Permission Denied. Using Demo Location.");
            // Fallback to New Delhi
            setUserLocation({ lat: 28.6139, lng: 77.2090 });
            setNearbyMechanics(BASE_MECHANICS.map(m => ({...m, distance: (Math.random() * 3).toFixed(1) + " km"})));
          },
          { enableHighAccuracy: true }
        );
      } else {
        setLocationError("Geolocation not supported");
      }

      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // --- AI Component ---
  const AIDiagnosis = ({ onClose }: { onClose: () => void }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
      { role: 'model', text: 'Namaste! Main BikeFix AI hun. Apni bike ki problem batayein (jaise "Start nahi ho rahi" ya "Engine se aawaz aa rahi hai"). Main turant solution bataunga.' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);

    const handleSend = async () => {
      if (!input.trim() || !GOOGLE_API_KEY) return;
      
      const userMsg = input;
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setInput('');
      setLoading(true);

      try {
        const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an expert motorcycle mechanic AI assistant for an Indian audience. 
          The user is describing a problem with their bike. Provide a diagnosis, potential causes, estimated cost in INR, and urgency.
          Keep it concise and helpful. Respond in Hinglish (Hindi + English mix).
          Use bullet points for clarity.
          User Query: ${userMsg}`,
        });
        
        setMessages(prev => [...prev, { role: 'model', text: response.text || "Maaf kijiye, main abhi samajh nahi paaya." }]);
      } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Network error. Kripya thodi der baad koshish karein." }]);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl ring-1 ring-cyan-500/20 animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 flex items-center justify-between border-b border-cyan-900/50">
          <h3 className="text-white font-bold flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500 rounded-lg text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]"><Zap size={16} fill="currentColor"/></div>
            AI Smart Mechanic
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                m.role === 'user' 
                  ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
              }`}>
                {m.text.split('\n').map((line, idx) => <p key={idx} className="mb-1 last:mb-0">{line}</p>)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse pl-2">
              <Activity size={14} className="animate-spin" /> Diagnosing engine sound...
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Problem batayein..."
            className="flex-1 bg-slate-950 text-white px-4 py-3 rounded-xl text-sm border border-slate-800 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)]"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  };

  // --- Mechanic Registration & Welcome ---
  const MechanicRegistration = () => {
      const [form, setForm] = useState(mechanicProfile);
      const [uploading, setUploading] = useState(false);
      
      const handleImageUpload = () => {
          setUploading(true);
          // Simulate upload
          setTimeout(() => {
              setForm(prev => ({
                  ...prev,
                  images: [...prev.images, "https://images.unsplash.com/photo-1626847037657-fd3622613ce3?w=300&q=80", "https://images.unsplash.com/photo-1599474924187-334a4ae513ab?w=300&q=80", "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&q=80", "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&q=80", "https://images.unsplash.com/photo-1544896796-22442436d408?w=300&q=80", "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&q=80" ]
              }));
              setUploading(false);
          }, 2000);
      };

      const handleSubmit = () => {
          setMechanicProfile({...form, isRegistered: true});
          setViewMode('WELCOME_LETTER');
      };

      return (
          <div className="h-screen bg-slate-950 overflow-y-auto pb-safe">
              <div className="p-6">
                  <h2 className="text-3xl font-black text-white mb-2">Create Profile</h2>
                  <p className="text-slate-400 mb-6">Join the BikeFix network and start earning.</p>
                  
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Full Name</label>
                          <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                              <input 
                                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-12 text-white focus:border-cyan-500 focus:outline-none" placeholder="Enter your name" 
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Shop Name</label>
                          <div className="relative">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                              <input 
                                value={form.shopName} onChange={e => setForm({...form, shopName: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-12 text-white focus:border-cyan-500 focus:outline-none" placeholder="Garage/Workshop Name" 
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Specialization</label>
                          <div className="relative">
                              <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                              <select 
                                value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-12 text-white focus:border-cyan-500 focus:outline-none appearance-none"
                              >
                                  <option>General Bike Service</option>
                                  <option>Royal Enfield Expert</option>
                                  <option>Sports Bike Specialist</option>
                                  <option>Scooter & Moped</option>
                              </select>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Experience</label>
                          <div className="relative">
                              <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                              <input 
                                value={form.experience} onChange={e => setForm({...form, experience: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-12 text-white focus:border-cyan-500 focus:outline-none" placeholder="e.g. 5 Years" 
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Shop Photos (Upload 6)</label>
                          <div 
                            onClick={handleImageUpload}
                            className="w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-slate-900 transition-all bg-slate-900/50"
                          >
                              {uploading ? (
                                  <div className="animate-pulse flex items-center gap-2 text-cyan-400">
                                      <Activity className="animate-spin" /> Uploading...
                                  </div>
                              ) : form.images.length > 0 ? (
                                  <div className="grid grid-cols-6 gap-1 p-2 w-full h-full">
                                      {form.images.map((img, i) => (
                                          <img key={i} src={img} className="w-full h-full object-cover rounded-md" />
                                      ))}
                                  </div>
                              ) : (
                                  <>
                                    <ImagePlus className="text-slate-500 mb-2" size={30} />
                                    <p className="text-slate-400 text-xs">Tap to upload 6 photos</p>
                                  </>
                              )}
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleSubmit}
                    disabled={!form.name || !form.shopName}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-xl font-bold text-black text-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Register Now
                  </button>
              </div>
          </div>
      )
  }

  const WelcomeLetter = () => {
      return (
          <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-sm shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
                   {/* Watermark */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                       <Zap size={300} />
                   </div>

                   <div className="border-4 border-double border-slate-800 p-6 relative z-10">
                       <div className="flex justify-between items-start mb-8">
                           <div>
                               <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900">BIKE<span className="text-cyan-600">FIX</span></h1>
                               <p className="text-[10px] uppercase tracking-widest text-slate-500">Official Partner Program</p>
                           </div>
                           <BadgeCheck size={40} className="text-cyan-600" />
                       </div>

                       <div className="text-center mb-8">
                           <h2 className="text-2xl font-serif font-bold mb-2">LETTER OF WELCOME</h2>
                           <div className="w-20 h-1 bg-cyan-600 mx-auto"></div>
                       </div>

                       <p className="text-sm leading-relaxed mb-4 font-serif">
                           Dear <strong>{mechanicProfile.name}</strong>,
                       </p>
                       <p className="text-sm leading-relaxed mb-4 text-justify font-serif text-slate-700">
                           It is with great pleasure that we welcome <strong>{mechanicProfile.shopName}</strong> to the elite BikeFix Service Network. Your profile has been reviewed and verified by our central team.
                       </p>
                       <p className="text-sm leading-relaxed mb-8 text-justify font-serif text-slate-700">
                           You are now authorized to accept premium service requests in your area. We trust you will maintain the highest standards of service quality and customer satisfaction.
                       </p>

                       <div className="flex justify-between items-end mt-12">
                           <div className="text-center">
                               <div className="font-cursive text-xl text-blue-900 mb-1">Rohan Gupta</div>
                               <div className="h-px w-32 bg-slate-400"></div>
                               <p className="text-[10px] uppercase mt-1 text-slate-500">CEO, BikeFix India</p>
                           </div>
                           <div className="text-center">
                               <div className="w-20 h-20 border-2 border-cyan-600 rounded-full flex items-center justify-center mb-2 mx-auto rotate-12 opacity-80">
                                   <div className="w-16 h-16 border border-cyan-600 rounded-full flex items-center justify-center text-[8px] text-center font-bold text-cyan-800 uppercase leading-none">
                                       Official<br/>Partner<br/>Verified
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>

                   <button 
                     onClick={() => setViewMode('MECHANIC')}
                     className="w-full mt-6 py-3 bg-slate-900 text-white font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                   >
                       Enter Dashboard
                   </button>
              </div>
          </div>
      )
  }

  // --- Customer View (Ola Style Map) ---
  const CustomerPanel = () => {
    const [aiOpen, setAiOpen] = useState(false);
    const [selectedMechanic, setSelectedMechanic] = useState<any>(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [pendingBookingData, setPendingBookingData] = useState<{type: string, emergency: boolean, mechanic: any} | null>(null);
    
    // Simulated Visual Mechanics for CSS Map
    const [visualMechanics, setVisualMechanics] = useState([
      { id: 1, top: 40, left: 20, rot: 45 },
      { id: 2, top: 60, left: 70, rot: -12 },
      { id: 3, top: 25, left: 60, rot: 90 },
      { id: 4, top: 80, left: 40, rot: 180 },
    ]);

    // Animate mechanics movement
    useEffect(() => {
      const interval = setInterval(() => {
        setVisualMechanics(prev => prev.map(m => ({
          ...m,
          top: Math.max(10, Math.min(90, m.top + (Math.random() - 0.5) * 3)),
          left: Math.max(10, Math.min(90, m.left + (Math.random() - 0.5) * 3)),
          rot: m.rot + (Math.random() - 0.5) * 20
        })));
      }, 1500);
      return () => clearInterval(interval);
    }, []);

    const initiateBooking = (type: string, emergency = false, specificMechanic = null) => {
        setPendingBookingData({ type, emergency, mechanic: specificMechanic });
        setPaymentModalOpen(true);
    };

    const confirmBooking = (paymentMethod: PaymentMethod) => {
      setPaymentModalOpen(false);
      const { type, emergency, mechanic } = pendingBookingData!;
      
      setActiveBooking({ status: 'SEARCHING', serviceType: type, paymentMethod });
      setIsEmergency(emergency);
      if(selectedMechanic) setSelectedMechanic(null); 
      
      // Simulate network request to mechanic
      setTimeout(() => {
        // Here we send the REAL location to the mechanic
        setPendingRequest({ 
          customer: "Current User", 
          bike: "Royal Enfield Classic 350", 
          issue: type,
          isEmergency: emergency,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          distance: mechanic ? (mechanic as any).distance : "1.2 km",
          price: emergency ? 800 : 500, // Base prices
          paymentMethod: paymentMethod
        });
        
        // Auto-accept simulation if specific mechanic
        if (mechanic) {
            setTimeout(() => {
                 setActiveBooking({ status: 'ACCEPTED', mechanic: mechanic, serviceType: type, paymentMethod });
            }, 1000);
        }
      }, 2000);
    };

    return (
      <div className="relative h-screen w-full bg-slate-950 overflow-hidden text-slate-100 font-sans">
        {/* Realistic Map Background */}
        <div className="absolute inset-0 bg-[#0f172a] z-0">
          {/* Roads/Grid Pattern */}
          <div className="absolute inset-0 opacity-10" 
               style={{
                 backgroundImage: 'linear-gradient(#475569 2px, transparent 2px), linear-gradient(90deg, #475569 2px, transparent 2px)', 
                 backgroundSize: '80px 80px'
               }}>
          </div>
          <div className="absolute inset-0 opacity-5" 
               style={{
                 backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', 
                 backgroundSize: '20px 20px'
               }}>
          </div>
          
          {/* Abstract Map Roads */}
          <div className="absolute top-[30%] -left-10 w-[120%] h-6 bg-slate-700/40 rotate-6 blur-sm border-y border-slate-600/30"></div>
          <div className="absolute top-0 left-[45%] h-[120%] w-8 bg-slate-700/40 -rotate-12 blur-sm border-x border-slate-600/30"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-[80%] h-12 bg-slate-700/30 -rotate-3 blur-md"></div>

          {/* Radar Effect when Searching */}
          {activeBooking?.status === 'SEARCHING' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full animate-pulse blur-3xl z-0 pointer-events-none"></div>
          )}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-slate-900/90 to-transparent flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <button onClick={() => setViewMode('LANDING')} className="p-3 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 text-white shadow-lg active:scale-95 transition-transform">
               <Menu size={20} />
            </button>
            <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 text-white shadow-lg flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${userLocation ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-bold tracking-wide">
                {userLocation ? 'GPS: PRECISE' : 'LOCATING...'}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setAiOpen(!aiOpen)}
            className="pointer-events-auto p-2 pr-4 bg-indigo-600 rounded-full text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-2 group"
          >
            <div className="p-1.5 bg-white/20 rounded-full group-hover:rotate-12 transition-transform">
              <Zap size={18} fill="currentColor" /> 
            </div>
            <span className="font-bold text-sm">AI Mechanic</span>
          </button>
        </div>

        {/* Top Mechanics List (Horizontal Scroll) - Now Powered by Real Data */}
        {!activeBooking && !selectedMechanic && !isPaymentModalOpen && (
            <div className="absolute top-20 left-0 w-full z-20 pl-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex gap-4 pr-4">
                    {nearbyMechanics.map((mec) => (
                        <div key={mec.id} 
                             onClick={() => setSelectedMechanic(mec)}
                             className="inline-block min-w-[200px] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-3 shadow-lg active:scale-95 transition-transform cursor-pointer hover:border-cyan-500/50">
                            <div className="flex items-center gap-3 mb-2">
                                <img src={mec.image} className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600" />
                                <div>
                                    <h4 className="font-bold text-sm text-white truncate w-24">{mec.name}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                                        <Star size={10} fill="currentColor" /> {mec.rating} <span className="text-slate-500">({mec.jobs})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-700/50 pt-2">
                                <span className="flex items-center gap-1"><MapPin size={10} /> {mec.distance} away</span>
                                <span className="text-cyan-400 font-bold">View Profile &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* AI Modal */}
        {aiOpen && (
          <div className="absolute top-20 right-4 w-[90%] md:w-96 h-[60%] z-40 transition-all duration-300">
            <AIDiagnosis onClose={() => setAiOpen(false)} />
          </div>
        )}

        {/* Live Mechanics Visuals on Map */}
        {activeBooking?.status === 'IDLE' || activeBooking?.status === 'SEARCHING' || !activeBooking ? (
           visualMechanics.map(m => (
            <div key={m.id} 
                 className="absolute transition-all duration-[1500ms] linear z-10"
                 style={{ top: `${m.top}%`, left: `${m.left}%` }}>
              <div className="relative" style={{ transform: `rotate(${m.rot}deg)` }}>
                {/* Headlight beam */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-24 bg-gradient-to-t from-transparent to-white/10 blur-md rounded-full" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                {/* Bike Icon */}
                <div className="p-2 bg-slate-900 border border-slate-600 rounded-lg shadow-xl relative z-10">
                   <div className="w-3 h-5 bg-yellow-500 rounded-sm"></div>
                </div>
              </div>
            </div>
           ))
        ) : null}

        {/* User Location Pin */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="relative">
            {activeBooking?.status === 'SEARCHING' && (
              <>
                <div className="absolute -inset-16 border border-cyan-500/30 rounded-full animate-[ping_2s_infinite]"></div>
                <div className="absolute -inset-32 border border-cyan-500/10 rounded-full animate-ping delay-500"></div>
              </>
            )}
            <div className="relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-bounce">
              <MapPin className="w-12 h-12 text-cyan-400 fill-slate-900 stroke-[2px]" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-3 bg-black/60 blur-md rounded-full"></div>
            
            {/* Real coordinates display */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-[10px] text-white whitespace-nowrap border border-slate-700">
                {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Fetching Satellite Data..."}
            </div>
          </div>
        </div>

        {/* PAYMENT MODAL */}
        {isPaymentModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
                <div className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-700 shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Select Payment Method</h2>
                        <button onClick={() => setPaymentModalOpen(false)} className="p-2 rounded-full hover:bg-slate-800 text-slate-400"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <button onClick={() => confirmBooking('UPI')} className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between hover:border-green-500 hover:bg-slate-800/80 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-500"><QrCode size={24}/></div>
                                <div className="text-left">
                                    <p className="font-bold text-white">UPI / GPay / PhonePe</p>
                                    <p className="text-xs text-slate-400">Instant & Secure</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-white"/>
                        </button>
                        
                        <button onClick={() => confirmBooking('CARD')} className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between hover:border-blue-500 hover:bg-slate-800/80 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><CreditCard size={24}/></div>
                                <div className="text-left">
                                    <p className="font-bold text-white">Credit / Debit Card</p>
                                    <p className="text-xs text-slate-400">Visa, Mastercard</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-white"/>
                        </button>

                        <button onClick={() => confirmBooking('CASH')} className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between hover:border-orange-500 hover:bg-slate-800/80 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><DollarSign size={24}/></div>
                                <div className="text-left">
                                    <p className="font-bold text-white">Cash on Service</p>
                                    <p className="text-xs text-slate-400">Pay directly to mechanic</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-white"/>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MECHANIC PROFILE DETAILS MODAL */}
        {selectedMechanic && (
            <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
                <div className="bg-slate-900 w-full sm:max-w-md h-[85vh] sm:h-[80vh] sm:rounded-3xl rounded-t-3xl border-t sm:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-[float_0.3s_ease-out]">
                    
                    {/* Modal Header */}
                    <div className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
                        <button onClick={() => setSelectedMechanic(null)} className="p-2 rounded-full hover:bg-slate-800 text-slate-300">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-lg font-bold">Mechanic Profile</h2>
                    </div>

                    {/* Content Scrollable */}
                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-800">
                        {/* Profile Header */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <img src={selectedMechanic.image} className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 mb-3" />
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full border border-slate-900 flex items-center gap-1">
                                  <ShieldCheck size={10} /> VERIFIED
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{selectedMechanic.name}</h3>
                            <p className="text-cyan-400 font-medium">{selectedMechanic.specialty}</p>
                            
                            <div className="flex gap-4 mt-4 w-full justify-center">
                                <div className="text-center px-4 py-2 bg-slate-800/50 rounded-xl">
                                    <p className="text-xs text-slate-400 uppercase">Rating</p>
                                    <p className="font-bold text-yellow-400 flex items-center gap-1 justify-center"><Star size={14} fill="currentColor"/> {selectedMechanic.rating}</p>
                                </div>
                                <div className="text-center px-4 py-2 bg-slate-800/50 rounded-xl">
                                    <p className="text-xs text-slate-400 uppercase">Distance</p>
                                    <p className="font-bold text-white">{selectedMechanic.distance}</p>
                                </div>
                                <div className="text-center px-4 py-2 bg-slate-800/50 rounded-xl">
                                    <p className="text-xs text-slate-400 uppercase">Exp</p>
                                    <p className="font-bold text-white">{selectedMechanic.experience}</p>
                                </div>
                            </div>
                        </div>

                        {/* Work Gallery */}
                        <div className="mb-6">
                            <h4 className="font-bold text-slate-300 mb-3 flex items-center gap-2"><ImageIcon size={16}/> Work Gallery</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {selectedMechanic.gallery.map((img: string, i: number) => (
                                    <img key={i} src={img} className="w-full aspect-square object-cover rounded-lg bg-slate-800 border border-slate-700" />
                                ))}
                            </div>
                        </div>

                        {/* Reviews */}
                        <div className="mb-6">
                            <h4 className="font-bold text-slate-300 mb-3 flex items-center gap-2"><ThumbsUp size={16}/> Recent Reviews</h4>
                            <div className="space-y-3">
                                {selectedMechanic.reviews.map((rev: any, i: number) => (
                                    <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm text-white">{rev.user}</span>
                                            <span className="flex text-yellow-500 text-xs"><Star size={10} fill="currentColor"/> {rev.rating}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">"{rev.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900 absolute bottom-0 w-full pb-safe">
                        <button 
                            onClick={() => initiateBooking("Specific Mechanic", false, selectedMechanic)}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Book {selectedMechanic.name} Now
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Main Bottom Sheet (Services) */}
        {!selectedMechanic && !isPaymentModalOpen && (
            <div className={`absolute bottom-0 left-0 w-full z-30 transition-all duration-500 ease-out ${activeBooking ? 'translate-y-0' : 'translate-y-0'}`}>
            <div className="h-20 bg-gradient-to-t from-slate-900 to-transparent w-full pointer-events-none"></div>
            
            <div className="bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-slate-800 pb-safe">
                
                <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                </div>

                {/* IDLE STATE: Service Selection */}
                {activeBooking?.status === 'IDLE' || !activeBooking ? (
                <div className="p-6 pb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-200">Book a Service</h2>
                    
                    <div className="grid grid-cols-4 gap-3 mb-6">
                    {SERVICES.map(service => (
                        <div key={service.id} onClick={() => initiateBooking(service.name)} className="flex flex-col items-center gap-2 cursor-pointer group">
                        <div className="w-full aspect-square bg-slate-800 rounded-2xl flex items-center justify-center text-3xl border border-slate-700 group-hover:border-cyan-500 group-hover:bg-slate-700 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {service.icon}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 text-center group-hover:text-cyan-400 leading-tight">{service.name}</span>
                        </div>
                    ))}
                    </div>
                    
                    <button 
                    onClick={() => initiateBooking('EMERGENCY SOS', true)} 
                    className="w-full relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 active:scale-95 transition-transform text-white font-bold py-4 rounded-2xl shadow-[0_4px_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 text-lg uppercase tracking-wider group"
                    >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="p-1 bg-white/20 rounded-full animate-pulse"><AlertTriangle className="text-white w-6 h-6" fill="white" /></div>
                    Emergency SOS
                    </button>
                </div>
                ) : null}

                {/* SEARCHING STATE */}
                {activeBooking?.status === 'SEARCHING' && (
                <div className="flex flex-col items-center py-8 px-6">
                    <div className="relative mb-6">
                    <div className={`w-24 h-24 border-4 border-t-transparent rounded-full animate-spin ${isEmergency ? 'border-red-500' : 'border-cyan-500'}`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isEmergency ? <AlertTriangle className="text-red-500 w-8 h-8" /> : <Wrench className="text-cyan-500 w-8 h-8" />}
                    </div>
                    </div>
                    <h3 className={`text-2xl font-bold ${isEmergency ? 'text-red-500' : 'text-cyan-400'}`}>
                    {isEmergency ? 'SOS Broadcast Sent!' : 'Connecting...'}
                    </h3>
                    <p className="text-slate-400 mt-2 text-center text-sm">
                    {isEmergency ? 'Alerting all nearby mechanics for immediate assistance.' : 'Finding the best rated mechanic near you.'}
                    </p>
                    <div className="w-full bg-slate-800 h-1 mt-6 mb-2 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-1/3 animate-[loading_1s_ease-in-out_infinite]"></div>
                    </div>
                    <button onClick={() => {setActiveBooking(null); setPendingRequest(null)}} className="mt-4 text-sm text-slate-500 hover:text-white underline">Cancel Request</button>
                </div>
                )}

                {/* ACCEPTED / ACTIVE STATE */}
                {(activeBooking?.status === 'ACCEPTED' || activeBooking?.status === 'IN_PROGRESS' || activeBooking?.status === 'ARRIVED') && (
                <div className="p-6 pt-2">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                        <p className={`font-bold flex items-center gap-2 ${activeBooking.status === 'ACCEPTED' ? 'text-yellow-400' : 'text-green-400'}`}>
                        <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                        {activeBooking.status === 'ACCEPTED' ? 'Mechanic is coming' : 'Service in progress'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Payment</p>
                        <p className={`font-mono text-sm font-bold ${activeBooking.paymentMethod === 'CASH' ? 'text-orange-400' : 'text-green-400'}`}>
                            {activeBooking.paymentMethod === 'CASH' ? 'CASH' : 'PAID ONLINE'}
                        </p>
                    </div>
                    </div>

                    {/* Mechanic Profile */}
                    <div className="flex items-center gap-4 mb-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <div className="relative">
                        <img src={activeBooking.mechanic?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"} alt="Mechanic" className="w-14 h-14 rounded-xl bg-slate-700" />
                        <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[10px] font-bold px-1.5 rounded border border-slate-900">PRO</div>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-lg text-white leading-none mb-1">{activeBooking.mechanic?.name || "Rajesh Verma"}</h4>
                        <p className="text-xs text-slate-400">{activeBooking.mechanic?.specialty || "Hero • Honda • TVS Expert"}</p>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs mt-1">
                        <Star size={12} fill="currentColor" /> <span>{activeBooking.mechanic?.rating || "4.9"}</span> <span className="text-slate-500">(142 Jobs)</span>
                        </div>
                    </div>
                    <button className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-full text-white flex items-center justify-center shadow-lg transition-colors animate-pulse">
                        <Phone size={18} fill="currentColor" />
                    </button>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">Details</button>
                    <button className="py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">Share Location</button>
                    </div>
                </div>
                )}
            </div>
            </div>
        )}
      </div>
    );
  };

  // --- Mechanic View ---
  const MechanicPanel = () => {
    const [tab, setTab] = useState<'HOME' | 'WALLET' | 'PROFILE'>('HOME');
    const [editProfileForm, setEditProfileForm] = useState(mechanicProfile);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const handleAccept = () => {
      setActiveBooking({ status: 'ACCEPTED', mechanic: 'You', paymentMethod: pendingRequest.paymentMethod });
      // Simulate phases
      setTimeout(() => setActiveBooking(prev => ({ ...prev!, status: 'ARRIVED' })), 4000);
    };

    const handleComplete = () => {
      const jobPrice = pendingRequest?.price || 500;
      const commission = jobPrice * 0.10; // 10% Commission
      const isCash = pendingRequest?.paymentMethod === 'CASH';

      setTotalRevenue(prev => prev + jobPrice);
      
      // LOGIC:
      // If CASH: Mechanic has full amount. Wallet balance decreases by commission.
      // If ONLINE: App has full amount. Wallet balance increases by (Price - Commission).
      
      let netChange = 0;
      let type: 'CREDIT' | 'DEBIT' = 'DEBIT';

      if (isCash) {
          netChange = -commission;
          type = 'DEBIT';
      } else {
          netChange = jobPrice - commission;
          type = 'CREDIT';
      }

      setWalletBalance(prev => prev + netChange);

      setTransactions(prev => [{
          id: Date.now(),
          date: 'Just Now',
          service: pendingRequest?.issue || 'Service',
          amount: jobPrice,
          commission: commission,
          net: netChange, 
          type: type,
          method: pendingRequest?.paymentMethod || 'CASH'
      }, ...prev]);

      setActiveBooking(null);
      setPendingRequest(null);
    };

    const handleAddFunds = () => {
        setWalletBalance(prev => prev + 500);
        setTransactions(prev => [{
            id: Date.now(),
            date: 'Top-up',
            service: 'Wallet Recharge',
            amount: 500,
            commission: 0,
            net: 500,
            type: 'CREDIT',
            method: 'UPI'
        }, ...prev]);
    };

    const saveProfile = () => {
        setMechanicProfile(editProfileForm);
        setIsEditingProfile(false);
    };

    if (tab === 'PROFILE') {
        return (
            <div className="h-screen bg-black text-white p-4 flex flex-col font-sans overflow-y-auto">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setTab('HOME')} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><ArrowLeft size={20}/></button>
                        <h2 className="text-xl font-bold">My Profile</h2>
                    </div>
                    {isEditingProfile ? (
                        <button onClick={saveProfile} className="text-green-500 font-bold px-3 py-1 bg-green-500/10 rounded-lg">Save</button>
                    ) : (
                        <button onClick={() => {setEditProfileForm(mechanicProfile); setIsEditingProfile(true)}} className="text-cyan-500 font-bold px-3 py-1 bg-cyan-500/10 rounded-lg">Edit</button>
                    )}
                 </div>

                 <div className="space-y-6 pb-safe">
                     {/* Photos */}
                     <div>
                         <label className="text-sm text-slate-400 font-bold mb-2 block">Shop Photos</label>
                         <div className="grid grid-cols-3 gap-2">
                             {editProfileForm.images.slice(0,3).map((img, i) => (
                                 <img key={i} src={img} className="w-full h-24 object-cover rounded-lg bg-slate-800" />
                             ))}
                             {isEditingProfile && (
                                 <div className="w-full h-24 rounded-lg bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                                     <ImagePlus size={20}/>
                                 </div>
                             )}
                         </div>
                     </div>

                     <div className="space-y-4">
                         <div>
                             <label className="text-sm text-slate-400 font-bold mb-1 block">Full Name</label>
                             {isEditingProfile ? (
                                 <input value={editProfileForm.name} onChange={e => setEditProfileForm({...editProfileForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" />
                             ) : (
                                 <div className="text-lg font-medium">{mechanicProfile.name}</div>
                             )}
                         </div>

                         <div>
                             <label className="text-sm text-slate-400 font-bold mb-1 block">Shop Name</label>
                             {isEditingProfile ? (
                                 <input value={editProfileForm.shopName} onChange={e => setEditProfileForm({...editProfileForm, shopName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" />
                             ) : (
                                 <div className="text-lg font-medium">{mechanicProfile.shopName}</div>
                             )}
                         </div>

                         <div>
                             <label className="text-sm text-slate-400 font-bold mb-1 block">Specialization</label>
                             {isEditingProfile ? (
                                 <select value={editProfileForm.specialty} onChange={e => setEditProfileForm({...editProfileForm, specialty: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                                     <option>General Bike Service</option>
                                     <option>Royal Enfield Expert</option>
                                     <option>Sports Bike Specialist</option>
                                 </select>
                             ) : (
                                 <div className="text-lg font-medium text-cyan-400">{mechanicProfile.specialty}</div>
                             )}
                         </div>

                         <div>
                             <label className="text-sm text-slate-400 font-bold mb-1 block">Experience</label>
                             {isEditingProfile ? (
                                 <input value={editProfileForm.experience} onChange={e => setEditProfileForm({...editProfileForm, experience: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" />
                             ) : (
                                 <div className="text-lg font-medium">{mechanicProfile.experience}</div>
                             )}
                         </div>
                     </div>
                 </div>
            </div>
        )
    }

    if (tab === 'WALLET') {
        return (
            <div className="h-screen bg-black text-white p-4 flex flex-col font-sans">
                 <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setTab('HOME')} className="p-2 bg-slate-800 rounded-full"><ArrowLeft size={20}/></button>
                    <h2 className="text-xl font-bold">Earnings Wallet</h2>
                 </div>

                 {/* Balance Card */}
                 <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 relative overflow-hidden mb-6 shadow-2xl">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={100}/></div>
                     <p className="text-indigo-300 text-sm font-bold uppercase tracking-wider mb-2">Platform Balance</p>
                     
                     <h1 className={`text-4xl font-black mb-4 ${walletBalance < 0 ? 'text-red-500' : 'text-white'}`}>
                        ₹{walletBalance.toFixed(0)}
                     </h1>
                     
                     {walletBalance < 0 && (
                         <div className="bg-red-500/20 border border-red-500/50 p-2 rounded-lg text-red-200 text-xs mb-4 flex items-center gap-2">
                             <AlertTriangle size={14} /> You owe commissions. Please recharge.
                         </div>
                     )}

                     <div className="flex gap-2">
                         <button 
                            onClick={handleAddFunds}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold shadow-lg transition-colors"
                        >
                            {walletBalance < 0 ? 'Pay Dues / Recharge' : 'Add Money'}
                         </button>
                         <button className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-bold">History</button>
                     </div>
                 </div>

                 <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
                     <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0">
                         <h3 className="font-bold text-slate-300 flex items-center gap-2"><History size={16}/> Transaction History</h3>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2">
                         {transactions.map(t => (
                             <div key={t.id} className="p-3 mb-2 bg-slate-800/50 rounded-xl border border-slate-800/50">
                                 <div className="flex justify-between items-start mb-1">
                                     <h4 className="font-bold text-white">{t.service}</h4>
                                     <span className={`font-bold font-mono ${t.type === 'DEBIT' ? 'text-red-400' : 'text-green-400'}`}>
                                         {t.type === 'DEBIT' ? '' : '+'}{t.net > 0 ? `₹${t.net}` : `-₹${Math.abs(t.net)}`}
                                     </span>
                                 </div>
                                 <p className="text-xs text-slate-500 mb-2">{t.date} • {t.method === 'CASH' ? 'Cash Job' : 'Online Job'}</p>
                                 {t.commission > 0 && (
                                    <div className="flex justify-between items-center text-[10px] bg-slate-900 p-2 rounded-lg">
                                        <span className="text-slate-400">Total: ₹{t.amount}</span>
                                        <span className="text-red-400">Comm (10%): ₹{t.commission}</span>
                                    </div>
                                 )}
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
        )
    }

    return (
      <div className="h-screen bg-black text-white p-4 flex flex-col font-sans">
        <div className="flex justify-between items-center mb-6 pt-2">
           <div>
             <h1 className="text-2xl font-black italic tracking-tighter text-white flex items-center gap-1">
               <Wrench className="text-orange-500" fill="currentColor" /> PARTNER
             </h1>
             <p className="text-slate-500 text-xs font-mono">ID: {mechanicProfile.shopName.substring(0,3).toUpperCase()}-8821 • ONLINE</p>
           </div>
           
           <div className="flex gap-2">
               <button 
                  onClick={() => setTab('PROFILE')}
                  className={`p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400 hover:text-cyan-400`}
               >
                 <User size={20} />
               </button>
               <button 
                  onClick={() => setTab('WALLET')}
                  className={`p-2 bg-slate-900 rounded-full border border-slate-800 ${walletBalance < 0 ? 'text-red-500 animate-pulse border-red-500' : 'text-slate-400 hover:text-green-400'}`}
               >
                 <Wallet size={20} />
               </button>
               <button 
                  onClick={() => setViewMode('LANDING')}
                  className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white border border-slate-800"
               >
                 <LogOut size={20} />
               </button>
           </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10"><DollarSign size={40} /></div>
            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-white tracking-tight">₹{totalRevenue}</p>
          </div>
          <div onClick={() => setTab('WALLET')} className={`cursor-pointer bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border relative overflow-hidden hover:border-cyan-500/30 transition-colors ${walletBalance < 0 ? 'border-red-500' : 'border-slate-800'}`}>
            <div className="absolute top-0 right-0 p-3 opacity-10"><Wallet size={40} /></div>
            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Wallet</p>
            <p className={`text-3xl font-bold tracking-tight ${walletBalance < 0 ? 'text-red-500' : 'text-green-400'}`}>₹{walletBalance.toFixed(0)}</p>
          </div>
        </div>

        {/* Online Toggle */}
        <button 
          onClick={() => setMechanicOnline(!mechanicOnline)}
          className={`w-full py-4 rounded-xl font-bold border-2 transition-all mb-6 flex items-center justify-center gap-3 ${mechanicOnline ? 'bg-green-900/20 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-900/20 border-red-500 text-red-500'}`}
        >
          <div className={`w-3 h-3 rounded-full ${mechanicOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          {mechanicOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
        </button>

        {/* Incoming Request Modal */}
        {pendingRequest && activeBooking?.status === 'SEARCHING' && (
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
              <div className={`w-full max-w-sm bg-slate-900 border rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-[float_3s_ease-in-out_infinite] ${pendingRequest.isEmergency ? 'border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : 'border-cyan-500'}`}>
                
                {pendingRequest.isEmergency && (
                  <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center text-xs font-bold py-2 animate-pulse uppercase tracking-widest">
                    ⚠️ Emergency Request ⚠️
                  </div>
                )}
                
                <div className="mt-6 text-center">
                   <div className="inline-flex p-4 rounded-full bg-slate-800 mb-4 relative">
                      <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${pendingRequest.isEmergency ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                      {pendingRequest.isEmergency ? <AlertTriangle className="text-red-500 w-10 h-10 relative z-10" /> : <Wrench className="text-cyan-400 w-10 h-10 relative z-10" />}
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-1">New Job Request</h2>
                   <p className="text-slate-400 text-sm flex justify-center items-center gap-1">
                     <MapPin size={14}/> {pendingRequest.distance} away
                   </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 my-6 space-y-3 border border-slate-700">
                  <div className="flex justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400 text-sm">Customer</span>
                    <span className="text-white font-medium">{pendingRequest.customer}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400 text-sm">Bike</span>
                    <span className="text-white font-medium">{pendingRequest.bike}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400 text-sm">Payment Method</span>
                    <span className={`font-bold uppercase ${pendingRequest.paymentMethod === 'CASH' ? 'text-orange-400' : 'text-green-400'}`}>{pendingRequest.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400 text-sm">Job Price</span>
                    <span className="text-white font-bold">₹{pendingRequest.price}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400 text-sm">Your Earning (90%)</span>
                    <span className="text-green-400 font-bold">₹{pendingRequest.price * 0.9}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                   <button onClick={() => setPendingRequest(null)} className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors">Decline</button>
                   <button onClick={handleAccept} className={`flex-1 py-4 rounded-xl text-white font-bold shadow-lg transform transition-transform active:scale-95 ${pendingRequest.isEmergency ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}>Accept (15s)</button>
                </div>
              </div>
           </div>
        )}

        {/* Active Job View */}
        {activeBooking?.status === 'IN_PROGRESS' || activeBooking?.status === 'ACCEPTED' || activeBooking?.status === 'ARRIVED' ? (
           <div className="flex-1 bg-slate-900 rounded-3xl p-1 border border-slate-800 flex flex-col relative overflow-hidden">
              <div className="h-full bg-slate-900 rounded-[22px] p-5 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-xl text-white">Current Job</h3>
                    <p className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-1 ${activeBooking.status === 'ARRIVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {activeBooking.status === 'ACCEPTED' ? 'NAVIGATING TO CLIENT' : 'ON SITE'}
                    </p>
                  </div>
                  {pendingRequest?.lat && (
                     <a 
                       href={`https://www.google.com/maps/dir/?api=1&destination=${pendingRequest.lat},${pendingRequest.lng}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white border border-slate-700 flex items-center gap-2 font-bold shadow-lg animate-pulse"
                     >
                       <Navigation size={18} /> GO MAPS
                     </a>
                  )}
                </div>

                <div className="flex-1 bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-4 overflow-y-auto">
                    <h4 className="text-slate-400 text-sm uppercase font-bold mb-3">Service Checklist</h4>
                    <div className="space-y-3">
                        {['Inspect Engine Oil', 'Check Brake Pads', 'Air Filter Clean', 'Chain Lube', 'Washing'].map((item, i) => (
                            <label key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-offset-0 focus:ring-0" />
                                <span className="text-slate-300">{item}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="bg-slate-800/50 p-3 rounded-xl mb-4 text-sm text-center">
                    {activeBooking.paymentMethod === 'CASH' ? (
                        <>
                            <p className="text-slate-400">Collect Cash from Customer</p>
                            <p className="text-orange-400 font-bold text-xl">₹{pendingRequest?.price}</p>
                            <p className="text-[10px] text-slate-500 mt-1">₹{(pendingRequest?.price || 0) * 0.1} Commission will be deducted from wallet</p>
                        </>
                    ) : (
                        <>
                            <p className="text-slate-400">Payment Received Online</p>
                            <p className="text-green-400 font-bold text-xl">₹{pendingRequest?.price}</p>
                            <p className="text-[10px] text-slate-500 mt-1">₹{(pendingRequest?.price || 0) * 0.9} will be credited to wallet</p>
                        </>
                    )}
                </div>

                <button 
                  onClick={handleComplete}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                   <CheckCircle size={20} /> Mark Job Complete
                </button>
              </div>
           </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
                    <Zap size={30} />
                </div>
                <p>Waiting for new requests...</p>
            </div>
        )}
      </div>
    );
  };

  // --- Admin Panel ---
  const AdminPanel = () => {
    return (
      <div className="h-screen bg-slate-950 text-white flex font-sans">
         {/* Sidebar */}
         <div className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex">
            <div>
                <h2 className="text-2xl font-black text-white italic mb-10 flex items-center gap-2"><Zap className="text-cyan-500"/> ADMIN</h2>
                <nav className="space-y-2">
                    {['Dashboard', 'Mechanics', 'Customers', 'Revenue', 'Settings'].map((item, i) => (
                        <div key={item} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 ${i===0 ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                            {i===0 && <LayoutDashboard size={20} />}
                            {i===1 && <Wrench size={20} />}
                            {i===2 && <Users size={20} />}
                            {i===3 && <DollarSign size={20} />}
                            {i===4 && <Settings size={20} />}
                            <span>{item}</span>
                        </div>
                    ))}
                </nav>
            </div>
            <button onClick={() => setViewMode('LANDING')} className="p-3 flex items-center gap-3 text-slate-400 hover:text-white">
                <LogOut size={20} /> Logout
            </button>
         </div>

         {/* Mobile Header for Admin */}
         <div className="md:hidden absolute top-4 right-4 z-50">
            <button onClick={() => setViewMode('LANDING')} className="p-2 bg-slate-800 rounded-full text-white"><LogOut size={16}/></button>
         </div>

         {/* Main Content */}
         <div className="flex-1 p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6">Master Dashboard</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Platform Revenue', value: '₹12,450', icon: DollarSign, color: 'text-green-400', sub: 'Commission (10%)' },
                    { label: 'Total Job Value', value: '₹1,24,500', icon: Briefcase, color: 'text-blue-400', sub: 'Gross Volume' },
                    { label: 'Online Mechanics', value: '45', icon: Wrench, color: 'text-orange-400', sub: 'Active Now' },
                    { label: 'Total Users', value: '1,204', icon: Users, color: 'text-purple-400', sub: '+12 Today' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-slate-950 ${stat.color} border border-slate-800`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-xs font-bold text-green-500 bg-green-900/20 px-2 py-1 rounded">↗</span>
                        </div>
                        <h3 className="text-slate-400 text-sm uppercase font-bold tracking-wider">{stat.label}</h3>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Live Map Placeholder (Heatmap) */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Live Service Heatmap</h3>
                    <div className="flex gap-2">
                         <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                         <span className="text-xs text-slate-400">Live Updates</span>
                    </div>
                </div>
                <div className="h-64 bg-slate-950 rounded-xl relative overflow-hidden">
                     {/* Fake Map Grid */}
                     <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                     {/* Heat Points */}
                     <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
                     <div className="absolute top-3/4 right-1/3 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                     <div className="absolute top-1/2 right-10 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                     
                     {/* Floating Markers */}
                     <div className="absolute top-[30%] left-[25%] p-2 bg-slate-900 rounded-lg border border-slate-700 shadow-xl">
                        <Wrench size={16} className="text-cyan-400" />
                     </div>
                     <div className="absolute top-[60%] right-[40%] p-2 bg-slate-900 rounded-lg border border-slate-700 shadow-xl">
                        <Wrench size={16} className="text-cyan-400" />
                     </div>
                </div>
            </div>

            {/* Recent Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="font-bold text-lg">Recent Bookings & Commissions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Mechanic</th>
                                <th className="p-4">Job Amt</th>
                                <th className="p-4 text-green-400">Commission (10%)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[1,2,3,4].map((i) => (
                                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                                    <td className="p-4 font-mono text-slate-500">#BK-90{i}</td>
                                    <td className="p-4 font-medium">Customer {i}</td>
                                    <td className="p-4 text-slate-300">Rajesh Verma</td>
                                    <td className="p-4 text-white">₹450</td>
                                    <td className="p-4 text-green-400 font-bold">+₹45</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
      </div>
    );
  };

  // --- Landing / Splash View ---
  const LandingPage = () => {
      return (
          <div className="h-screen bg-black relative flex flex-col items-center justify-center p-6 overflow-hidden">
              {/* Background Effects */}
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"></div>
              <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              
              <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] mb-8 animate-[float_4s_ease-in-out_infinite]">
                      <Zap size={48} className="text-white fill-white" />
                  </div>
                  
                  <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2 text-center">
                      BIKE<span className="text-cyan-400">FIX</span>
                  </h1>
                  <p className="text-slate-400 text-center mb-12">Next-Gen AI Powered Service</p>

                  <div className="w-full space-y-4">
                      <button 
                        onClick={() => setViewMode('CUSTOMER')}
                        className="w-full p-4 bg-white text-black rounded-xl font-bold text-lg flex items-center justify-between hover:scale-[1.02] transition-transform shadow-xl"
                      >
                          <span className="flex items-center gap-3"><User /> Customer App</span>
                          <ChevronRight />
                      </button>

                      <button 
                        onClick={() => {
                            if (mechanicProfile.isRegistered) {
                                setViewMode('MECHANIC');
                            } else {
                                setViewMode('MECHANIC_REGISTRATION');
                            }
                        }}
                        className="w-full p-4 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold text-lg flex items-center justify-between hover:bg-slate-800 transition-colors"
                      >
                          <span className="flex items-center gap-3"><Wrench className="text-cyan-400" /> Mechanic Partner</span>
                          <ChevronRight className="text-slate-500" />
                      </button>

                      <button 
                        onClick={() => setViewMode('ADMIN')}
                        className="w-full p-4 bg-transparent border border-slate-800 text-slate-400 rounded-xl font-bold text-lg flex items-center justify-between hover:bg-slate-900 hover:text-white transition-colors"
                      >
                          <span className="flex items-center gap-3"><ShieldCheck /> Admin Console</span>
                          <ChevronRight className="text-slate-500" />
                      </button>
                  </div>
                  
                  <p className="absolute bottom-[-100px] text-xs text-slate-600">v2.4.0 • Gemini AI Integrated</p>
              </div>
          </div>
      )
  }

  const Splash = () => (
      <div className="h-screen bg-black flex items-center justify-center relative overflow-hidden">
          <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
          <Zap size={80} className="text-white relative z-10 animate-bounce" fill="currentColor" />
      </div>
  )

  // --- Render Logic ---
  return (
    <div className="w-full h-full bg-slate-950 text-slate-200">
       {viewMode === 'SPLASH' && <Splash />}
       {viewMode === 'LANDING' && <LandingPage />}
       {viewMode === 'CUSTOMER' && <CustomerPanel />}
       {viewMode === 'MECHANIC_REGISTRATION' && <MechanicRegistration />}
       {viewMode === 'WELCOME_LETTER' && <WelcomeLetter />}
       {viewMode === 'MECHANIC' && <MechanicPanel />}
       {viewMode === 'ADMIN' && <AdminPanel />}
    </div>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(<App />);