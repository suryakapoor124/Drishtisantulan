import React, { useMemo, useState } from 'react';
import { 
  Heart, Activity, Users, BarChart2, Settings, Sun, Moon, Wind, 
  Smile, Meh, BookOpen, ArrowRight, CheckCircle,
  Lock, RefreshCw, Zap, CloudRain, Send, CloudLightning, Sparkles,
  Calendar, Coffee, Music, MapPin, Feather, Fingerprint
} from 'lucide-react';

// --- Configuration & Constants ---

const COLORS = {
  primary: '#6366f1', // Indigo
  secondary: '#14b8a6', // Teal
  accent: '#f43f5e', // Rose
  background: '#f8fafc', // Slate 50
  text: '#1e293b', // Slate 800
  textLight: '#64748b', // Slate 500
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

const EMOTIONS = [
  'Happy', 'Neutral', 'Sad', 'Anxious', 'Stressed', 'Angry', 'Low-Energy'
];

const SUGGESTIONS = {
  'Stressed': {
    daily: { title: 'Breathing Session', icon: Wind, desc: '5-minute deep breathing.' },
    weekly: { title: 'Yoga Morning', icon: Sun, desc: 'Join the sunrise yoga group.' },
    monthly: { title: 'Time-Mgmt Workshop', icon: Calendar, desc: 'Learn to balance workload.' }
  },
  'Low-Energy': {
    daily: { title: 'Hydration Reminder', icon: Coffee, desc: 'Drink a glass of water now.' },
    weekly: { title: 'Healthy Breakfast', icon: Coffee, desc: 'Community breakfast this Sunday.' },
    monthly: { title: 'Sports Tournament', icon: Activity, desc: 'Get moving with intramurals.' }
  },
  'Anxious': {
    daily: { title: 'Quiet Library Hour', icon: BookOpen, desc: 'Find a silent corner.' },
    weekly: { title: 'Mindfulness Walk', icon: MapPin, desc: 'Guided walk through campus.' },
    monthly: { title: 'Psych Awareness Day', icon: Heart, desc: 'Workshops on anxiety.' }
  },
  'Sad': {
    daily: { title: 'Gratitude Wall', icon: Feather, desc: 'Write one thing you are grateful for.' },
    weekly: { title: 'Movie Night', icon: Moon, desc: 'Relax with a comedy classic.' },
    monthly: { title: 'Bonding Festival', icon: Users, desc: 'Connect with peers.' }
  },
  'Angry': {
    daily: { title: 'Stretch Break', icon: Activity, desc: 'Release tension physically.' },
    weekly: { title: 'Sports Evening', icon: Activity, desc: 'Burn off energy.' },
    monthly: { title: 'Art Exhibition', icon: Feather, desc: 'Express through creativity.' }
  },
  'Happy': {
    daily: { title: 'Positive Note Board', icon: Smile, desc: 'Leave a kind note for others.' },
    weekly: { title: 'Open Mic Night', icon: Music, desc: 'Share your joy.' },
    monthly: { title: 'Motivational Speaker', icon: Sparkles, desc: 'Inspire others.' }
  },
  'Neutral': {
    daily: { title: 'Journaling', icon: BookOpen, desc: 'Reflect on your day.' },
    weekly: { title: 'Nature Walk', icon: Wind, desc: 'Get some fresh air.' },
    monthly: { title: 'Skill Workshop', icon: Settings, desc: 'Learn something new.' }
  }
};

const apiKey = "AIzaSyAp_b0_oIlwvSdo2O6BUpI4lXbC0z_1KNc"; // API Key injected by environment

// --- Mock Backend Simulation (SQLite Replacement) ---

const MockBackend = {
  authenticate: (id, pass) => {
    if (id === 'admin123' && pass === '123') return { success: true, role: 'admin' };
    if (id === 'uni123' && pass === '123') return { success: true, role: 'university' };
    return { success: false };
  },

  syncData: (studentLogs) => {
    const existingData = JSON.parse(localStorage.getItem('campus_pulse_data') || '[]');
    
    // Prevent duplicates by checking timestamps
    const existingTimestamps = new Set(existingData.map(d => d.timestamp));
    const newLogs = studentLogs.filter(l => !existingTimestamps.has(l.timestamp));
    
    if (newLogs.length === 0) return true;

    const updatedData = [...existingData, ...newLogs];
    localStorage.setItem('campus_pulse_data', JSON.stringify(updatedData));
    
    // Generate Weekly Report Simulation
    const reports = JSON.parse(localStorage.getItem('weekly_reports') || '[]');
    if (newLogs.length > 0) {
        const lastLog = newLogs[newLogs.length - 1];
        const newReport = {
            id: Date.now(),
            week_start: new Date().toLocaleDateString(),
            student_id_hash: Math.random().toString(36).substring(7),
            trend_summary: `Student shows fluctuating mood with ${lastLog.sentiment || 'Neutral'} tendencies.`,
            dominant_emotion: lastLog.sentiment || 'Neutral',
            stress_peak: lastLog.stress > 3,
            suggestion_id: lastLog.sentiment || 'Neutral'
        };
        reports.push(newReport);
        localStorage.setItem('weekly_reports', JSON.stringify(reports));
    }
    return true;
  },

  getCampusData: () => {
    return JSON.parse(localStorage.getItem('campus_pulse_data') || '[]');
  },

  getWeeklyReports: () => {
    return JSON.parse(localStorage.getItem('weekly_reports') || '[]');
  },

  getAggregatedStats: () => {
    const data = JSON.parse(localStorage.getItem('campus_pulse_data') || '[]');
    const validData = data.filter(d => d && typeof d.mood === 'number' && !isNaN(d.mood));
    
    if (validData.length === 0) return { avgMood: 0, count: 0, topStressor: 'None' };

    const totalMood = validData.reduce((acc, curr) => acc + curr.mood, 0);
    const avgMood = (totalMood / validData.length).toFixed(1);
    
    // Find top sentiment
    const sentiments = validData.map(d => d.sentiment).filter(Boolean);
    const counts = {};
    let topStressor = 'None';
    let maxCount = 0;
    
    for (const s of sentiments) {
      counts[s] = (counts[s] || 0) + 1;
      if (counts[s] > maxCount) {
        maxCount = counts[s];
        topStressor = s;
      }
    }

    return { avgMood, count: validData.length, topStressor };
  }
};

// --- Gemini AI Service ---

const GeminiService = {
  analyzeMood: async (entry) => {
    const prompt = `
      Analyze this student mood log:
      "Mood: ${entry.mood}/5, Stress: ${entry.stress}/5, Energy: ${entry.energy}/5, Sleep: ${entry.sleep}/5. 
      Anxiety: ${entry.anxiety}/5, Focus: ${entry.focus}/5, Social: ${entry.social}/5, Optimism: ${entry.optimism}/5.
      Journal: ${entry.text}"
      
      Task:
      1. Classify into one of: Happy, Neutral, Sad, Anxious, Stressed, Angry, Low-Energy.
      2. Extract key keywords.
      3. Provide a 1-sentence insight.
      
      Output JSON: { "sentiment": "...", "keywords": ["..."], "insight": "..." }
    `;
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              })
            }
        );
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        return { sentiment: 'Neutral', keywords: [], insight: 'Keep tracking to see patterns.' };
    }
  },

  generateWeeklyReport: async (campusData) => {
    if (!campusData || campusData.length === 0) {
        return { trend: "No Data Available", stressor: "None", intervention: "Students must sync logs first." };
    }

    const summary = campusData.slice(-20).map(d => `Mood:${d.mood}, Stress:${d.stress}, Sentiment:${d.sentiment}`).join('\n');
    const prompt = `
      Analyze these anonymous logs for a University Weekly Report:
      ${summary}
      
      Output JSON: { "trend": "...", "stressor": "...", "intervention": "..." }
    `;
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              })
            }
        );
        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return { trend: "API Error", stressor: "Check Console", intervention: data.error.message || "Service Unavailable" };
        }

        if (!data.candidates || !data.candidates[0]?.content) {
             console.error("Unexpected API Response:", data);
             return { trend: "Analysis Failed", stressor: "Invalid Response", intervention: "Try again later" };
        }

        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) { 
        console.error("Report Generation Failed:", e);
        return { trend: "Connection Failed", stressor: "Network Error", intervention: "Check internet connection" }; 
    }
  }
};

// --- Shared UI Helpers ---

const StatCard = ({ label, value, detail, accent = 'text-indigo-600' }) => (
  <ModernCard className="space-y-2">
    <p className={`text-[11px] font-bold uppercase tracking-widest ${accent}`}>{label}</p>
    <p className="text-3xl font-black text-slate-800">{value}</p>
    {detail && <p className="text-xs text-slate-500">{detail}</p>}
  </ModernCard>
);

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <ModernCard className="text-center py-10 space-y-4">
    <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-indigo-600 border border-slate-200">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-lg font-bold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
    {action}
  </ModernCard>
);

const SuggestionCard = ({ type, data }) => {
    const Icon = data.icon;
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-300 transition-all group">
            <div className={`p-3 rounded-xl ${type === 'Daily' ? 'bg-indigo-50 text-indigo-600' : type === 'Weekly' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 group-hover:text-slate-600 transition-colors">{type} Activity</p>
                <h4 className="font-bold text-slate-800">{data.title}</h4>
                <p className="text-xs text-slate-500">{data.desc}</p>
            </div>
        </div>
    );
};

// --- Components ---

const ModernCard = ({ children, className = "" }) => (
  <div className={`modern-card p-6 rounded-2xl ${className}`}>
    {children}
  </div>
);

const MoodInput = ({ label, value, onChange, min = 1, max = 5, lowLabel, highLabel }) => {
    const getEmoji = (val) => {
        if (val <= 1.5) return '😫';
        if (val <= 2.5) return '😕';
        if (val <= 3.5) return '😐';
        if (val <= 4.5) return '🙂';
        return '🤩';
    };

    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
            <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">{label}</span>
                <div className="text-4xl transition-all duration-300 transform hover:scale-110 cursor-default drop-shadow-sm" key={Math.floor(value)}>
                    {getEmoji(value)}
                </div>
            </div>
            
            <div className="relative h-6 flex items-center">
                <input 
                    type="range" min={min} max={max} step="0.1" value={value} 
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer z-10 relative"
                    style={{
                        background: `linear-gradient(to right, #6366f1 0%, #14b8a6 ${((value-min)/(max-min))*100}%, #e2e8f0 ${((value-min)/(max-min))*100}%, #e2e8f0 100%)`
                    }}
                />
            </div>
            
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lowLabel}</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{Number(value).toFixed(1)}</span>
                <span>{highLabel}</span>
            </div>
        </div>
    );
};

const TrendChart = ({ data }) => {
  const max = 5;
  const height = 100;

  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-400 text-xs font-mono">
        NO DATA STREAM
      </div>
    );
  }

  const span = Math.max(data.length - 1, 1);
  const width = Math.max(span * 40, 260);
  const stepX = data.length === 1 ? 0 : width / (data.length - 1);
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - (d.mood / max) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="w-full h-32 flex items-center justify-center relative overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.2"/>
          </filter>
        </defs>
        <polyline
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />
        {data.map((d, i) => {
          const x = i * stepX;
          const y = height - (d.mood / max) * height;
          return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

// --- Main Application ---

// --- Sub-Components (Defined Outside App) ---

const LandingPage = ({ setView }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in relative overflow-hidden bg-slate-50">
    <div className="relative z-10">
      <div className="w-24 h-24 bg-white rounded-3xl border border-slate-200 shadow-xl flex items-center justify-center mb-6 mx-auto animate-float">
        <Wind size={40} className="text-indigo-600" />
      </div>
      <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-2">Drishti<span className="text-indigo-600">Santulan</span></h1>
      <p className="text-slate-500 font-bold tracking-widest text-xs uppercase mb-8 bg-white inline-block px-4 py-2 rounded-full border border-slate-200 shadow-sm">Vision • Balance • Insight</p>
      <div className="grid gap-4 w-full max-w-sm mt-10 mx-auto">
        <button onClick={() => setView('student-auth')} className="modern-btn primary w-full p-4 rounded-xl flex items-center justify-center gap-3 text-lg">
          <Smile size={24} /> Student Login
        </button>
        <div className="flex gap-3">
          <button onClick={() => setView('uni-auth')} className="modern-btn flex-1 p-3 rounded-xl flex items-center justify-center gap-2 text-sm">
            <Users size={16} /> University
          </button>
          <button onClick={() => setView('admin-auth')} className="modern-btn flex-1 p-3 rounded-xl flex items-center justify-center gap-2 text-sm">
            <Settings size={16} /> Admin
          </button>
        </div>
      </div>
    </div>
  </div>
);

const StudentDashboard = ({ recoveryKey, setView, studentHistory, onLogSubmit, syncStatus, onSync }) => {
  const [activeTab, setActiveTab] = useState('checkin');
  const [form, setForm] = useState({ 
    mood: 3, stress: 3, energy: 3, sleep: 3, 
    anxiety: 3, focus: 3, social: 3, optimism: 3,
    text: '' 
  });
  const [checkinStep, setCheckinStep] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const entryCount = studentHistory.length;
  const lastEntry = studentHistory[entryCount - 1];
  const dominantSentiment = lastEntry?.sentiment || 'Neutral';
  const suggestions = SUGGESTIONS[dominantSentiment] || SUGGESTIONS['Neutral'];

  const questions = [
    { key: 'mood', label: 'Overall Mood', low: 'Low', high: 'High', icon: Smile },
    { key: 'stress', label: 'Stress Level', low: 'Calm', high: 'Panic', icon: CloudRain },
    { key: 'energy', label: 'Energy Level', low: 'Drained', high: 'Charged', icon: Zap },
    { key: 'sleep', label: 'Sleep Quality', low: 'Poor', high: 'Great', icon: Moon },
    { key: 'anxiety', label: 'Anxiety', low: 'Peaceful', high: 'Anxious', icon: Wind },
    { key: 'focus', label: 'Focus', low: 'Scattered', high: 'Laser', icon: Activity },
    { key: 'social', label: 'Social Connection', low: 'Lonely', high: 'Connected', icon: Users },
    { key: 'optimism', label: 'Optimism', low: 'Pessimistic', high: 'Hopeful', icon: Sun },
  ];

  const handleSubmit = async () => {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 2500));
      await onLogSubmit(form);
      setIsSubmitting(false);
      setForm({ 
        mood: 3, stress: 3, energy: 3, sleep: 3, 
        anxiety: 3, focus: 3, social: 3, optimism: 3,
        text: '' 
      });
      setCheckinStep(0);
      setTimeout(() => setActiveTab('stats'), 500);
  };

  return (
    <div className="min-h-screen pb-24 relative bg-slate-50">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-600 border-r-teal-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">PROCESSING</h3>
            <p className="text-indigo-600 font-mono animate-pulse">Generating personalized insights...</p>
        </div>
      )}

      {recoveryKey && (
        <div className="bg-white text-slate-600 p-3 text-center border-b border-slate-200 flex flex-wrap items-center justify-center gap-3 text-sm shadow-sm">
          <span className="uppercase tracking-[0.3em] text-[11px] text-slate-400">Recovery Key</span>
          <span className="font-mono font-bold text-indigo-600 text-base">{recoveryKey}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex flex-col gap-3 items-start sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.4em] text-indigo-600 uppercase mb-1 font-bold">Student Console</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Drishti<span className="text-indigo-600">Santulan</span></h1>
          </div>
          <button onClick={() => setView('landing')} className="modern-btn inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl">
            <Settings size={18} /> Exit
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['checkin', 'stats', 'journal'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`modern-btn capitalize px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'checkin' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] animate-fade-in items-start">
              <div className="space-y-8">
                  <ModernCard className="bg-gradient-to-br from-indigo-50 to-teal-50 border-indigo-100">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                            <Feather size={28} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-800">Daily Check-in</h3>
                            <p className="text-slate-500 font-medium text-sm">Scroll down to log your mood.</p>
                          </div>
                      </div>
                  </ModernCard>

                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                        <div key={q.key} className={`transform transition-all hover:scale-[1.01]`}>
                            <MoodInput 
                              label={q.label} 
                              value={form[q.key]} 
                              onChange={v => setForm({...form, [q.key]: v})} 
                              lowLabel={q.low} 
                              highLabel={q.high} 
                            />
                        </div>
                    ))}
                  </div>

                  <ModernCard className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-xl font-black text-slate-800">Final Thoughts</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Anything else on your mind?</p>
                      </div>
                      <textarea 
                          className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all min-h-[120px] font-medium text-slate-700 placeholder-slate-400"
                          placeholder="Write your thoughts here..."
                          value={form.text}
                          onChange={e => setForm({...form, text: e.target.value})}
                      />
                      <button onClick={handleSubmit} className="modern-btn primary w-full px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all">
                          Log Reflection <Send size={20} />
                      </button>
                  </ModernCard>
              </div>

              <div className="space-y-6 sticky top-6">
                  <ModernCard className="bg-white border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-slate-100 rounded-lg"><CloudLightning size={20} className="text-yellow-500" /></div>
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync Status</p>
                              <p className="font-bold text-slate-800">{syncStatus === 'idle' ? 'Ready to Sync' : syncStatus === 'synced' ? 'Up to Date' : 'Syncing...'}</p>
                          </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-4">Anonymously contribute to campus wellbeing stats.</p>
                      <button onClick={onSync} disabled={syncStatus !== 'idle'} className="modern-btn w-full py-3 rounded-xl font-bold text-sm transition">
                          {syncStatus === 'synced' ? 'Synced' : 'Sync Now'}
                      </button>
                  </ModernCard>
                  
                  {lastEntry && (
                      <ModernCard>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">AI Insight</p>
                          <p className="text-sm font-bold text-slate-600 italic">"{lastEntry.insight}"</p>
                      </ModernCard>
                  )}
              </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-3">
                  <StatCard label="Current Mood" value={lastEntry?.mood || '-'} detail="Last check-in" />
                  <StatCard label="Dominant Emotion" value={dominantSentiment} detail="Based on AI analysis" accent="text-teal-600" />
                  <StatCard label="Stress Level" value={lastEntry?.stress || '-'} detail="Self-reported" accent="text-rose-500" />
              </div>
              
              <ModernCard>
                  <h3 className="font-bold text-slate-800 mb-6">7-Day Emotional Trend</h3>
                  <TrendChart data={studentHistory} />
              </ModernCard>

              <div className="space-y-4">
                  <h3 className="font-bold text-slate-800">Suggested for You</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                      <SuggestionCard type="Daily" data={suggestions.daily} />
                      <SuggestionCard type="Weekly" data={suggestions.weekly} />
                      <SuggestionCard type="Monthly" data={suggestions.monthly} />
                  </div>
              </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Your Personal History</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Private & Encrypted</span>
              </div>
              
              {studentHistory.length === 0 ? (
                  <EmptyState 
                      icon={BookOpen} 
                      title="Your Journal is Empty" 
                      description="Start by logging your first mood check-in to see your history here."
                      action={<button onClick={() => setActiveTab('checkin')} className="text-indigo-600 font-bold text-sm hover:text-indigo-500">Go to Check-in</button>}
                  />
              ) : (
                  <div className="grid gap-4">
                      {studentHistory.slice().reverse().map((entry, i) => (
                          <ModernCard key={i} className="relative overflow-hidden group hover:border-indigo-200 transition-colors">
                              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-teal-500" />
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.day} • {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                      <h4 className="font-bold text-slate-800 text-lg mt-1">{entry.sentiment}</h4>
                                  </div>
                                  <div className="flex gap-2">
                                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200">Stress: {entry.stress}/5</span>
                                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200">Energy: {entry.energy}/5</span>
                                  </div>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed mb-4">"{entry.text}"</p>
                              {entry.insight && (
                                  <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex gap-3 items-start">
                                      <Sparkles size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                                      <p className="text-xs text-slate-600 italic">{entry.insight}</p>
                                  </div>
                              )}
                          </ModernCard>
                      ))}
                  </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

const UniDash = ({ setView, adminStats, generateAiReport, isGeneratingAi, aiReport, weeklyReports }) => (
  <div className="min-h-screen py-10 bg-slate-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">University <span className="text-indigo-600">Dashboard</span></h1>
              <p className="text-sm font-bold text-slate-500 mt-2">Aggregated anonymous reports & campus trends.</p>
          </div>
          <button onClick={() => setView('landing')} className="modern-btn px-4 py-2 rounded-xl font-bold text-sm">Logout</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Reports" value={adminStats.count} detail="All-time logs" />
          <StatCard label="Avg Mood" value={`${adminStats.avgMood}/5`} detail="Campus Average" accent="text-teal-600" />
          <StatCard label="Top Sentiment" value={adminStats.topStressor} detail="Dominant Emotion" accent="text-rose-500" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
              <ModernCard>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><Sparkles size={24} className="text-indigo-500" /> AI Campus Analysis</h3>
                      <button onClick={generateAiReport} disabled={isGeneratingAi} className="modern-btn primary px-6 py-2 rounded-xl text-sm font-bold transition-all">
                          {isGeneratingAi ? 'Analyzing...' : 'Generate Report'}
                      </button>
                  </div>
                  {aiReport ? (
                      <div className="space-y-4">
                          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                              <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Trend</p>
                              <p className="font-bold text-slate-800 text-lg">{aiReport.trend}</p>
                          </div>
                          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                              <p className="text-xs font-black uppercase text-rose-500 tracking-widest">Stressor</p>
                              <p className="font-bold text-rose-800 text-lg">{aiReport.stressor}</p>
                          </div>
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                              <p className="text-xs font-black uppercase text-emerald-600 tracking-widest">Intervention</p>
                              <p className="font-bold text-emerald-800 text-lg">{aiReport.intervention}</p>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl font-bold">
                          Generate an AI report to see campus-wide insights.
                      </div>
                  )}
              </ModernCard>

              <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-xl">Weekly Anonymous Reports</h3>
                  {weeklyReports.length === 0 ? (
                      <p className="text-slate-500 text-sm font-bold">No weekly reports generated yet.</p>
                  ) : (
                      weeklyReports.map(report => (
                          <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
                              <div className="flex justify-between mb-2">
                                  <span className="text-xs font-black bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">ID: {report.student_id_hash}</span>
                                  <span className="text-xs font-bold text-slate-400">{report.week_start}</span>
                              </div>
                              <p className="text-sm font-bold text-slate-600 mb-3 leading-relaxed">{report.trend_summary}</p>
                              <div className="flex gap-2">
                                  <span className={`text-[10px] font-black px-2 py-1 rounded ${report.stress_peak ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                      {report.stress_peak ? 'HIGH STRESS' : 'STABLE'}
                                  </span>
                                  <span className="text-[10px] font-black px-2 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                                      {report.dominant_emotion}
                                  </span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          <div className="space-y-6">
              <ModernCard className="bg-white border-slate-200">
                  <h3 className="font-black mb-4 flex items-center gap-2 text-xl text-slate-800"><Zap size={24} className="text-yellow-500" /> Suggestion Engine</h3>
                  <p className="text-xs text-slate-500 mb-6 font-bold">Automated campus activities based on current aggregate mood.</p>
                  
                  <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Micro-Activity</p>
                          <p className="font-bold text-sm text-slate-700">Campus-wide Quiet Hour</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-1">Macro-Activity</p>
                          <p className="font-bold text-sm text-slate-700">Sunset Yoga on Main Lawn</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Monthly Event</p>
                          <p className="font-bold text-sm text-slate-700">"Unplugged" Music Festival</p>
                      </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Users size={18} /> Faculty Actions</h4>
                      <div className="space-y-3">
                           <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Academic Adjustment</p>
                              <p className="font-bold text-sm text-slate-700">Extend Assignment Deadlines by 24h</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Classroom Tone</p>
                              <p className="font-bold text-sm text-slate-700">Start lectures with 2-min mindfulness</p>
                          </div>
                      </div>
                  </div>
              </ModernCard>
          </div>
      </div>
    </div>
  </div>
);

const AuthScreen = ({ type, setView, handleAuth }) => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isBiometric, setIsBiometric] = useState(false);
  const portalLabel = type === 'admin' ? 'Admin' : 'University';

  const onLogin = () => {
      setError('');
      const success = handleAuth(id, pass, type);
      if (!success) {
          setError('Invalid Credentials. Please try again.');
      }
  };

  const handleBiometric = async () => {
      setIsBiometric(true);
      setError('');

      if (!window.PublicKeyCredential) {
          setIsBiometric(false);
          setError('Biometrics not supported on this device.');
          return;
      }

      try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);

          await navigator.credentials.create({
              publicKey: {
                  challenge,
                  rp: { name: "DrishtiSantulan" },
                  user: {
                      id: new Uint8Array(16),
                      name: type === 'admin' ? "admin" : "university",
                      displayName: type === 'admin' ? "Admin User" : "University Staff"
                  },
                  pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                  authenticatorSelection: {
                      authenticatorAttachment: "platform",
                      userVerification: "required"
                  },
                  timeout: 60000
              }
          });

          const mockId = type === 'admin' ? 'admin123' : 'uni123';
          const mockPass = '123';
          handleAuth(mockId, mockPass, type);

      } catch (e) {
          console.error(e);
          setError('Biometric authentication cancelled or failed.');
      } finally {
          setIsBiometric(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      <div className="absolute top-6 left-6 cursor-pointer text-slate-400 hover:text-slate-800 transition-colors" onClick={() => setView('landing')}><ArrowRight className="rotate-180" size={24} /></div>
      <ModernCard className="w-full max-w-md space-y-6 relative overflow-hidden">
        {error && (
            <div className="absolute top-0 left-0 w-full bg-red-500/90 text-white text-xs font-bold p-2 text-center animate-fade-in backdrop-blur-sm">
                {error}
            </div>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-600">{portalLabel} Portal</p>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">Secure Access</h2>
          <p className="text-sm text-slate-500">Use the credentials shared by the wellbeing office.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">ID</label>
            <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl mt-1 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl mt-1 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-slate-800" />
          </div>
          <button onClick={onLogin} className="modern-btn primary w-full py-3 rounded-xl font-black mt-4">Authenticate</button>
          
          <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-black tracking-widest">Or Login With</span></div>
          </div>

          <button onClick={handleBiometric} className="w-full border border-slate-200 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group">
              {isBiometric ? (
                  <span className="animate-pulse text-indigo-600">Scanning...</span>
              ) : (
                  <>
                    <Fingerprint size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" /> Biometric Access
                  </>
              )}
          </button>
        </div>
      </ModernCard>
    </div>
  );
};

const StudentAuth = ({ setView, setRecoveryKey, handleStudentLogin }) => {
  const [keyInput, setKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);

  const generateKey = () => {
      const newKey = Array.from({length:3}, () => ['Cosmic','Panda','Echo','River','Nebula','Zen'][Math.floor(Math.random()*6)]).join('-');
      setGeneratedKey(newKey);
  };

  const handleLogin = () => {
      if (keyInput.trim().length > 5) {
          setRecoveryKey(keyInput);
          handleStudentLogin(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-50">
      <div className="absolute top-6 left-6 cursor-pointer text-slate-400 hover:scale-110 transition-transform hover:text-slate-800" onClick={() => setView('landing')}><ArrowRight className="rotate-180" size={32} /></div>
      <ModernCard className="w-full max-w-md space-y-8 shadow-xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-indigo-600 border border-indigo-100">
              <Smile size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Student Access</h2>
          <p className="text-sm font-bold text-slate-500 mt-2">Anonymous & Secure. No emails, no names.</p>
        </div>

        <div className="space-y-6">
          <div className="p-1 bg-slate-100 rounded-xl border border-slate-200 flex text-sm font-bold text-slate-500">
              <button className="flex-1 py-2 bg-white shadow-sm text-indigo-600 rounded-lg border border-slate-200">Returning</button>
              <button className="flex-1 py-2 hover:text-slate-700" onClick={() => setGeneratedKey('temp')}>New User</button>
          </div>

          {!generatedKey ? (
              <div className="space-y-4 animate-fade-in">
                  <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Your Secret Key</label>
                      <input 
                          type="text" 
                          placeholder="e.g. Cosmic-Panda-Echo"
                          value={keyInput}
                          onChange={e => setKeyInput(e.target.value)}
                          className="w-full p-4 bg-slate-50 mt-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono text-center font-bold tracking-widest text-lg text-slate-800 placeholder-slate-400" 
                      />
                  </div>
                  <button onClick={handleLogin} className="modern-btn primary w-full py-4 rounded-xl font-black shadow-lg">
                      Unlock Journal
                  </button>
              </div>
          ) : (
              <div className="space-y-6 animate-fade-in text-center">
                  {generatedKey === 'temp' ? (
                      <div className="py-8">
                          <button onClick={generateKey} className="modern-btn primary w-full px-8 py-4 rounded-xl font-black text-lg transition-all">
                              Generate My Identity
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <p className="text-sm font-bold text-slate-500">Save this key! It's the only way to access your data.</p>
                          <div className="p-6 bg-slate-100 text-indigo-600 rounded-xl border border-indigo-100 font-mono text-2xl font-bold tracking-wider shadow-inner">
                              {generatedKey}
                          </div>
                          <button onClick={() => { setRecoveryKey(generatedKey); handleStudentLogin(true); }} className="modern-btn w-full bg-emerald-500 text-white py-4 rounded-xl font-black hover:bg-emerald-600 transition-all mt-4 shadow-lg border-none">
                              I've Saved It, Enter
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </ModernCard>
    </div>
  );
};

const AdminDashboard = ({ setView, stats }) => (
  <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
              <div>
                <p className="text-xs tracking-[0.4em] text-indigo-600 uppercase mb-1 font-black">System Administration</p>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">Admin<span className="text-teal-600">Console</span></h1>
              </div>
              <button onClick={() => setView('landing')} className="modern-btn inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl">
                <Settings size={18} /> Logout
              </button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
              <ModernCard className="relative overflow-hidden group hover:-translate-y-1 transition-transform">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={64} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">System Status</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-sm" />
                    <p className="text-2xl font-black text-slate-800">Operational</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-bold flex items-center gap-1"><CheckCircle size={12}/> All systems normal</p>
              </ModernCard>

              <ModernCard className="relative overflow-hidden group hover:-translate-y-1 transition-transform">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={64} className="text-indigo-500" />
                  </div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Logs</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">{stats?.count || 0}</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold">Synced Student Entries</p>
              </ModernCard>

              <ModernCard className="relative overflow-hidden group hover:-translate-y-1 transition-transform">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CloudLightning size={64} className="text-yellow-500" />
                  </div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Flagged Alerts</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">0</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold">Requires attention</p>
              </ModernCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <ModernCard>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-xl">
                    <Users size={24} className="text-indigo-500" /> User Management
                  </h3>
                  <button className="modern-btn text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors border-none">
                    Export Data
                  </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-100 font-bold">
                            <tr>
                                <th className="px-4 py-3">User Hash</th>
                                <th className="px-4 py-3">Last Active</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600 font-medium">
                            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">8f7a9c...2b</td>
                                <td className="px-4 py-3">Just now</td>
                                <td className="px-4 py-3"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-100">Active</span></td>
                                <td className="px-4 py-3"><button className="text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors uppercase">Reset Key</button></td>
                            </tr>
                            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">2b1d4e...9x</td>
                                <td className="px-4 py-3">1 day ago</td>
                                <td className="px-4 py-3"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">Idle</span></td>
                                <td className="px-4 py-3"><button className="text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors uppercase">Reset Key</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </ModernCard>

            <div className="space-y-6">
              <ModernCard className="bg-white border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-5 -mr-10 -mt-10"></div>
                <h3 className="font-black mb-4 flex items-center gap-2 relative z-10 text-xl text-slate-800"><Lock size={24} className="text-emerald-500" /> Security Log</h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-sm"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">System Backup</p>
                      <p className="text-[10px] text-slate-500 font-mono">Completed at 04:00 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shadow-sm"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Admin Login</p>
                      <p className="text-[10px] text-slate-500">New session started</p>
                    </div>
                  </div>
                </div>
              </ModernCard>

              <ModernCard>
                <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors flex justify-between items-center group border border-slate-200">
                    Flush Cache <RefreshCw size={14} className="text-slate-400 group-hover:rotate-180 transition-transform" />
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors flex justify-between items-center group border border-slate-200">
                    Generate Audit Log <ArrowRight size={14} className="text-slate-400" />
                  </button>
                </div>
              </ModernCard>
            </div>
          </div>
      </div>
  </div>
);

// --- Main Application ---

export default function App() {
  const [view, setView] = useState('landing'); 
  const [recoveryKey, setRecoveryKey] = useState('');
  
  // Student State
  const [studentHistory, setStudentHistory] = useState([]); 
  const [syncStatus, setSyncStatus] = useState('idle'); 

  // Admin/Uni State
  const [adminStats, setAdminStats] = useState({ avgMood: 0, count: 0, topStressor: 'None' });
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [aiReport, setAiReport] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- Handlers ---

  const handleStudentLogin = () => {
    setView('student-dash');
  };

  const handleLogSubmit = async (formData) => {
    // AI Analysis
    const analysis = await GeminiService.analyzeMood(formData);
    
    const newEntry = {
        ...formData,
        sentiment: analysis.sentiment,
        insight: analysis.insight,
        timestamp: new Date().toISOString(),
        day: new Date().toLocaleDateString('en-US', { weekday: 'short' })
    };

    setStudentHistory([...studentHistory, newEntry]);
  };

  const handleSyncToUni = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
        MockBackend.syncData(studentHistory);
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
    }, 1500);
  };

  const handleAuth = (id, pass, type) => {
    const auth = MockBackend.authenticate(id, pass);
    if (auth.success) {
        setAdminStats(MockBackend.getAggregatedStats());
        setWeeklyReports(MockBackend.getWeeklyReports());
        setView(type === 'admin' ? 'admin-dash' : 'uni-dash');
        return true;
    } else {
        return false;
    }
  };

  const generateAiReport = async () => {
    setIsGeneratingAi(true);
    const data = MockBackend.getCampusData();
    const analysis = await GeminiService.generateWeeklyReport(data);
    setAiReport(analysis);
    setIsGeneratingAi(false);
  };

  switch (view) {
    case 'student-auth': 
      return <StudentAuth setView={setView} setRecoveryKey={setRecoveryKey} handleStudentLogin={handleStudentLogin} />;
    case 'student-dash': 
      return <StudentDashboard 
        recoveryKey={recoveryKey} 
        setView={setView} 
        studentHistory={studentHistory} 
        onLogSubmit={handleLogSubmit}
        syncStatus={syncStatus}
        onSync={handleSyncToUni}
      />;
    case 'uni-auth': 
      return <AuthScreen type="university" setView={setView} handleAuth={handleAuth} />;
    case 'uni-dash': 
      return <UniDash 
        setView={setView} 
        adminStats={adminStats} 
        generateAiReport={generateAiReport} 
        isGeneratingAi={isGeneratingAi} 
        aiReport={aiReport} 
        weeklyReports={weeklyReports} 
      />;
    case 'admin-auth': 
      return <AuthScreen type="admin" setView={setView} handleAuth={handleAuth} />;
    case 'admin-dash': 
      return <AdminDashboard setView={setView} stats={adminStats} />;
    default: 
      return <LandingPage setView={setView} />;
  }
}
