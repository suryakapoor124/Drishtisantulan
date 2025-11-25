import React, { useMemo, useState } from 'react';
import { 
  Heart, Activity, Users, BarChart2, Settings, Sun, Moon, Wind, 
  Smile, Meh, BookOpen, ArrowRight, CheckCircle,
  Lock, RefreshCw, Zap, CloudRain, Send, CloudLightning, Sparkles,
  Calendar, Coffee, Music, MapPin, Feather
} from 'lucide-react';

// --- Configuration & Constants ---

const COLORS = {
  blue: '#6DAEDB',
  green: '#AEE1C9',
  lavender: '#C5B4E3',
  offWhite: '#F9FAFB',
  charcoal: '#1F1F1F',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
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

const apiKey = "AIzaSyCNmcKiq8dxQty1ZNf3RKfEFEYdmaT9OQA"; // API Key injected by environment

// --- Mock Backend Simulation (SQLite Replacement) ---

const MockBackend = {
  authenticate: (id, pass) => {
    if (id === 'admin123' && pass === '123') return { success: true, role: 'admin' };
    if (id === 'uni123' && pass === '123') return { success: true, role: 'university' };
    return { success: false };
  },

  syncData: (studentLogs) => {
    const existingData = JSON.parse(localStorage.getItem('campus_pulse_data') || '[]');
    const updatedData = [...existingData, ...studentLogs];
    localStorage.setItem('campus_pulse_data', JSON.stringify(updatedData));
    
    // Generate Weekly Report Simulation
    const reports = JSON.parse(localStorage.getItem('weekly_reports') || '[]');
    // In a real app, this would run on a cron job. Here we simulate it on sync.
    if (studentLogs.length > 0) {
        const lastLog = studentLogs[studentLogs.length - 1];
        const newReport = {
            id: Date.now(),
            week_start: new Date().toLocaleDateString(),
            student_id_hash: Math.random().toString(36).substring(7), // Anonymous ID
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
    if (data.length === 0) return { avgMood: 0, count: 0, topStressor: 'None' };

    const totalMood = data.reduce((acc, curr) => acc + curr.mood, 0);
    const avgMood = (totalMood / data.length).toFixed(1);
    
    // Find top sentiment
    const sentiments = data.map(d => d.sentiment).filter(Boolean);
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

    return { avgMood, count: data.length, topStressor };
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
    // ... existing logic adapted for new data structure ...
    // For brevity, reusing the previous logic but updated for the new fields
    const fallback = { trend: "Data insufficient", stressor: "None", intervention: "Wait for more data" };
    if (!campusData.length) return fallback;

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
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) { return fallback; }
  }
};

// --- Shared UI Helpers ---

const StatCard = ({ label, value, detail, accent = 'text-slate-400' }) => (
  <GlassCard className="space-y-2">
    <p className={`text-[11px] font-bold uppercase tracking-widest ${accent}`}>{label}</p>
    <p className="text-3xl font-black text-slate-800">{value}</p>
    {detail && <p className="text-xs text-slate-500">{detail}</p>}
  </GlassCard>
);

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <GlassCard className="text-center py-10 space-y-4">
    <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-lg font-bold text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
    {action}
  </GlassCard>
);

const SuggestionCard = ({ type, data }) => {
    const Icon = data.icon;
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${type === 'Daily' ? 'bg-blue-50 text-blue-500' : type === 'Weekly' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{type} Activity</p>
                <h4 className="font-bold text-slate-700">{data.title}</h4>
                <p className="text-xs text-slate-500">{data.desc}</p>
            </div>
        </div>
    );
};

// --- Components ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

const MoodInput = ({ label, value, onChange, min = 1, max = 5, lowLabel, highLabel }) => (
    <div className="space-y-3">
        <div className="flex justify-between text-sm font-bold text-slate-600">
            <span>{label}</span>
            <span className="text-[#6DAEDB]">{value}/{max}</span>
        </div>
        <input 
            type="range" min={min} max={max} value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6DAEDB]"
        />
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
        </div>
    </div>
);

const TrendChart = ({ data }) => {
  const max = 5;
  const height = 100;

  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-300 text-xs">
        No entries to visualize yet
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
        <polyline
          fill="none"
          stroke={COLORS.blue}
          strokeWidth="3"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = i * stepX;
          const y = height - (d.mood / max) * height;
          return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={COLORS.blue} strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

// --- Main Application ---

// --- Sub-Components (Defined Outside App) ---

const LandingPage = ({ setView }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in relative overflow-hidden bg-[#F9FAFB]">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-32 -right-10 w-80 h-80 bg-[#C5B4E3]/50 blur-[140px]" />
      <div className="absolute -bottom-32 -left-10 w-80 h-80 bg-[#6DAEDB]/40 blur-[140px]" />
    </div>
    <div className="relative z-10">
      <div className="w-24 h-24 bg-gradient-to-tr from-[#6DAEDB] to-[#C5B4E3] rounded-3xl rotate-12 flex items-center justify-center mb-6 shadow-xl mx-auto">
        <Wind size={36} className="text-slate-700" />
      </div>
      <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-2">Drishti<span className="text-[#6DAEDB]">Santulan</span></h1>
      <p className="text-slate-500 font-medium tracking-widest text-xs uppercase mb-6">Vision • Balance • Insight</p>
      <div className="grid gap-4 w-full max-w-sm mt-10 mx-auto">
        <button onClick={() => setView('student-auth')} className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg font-bold text-lg">
          <Smile size={24} /> Student Login
        </button>
        <div className="flex gap-3">
          <button onClick={() => setView('uni-auth')} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 p-3 rounded-xl flex items-center justify-center gap-2 border border-slate-200 font-medium text-sm">
            <Users size={16} /> University
          </button>
          <button onClick={() => setView('admin-auth')} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 p-3 rounded-xl flex items-center justify-center gap-2 border border-slate-200 font-medium text-sm">
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
  const [checkinStep, setCheckinStep] = useState(0); // 0: Intro, 1-8: Questions, 9: Text, 10: Summary
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

  const handleNext = () => {
    if (checkinStep < questions.length + 1) {
      setCheckinStep(checkinStep + 1);
    }
  };

  const handleBack = () => {
    if (checkinStep > 0) {
      setCheckinStep(checkinStep - 1);
    }
  };

  const handleSubmit = async () => {
      setIsSubmitting(true);
      // Simulate AI processing time for better UX
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
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFB] via-white to-slate-100 pb-24 relative">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-[#6DAEDB] border-r-[#C5B4E3] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-gradient-to-tr from-[#6DAEDB]/20 to-[#C5B4E3]/20 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Analyzing Reflection</h3>
            <p className="text-slate-500 font-medium animate-pulse">Generating personalized insights...</p>
        </div>
      )}

      {recoveryKey && (
        <div className="bg-slate-900 text-white p-3 text-center shadow-lg flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="uppercase tracking-[0.3em] text-[11px] text-white/70">Recovery Key</span>
          <span className="font-mono font-bold text-[#6DAEDB] text-base">{recoveryKey}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex flex-col gap-3 items-start sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.4em] text-slate-400 uppercase mb-1">Student Console</p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800">Drishti<span className="text-[#6DAEDB]">Santulan</span></h1>
          </div>
          <button onClick={() => setView('landing')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <Settings size={18} /> Exit
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['checkin', 'stats', 'journal'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`capitalize px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'checkin' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] animate-fade-in">
              <GlassCard className="space-y-6 min-h-[400px] flex flex-col justify-center relative overflow-hidden">
                  {checkinStep === 0 && (
                    <div className="text-center space-y-6 animate-slide-in-right">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#6DAEDB]">
                        <Feather size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">Ready to Reflect?</h3>
                        <p className="text-slate-500 mt-2">Take a moment to check in with yourself. It only takes a minute.</p>
                      </div>
                      <button onClick={handleNext} className="bg-[#6DAEDB] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#5a9bc5] transition-all">
                        Start Check-in
                      </button>
                    </div>
                  )}

                  {checkinStep > 0 && checkinStep <= questions.length && (
                    <div className="space-y-8 animate-slide-in-right" key={checkinStep}>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                        <span>Question {checkinStep} of {questions.length}</span>
                        <span className="text-[#6DAEDB]">{Math.round((checkinStep / questions.length) * 100)}%</span>
                      </div>
                      
                      <div className="text-center space-y-6">
                        {(() => {
                          const q = questions[checkinStep - 1];
                          const Icon = q.icon;
                          return (
                            <>
                              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-700 shadow-sm">
                                <Icon size={32} />
                              </div>
                              <h3 className="text-2xl font-bold text-slate-800">{q.label}</h3>
                              <div className="max-w-md mx-auto pt-4">
                                <MoodInput 
                                  label="" 
                                  value={form[q.key]} 
                                  onChange={v => setForm({...form, [q.key]: v})} 
                                  lowLabel={q.low} 
                                  highLabel={q.high} 
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex justify-between pt-8">
                        <button onClick={handleBack} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
                        <button onClick={handleNext} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-black">Next</button>
                      </div>
                    </div>
                  )}

                  {checkinStep === questions.length + 1 && (
                    <div className="space-y-6 animate-slide-in-right">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-800">Final Thoughts</h3>
                        <p className="text-slate-500 text-sm mt-1">Anything else on your mind?</p>
                      </div>
                      <textarea 
                          className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6DAEDB] min-h-[150px]"
                          placeholder="Write your thoughts here..."
                          value={form.text}
                          onChange={e => setForm({...form, text: e.target.value})}
                      />
                      <div className="flex justify-between items-center">
                        <button onClick={handleBack} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
                        <button onClick={handleSubmit} className="bg-[#6DAEDB] text-white px-8 py-3 rounded-xl font-black shadow-xl hover:bg-[#5a9bc5] flex items-center gap-2">
                            Log Reflection <Send size={18} />
                        </button>
                      </div>
                    </div>
                  )}
              </GlassCard>

              <div className="space-y-6">
                  <GlassCard className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-white/10 rounded-xl"><CloudLightning size={20} /></div>
                          <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Sync Status</p>
                              <p className="font-bold">{syncStatus === 'idle' ? 'Ready to Sync' : syncStatus === 'synced' ? 'Up to Date' : 'Syncing...'}</p>
                          </div>
                      </div>
                      <p className="text-xs opacity-60 mb-4">Anonymously contribute to campus wellbeing stats.</p>
                      <button onClick={onSync} disabled={syncStatus !== 'idle'} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold text-sm transition">
                          {syncStatus === 'synced' ? 'Synced' : 'Sync Now'}
                      </button>
                  </GlassCard>
                  
                  {lastEntry && (
                      <GlassCard>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">AI Insight</p>
                          <p className="text-sm font-medium text-slate-700 italic">"{lastEntry.insight}"</p>
                      </GlassCard>
                  )}
              </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-3">
                  <StatCard label="Current Mood" value={lastEntry?.mood || '-'} detail="Last check-in" />
                  <StatCard label="Dominant Emotion" value={dominantSentiment} detail="Based on AI analysis" />
                  <StatCard label="Stress Level" value={lastEntry?.stress || '-'} detail="Self-reported" />
              </div>
              
              <GlassCard>
                  <h3 className="font-bold text-slate-700 mb-6">7-Day Emotional Trend</h3>
                  <TrendChart data={studentHistory} />
              </GlassCard>

              <div className="space-y-4">
                  <h3 className="font-bold text-slate-700">Suggested for You</h3>
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
                  <h3 className="font-bold text-slate-700">Your Personal History</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Private & Encrypted</span>
              </div>
              
              {studentHistory.length === 0 ? (
                  <EmptyState 
                      icon={BookOpen} 
                      title="Your Journal is Empty" 
                      description="Start by logging your first mood check-in to see your history here."
                      action={<button onClick={() => setActiveTab('checkin')} className="text-[#6DAEDB] font-bold text-sm">Go to Check-in</button>}
                  />
              ) : (
                  <div className="grid gap-4">
                      {studentHistory.slice().reverse().map((entry, i) => (
                          <GlassCard key={i} className="relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-[#6DAEDB]" />
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.day} • {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                      <h4 className="font-bold text-slate-700 text-lg mt-1">{entry.sentiment}</h4>
                                  </div>
                                  <div className="flex gap-2">
                                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">Stress: {entry.stress}/5</span>
                                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">Energy: {entry.energy}/5</span>
                                  </div>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed mb-4">"{entry.text}"</p>
                              {entry.insight && (
                                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex gap-3 items-start">
                                      <Sparkles size={16} className="text-[#6DAEDB] mt-0.5 shrink-0" />
                                      <p className="text-xs text-slate-600 italic">{entry.insight}</p>
                                  </div>
                              )}
                          </GlassCard>
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
  <div className="min-h-screen bg-gradient-to-b from-[#F9FAFB] via-white to-slate-50 py-10">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-3xl font-black text-slate-800">University Dashboard</h1>
              <p className="text-sm text-slate-500">Aggregated anonymous reports & campus trends.</p>
          </div>
          <button onClick={() => setView('landing')} className="text-slate-500 font-bold text-sm">Logout</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Reports" value={adminStats.count} detail="All-time logs" />
          <StatCard label="Avg Mood" value={`${adminStats.avgMood}/5`} detail="Campus Average" />
          <StatCard label="Top Sentiment" value={adminStats.topStressor} detail="Dominant Emotion" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
              <GlassCard>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={18} className="text-[#6DAEDB]" /> AI Campus Analysis</h3>
                      <button onClick={generateAiReport} disabled={isGeneratingAi} className="bg-[#6DAEDB] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
                          {isGeneratingAi ? 'Analyzing...' : 'Generate Report'}
                      </button>
                  </div>
                  {aiReport ? (
                      <div className="space-y-4">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-xs font-bold uppercase text-slate-400">Trend</p>
                              <p className="font-bold text-slate-800">{aiReport.trend}</p>
                          </div>
                          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                              <p className="text-xs font-bold uppercase text-red-400">Stressor</p>
                              <p className="font-bold text-red-800">{aiReport.stressor}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                              <p className="text-xs font-bold uppercase text-green-400">Intervention</p>
                              <p className="font-bold text-green-800">{aiReport.intervention}</p>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                          Generate an AI report to see campus-wide insights.
                      </div>
                  )}
              </GlassCard>

              <div className="space-y-4">
                  <h3 className="font-bold text-slate-800">Weekly Anonymous Reports</h3>
                  {weeklyReports.length === 0 ? (
                      <p className="text-slate-400 text-sm">No weekly reports generated yet.</p>
                  ) : (
                      weeklyReports.map(report => (
                          <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <div className="flex justify-between mb-2">
                                  <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">ID: {report.student_id_hash}</span>
                                  <span className="text-xs text-slate-400">{report.week_start}</span>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{report.trend_summary}</p>
                              <div className="flex gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${report.stress_peak ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                      {report.stress_peak ? 'High Stress' : 'Stable'}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600">
                                      {report.dominant_emotion}
                                  </span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          <div className="space-y-6">
              <GlassCard className="bg-slate-900 text-white border-none">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} /> Suggestion Engine</h3>
                  <p className="text-xs opacity-60 mb-6">Automated campus activities based on current aggregate mood.</p>
                  
                  <div className="space-y-4">
                      <div className="p-3 bg-white/10 rounded-xl">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Micro-Activity</p>
                          <p className="font-bold text-sm">Campus-wide Quiet Hour</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-xl">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Macro-Activity</p>
                          <p className="font-bold text-sm">Sunset Yoga on Main Lawn</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-xl">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Monthly Event</p>
                          <p className="font-bold text-sm">"Unplugged" Music Festival</p>
                      </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2"><Users size={16} /> Faculty Actions</h4>
                      <div className="space-y-3">
                           <div className="p-3 bg-white/10 rounded-xl border border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Academic Adjustment</p>
                              <p className="font-bold text-sm">Extend Assignment Deadlines by 24h</p>
                          </div>
                          <div className="p-3 bg-white/10 rounded-xl border border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Classroom Tone</p>
                              <p className="font-bold text-sm">Start lectures with 2-min mindfulness</p>
                          </div>
                      </div>
                  </div>
              </GlassCard>
          </div>
      </div>
    </div>
  </div>
);

const AuthScreen = ({ type, setView, handleAuth }) => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const portalLabel = type === 'admin' ? 'Admin' : 'University';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 p-4 relative">
      <div className="absolute top-6 left-6 cursor-pointer text-slate-400" onClick={() => setView('landing')}><ArrowRight className="rotate-180" size={24} /></div>
      <GlassCard className="w-full max-w-md space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-400">{portalLabel} Portal</p>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">Secure Access</h2>
          <p className="text-sm text-slate-500">Use the credentials shared by the wellbeing office.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">ID</label>
            <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl mt-1 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6DAEDB]" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl mt-1 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6DAEDB]" />
          </div>
          <button onClick={() => handleAuth(id, pass, type)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-2 hover:bg-black">Authenticate</button>
        </div>
      </GlassCard>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 p-4 relative">
      <div className="absolute top-6 left-6 cursor-pointer text-slate-400" onClick={() => setView('landing')}><ArrowRight className="rotate-180" size={24} /></div>
      <GlassCard className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
              <Smile size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Student Access</h2>
          <p className="text-sm text-slate-500 mt-2">Anonymous & Secure. No emails, no names.</p>
        </div>

        <div className="space-y-6">
          <div className="p-1 bg-slate-100 rounded-xl flex text-sm font-bold text-slate-500">
              <button className="flex-1 py-2 bg-white shadow-sm rounded-lg text-slate-800">Returning</button>
              <button className="flex-1 py-2 hover:text-slate-700" onClick={() => setGeneratedKey('temp')}>New User</button>
          </div>

          {!generatedKey ? (
              <div className="space-y-4 animate-fade-in">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Your Secret Key</label>
                      <input 
                          type="text" 
                          placeholder="e.g. Cosmic-Panda-Echo"
                          value={keyInput}
                          onChange={e => setKeyInput(e.target.value)}
                          className="w-full p-4 bg-slate-50 rounded-xl mt-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6DAEDB] font-mono text-center tracking-widest" 
                      />
                  </div>
                  <button onClick={handleLogin} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg">
                      Unlock Journal
                  </button>
              </div>
          ) : (
              <div className="space-y-6 animate-fade-in text-center">
                  {generatedKey === 'temp' ? (
                      <div className="py-8">
                          <button onClick={generateKey} className="bg-[#6DAEDB] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#5a9bc5]">
                              Generate My Identity
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <p className="text-sm text-slate-500">Save this key! It's the only way to access your data.</p>
                          <div className="p-4 bg-slate-900 text-[#6DAEDB] rounded-xl font-mono text-xl font-bold tracking-wider border-2 border-[#6DAEDB]/20">
                              {generatedKey}
                          </div>
                          <button onClick={() => { setRecoveryKey(generatedKey); handleStudentLogin(true); }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg">
                              I've Saved It, Enter
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

const AdminDashboard = ({ setView }) => (
  <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
              <h1 className="text-2xl font-black text-slate-800">Admin Console</h1>
              <button onClick={() => setView('landing')} className="text-sm font-bold text-slate-500">Logout</button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
              <GlassCard className="border-l-4 border-green-400">
                  <p className="text-xs font-bold uppercase text-slate-400">System Status</p>
                  <p className="text-xl font-bold text-slate-700 mt-1">Operational</p>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={12}/> All systems normal</p>
              </GlassCard>
              <GlassCard className="border-l-4 border-blue-400">
                  <p className="text-xs font-bold uppercase text-slate-400">Total Users</p>
                  <p className="text-xl font-bold text-slate-700 mt-1">1,248</p>
                  <p className="text-xs text-slate-400 mt-2">Active this month</p>
              </GlassCard>
              <GlassCard className="border-l-4 border-red-400">
                  <p className="text-xs font-bold uppercase text-slate-400">Flagged Alerts</p>
                  <p className="text-xl font-bold text-slate-700 mt-1">3</p>
                  <p className="text-xs text-red-500 mt-2">Requires attention</p>
              </GlassCard>
          </div>

          <GlassCard>
              <h3 className="font-bold text-slate-800 mb-4">User Management</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                          <tr>
                              <th className="px-4 py-3 rounded-l-lg">User Hash</th>
                              <th className="px-4 py-3">Last Active</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 rounded-r-lg">Action</th>
                          </tr>
                      </thead>
                      <tbody className="text-slate-600">
                          <tr className="border-b border-slate-50">
                              <td className="px-4 py-3 font-mono">8f7a9c...</td>
                              <td className="px-4 py-3">2 mins ago</td>
                              <td className="px-4 py-3"><span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-bold">Active</span></td>
                              <td className="px-4 py-3"><button className="text-slate-400 hover:text-slate-800">Reset</button></td>
                          </tr>
                          <tr className="border-b border-slate-50">
                              <td className="px-4 py-3 font-mono">2b1d4e...</td>
                              <td className="px-4 py-3">1 day ago</td>
                              <td className="px-4 py-3"><span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold">Flagged</span></td>
                              <td className="px-4 py-3"><button className="text-red-500 font-bold">Review</button></td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </GlassCard>
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
    } else {
        alert("Invalid Credentials. Try admin123/123 or uni123/123");
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
      return <AdminDashboard setView={setView} />;
    default: 
      return <LandingPage setView={setView} />;
  }
}
