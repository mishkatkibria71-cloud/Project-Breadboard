import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Clock, 
  Calendar, 
  BookOpen, 
  Cpu, 
  ExternalLink, 
  Plus, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  FileText,
  Layout,
  Calculator,
  Moon,
  Sun,
  Quote,
  TrendingUp,
  Award,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Target,
  Loader2,
  FolderOpen,
  CalendarDays,
  Bookmark,
  Pin,
  ChevronLeft,
  Music,
  StickyNote,
  PlusCircle,
  XCircle
} from 'lucide-react';

// --- Gemini API Configuration ---
const apiKey = ""; 

const callGemini = async (prompt, systemInstruction = "You are an expert Electrical Engineering tutor.") => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };
  const fetchWithBackoff = async (retries = 0) => {
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (err) {
      if (retries < 5) {
        await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
        return fetchWithBackoff(retries + 1);
      }
      throw err;
    }
  };
  try {
    const result = await fetchWithBackoff();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) { return "AI Engine offline."; }
};

const GRADING_SCALE = [
  { label: 'A', value: 4.0 }, { label: 'A-', value: 3.7 },
  { label: 'B+', value: 3.3 }, { label: 'B', value: 3.0 }, { label: 'B-', value: 2.7 },
  { label: 'C+', value: 2.3 }, { label: 'C', value: 2.0 }, { label: 'C-', value: 1.7 },
  { label: 'D+', value: 1.3 }, { label: 'D', value: 1.0 }, { label: 'F', value: 0.0 }
];

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState(null);

  // --- Initial Data ---
  const initialRoutine = [
    { day: "Sunday", classes: [{ id: 's1', name: "EEE305L - Digital Lab", time: "08:00 AM - 10:50 AM", room: "AHFA-12H-37L" }] },
    { day: "Monday", classes: [
        { id: 'm1', name: "EEE359 - EM Waves", time: "11:00 AM - 12:20 PM", room: "08A-02C" },
        { id: 'm2', name: "EEE305 - Digital Systems", time: "12:30 PM - 01:50 PM", room: "08A-04C" },
        { id: 'm3', name: "EEE308L - Micro Lab", time: "02:00 PM - 04:50 PM", room: "ANB-11H-46L" }
    ] },
    { day: "Tuesday", classes: [] }, 
    { day: "Wednesday", classes: [
        { id: 'w1', name: "EEE305L - Digital Lab", time: "08:00 AM - 10:50 AM", room: "AHFA-12H-37L" },
        { id: 'w2', name: "EEE359 - EM Waves", time: "11:00 AM - 12:20 PM", room: "08A-02C" },
        { id: 'w3', name: "EEE305 - Digital Systems", time: "12:30 PM - 01:50 PM", room: "08A-04C" }
    ] }, 
    { day: "Thursday", classes: [
        { id: 'th1', name: "EEE308 - Microprocessors", time: "08:00 AM - 09:20 AM", room: "10B-12C" },
        { id: 'th2', name: "EEE309 - Control Systems", time: "11:00 AM - 12:20 PM", room: "10B-12C" }
    ] }, 
    { day: "Friday", classes: [] }, 
    { day: "Saturday", classes: [
        { id: 'sat1', name: "EEE308 - Microprocessors", time: "08:00 AM - 09:20 AM", room: "10B-12C" },
        { id: 'sat2', name: "EEE309 - Control Systems", time: "11:00 AM - 12:20 PM", room: "10B-12C" }
    ] }
  ];

  const initialExams = [
    { id: 'x1', date: "2026-04-04", day: "Saturday", time: "11:00 AM - 01:00 PM", type: "MID", course: "EEE359" },
    { id: 'x2', date: "2026-04-05", day: "Sunday", time: "11:00 AM - 01:00 PM", type: "MID", course: "EEE305" },
    { id: 'x3', date: "2026-04-06", day: "Monday", time: "08:30 AM - 10:30 AM", type: "MID", course: "EEE308" },
    { id: 'x4', date: "2026-04-06", day: "Monday", time: "11:00 AM - 01:00 PM", type: "MID", course: "EEE309" },
    { id: 'x5', date: "2026-05-17", day: "Sunday", time: "11:00 AM - 01:00 PM", type: "FINAL", course: "EEE359" },
    { id: 'x6', date: "2026-05-18", day: "Monday", time: "11:00 AM - 01:00 PM", type: "FINAL", course: "EEE305" },
    { id: 'x7', date: "2026-05-19", day: "Tuesday", time: "08:30 AM - 10:30 AM", type: "FINAL", course: "EEE308" },
    { id: 'x8', date: "2026-05-19", day: "Tuesday", time: "11:00 AM - 01:00 PM", type: "FINAL", course: "EEE309" }
  ];

  // --- Persistent States ---
  const [semesters, setSemesters] = useState(() => JSON.parse(localStorage.getItem('mishi_semesters')) || [
    { id: 'sem-1', name: 'Spring 2026', courses: [{ id: 'c1', name: 'EEE359', credits: 3, grade: 4.0 }] }
  ]);
  const [routine, setRoutine] = useState(() => JSON.parse(localStorage.getItem('mishi_routine')) || initialRoutine);
  const [exams, setExams] = useState(() => JSON.parse(localStorage.getItem('mishi_exams')) || initialExams);
  const [bookmarks, setBookmarks] = useState(() => JSON.parse(localStorage.getItem('mishi_bookmarks')) || {});
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('mishi_notes')) || []);
  const [targetCG, setTargetCG] = useState(() => parseFloat(localStorage.getItem('mishi_target')) || 3.50);

  // --- Logic Persistence ---
  useEffect(() => {
    localStorage.setItem('mishi_semesters', JSON.stringify(semesters));
    localStorage.setItem('mishi_routine', JSON.stringify(routine));
    localStorage.setItem('mishi_exams', JSON.stringify(exams));
    localStorage.setItem('mishi_bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('mishi_notes', JSON.stringify(notes));
    localStorage.setItem('mishi_target', targetCG.toString());
  }, [semesters, routine, exams, bookmarks, notes, targetCG]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Stats Computation ---
  const stats = useMemo(() => {
    let totalCredits = 0, totalQualityPoints = 0;
    semesters.forEach(s => s.courses.forEach(c => {
      totalCredits += c.credits;
      totalQualityPoints += (c.credits * c.grade);
    }));
    const gpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : "0.00";
    return { gpa: parseFloat(gpa), totalCredits, totalQualityPoints: totalQualityPoints.toFixed(2) };
  }, [semesters]);

  // --- Notes Handler ---
  const [noteInput, setNoteInput] = useState("");
  const addNote = () => {
    if (!noteInput.trim()) return;
    setNotes([...notes, { id: Date.now(), text: noteInput, date: new Date().toLocaleDateString() }]);
    setNoteInput("");
  };
  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));

  // --- Calendar Logic ---
  const [currentYearView, setCurrentYearView] = useState(2026);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventInput, setEventInput] = useState("");

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setEventInput(bookmarks[dateStr] || "");
  };

  const saveBookmark = () => {
    if (!selectedDate) return;
    const newBookmarks = { ...bookmarks };
    if (eventInput.trim() === "") {
      delete newBookmarks[selectedDate];
    } else {
      newBookmarks[selectedDate] = eventInput;
    }
    setBookmarks(newBookmarks);
    setSelectedDate(null);
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  // --- Theme Configuration ---
  const theme = isDarkMode 
    ? { 
        bg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950', 
        card: 'bg-slate-900/40 border-slate-700/50 backdrop-blur-xl', 
        header: 'text-white', 
        sub: 'text-blue-400', 
        navActive: 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]',
        accent: 'text-blue-400'
      }
    : { 
        bg: 'bg-slate-50', 
        card: 'bg-white border-slate-200 shadow-sm', 
        header: 'text-slate-900', 
        sub: 'text-slate-500', 
        navActive: 'bg-blue-500 text-white',
        accent: 'text-blue-600'
      };

  const Card = ({ children, className = "" }) => (
    <div className={`${theme.card} border rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/30 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} font-sans transition-colors duration-500 pb-20 selection:bg-blue-500 selection:text-white`}>
      {/* Background Electric Glow Decor */}
      {isDarkMode && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '1s'}} />
        </div>
      )}

      {/* Bookmark Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <Card className="max-w-sm w-full border-amber-500/50">
            <h3 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2"><Pin size={20}/> Bookmark Day: {selectedDate}</h3>
            <textarea 
              value={eventInput}
              onChange={(e) => setEventInput(e.target.value)}
              placeholder="Enter reason or reminder..."
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 text-white"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={saveBookmark} className="flex-grow py-2 bg-amber-600 text-black font-bold rounded-lg hover:bg-amber-500">Save Node</button>
              <button onClick={() => setSelectedDate(null)} className="px-4 py-2 border border-slate-700 rounded-lg text-white">Cancel</button>
            </div>
          </Card>
        </div>
      )}

      {/* AI Loader */}
      {isAiLoading && <div className="fixed top-6 right-6 z-[100] bg-blue-600 text-white px-5 py-2 rounded-full flex items-center gap-3 shadow-2xl animate-bounce"><Loader2 size={18} className="animate-spin" /> <span className="text-xs font-bold uppercase tracking-widest text-white">Logic Stream Active...</span></div>}

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Zap className="text-blue-500" fill="currentColor" size={32} />
              <h1 className={`text-4xl font-black ${theme.header} tracking-tighter`}>BREADBOARD</h1>
            </div>
            <p className={`${theme.sub} text-[10px] font-black uppercase tracking-[0.5em] opacity-80`}>BY SER MISHI OF HOUSE OPEN CIRCUIT // V7.1 ELECTRIC FLUX</p>
          </div>
          <div className="flex items-center gap-4 self-end md:self-auto">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800/80 text-amber-400 hover:bg-slate-700' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="text-right">
              <div className={`text-2xl font-mono font-bold ${theme.header}`}>{currentTime.toLocaleTimeString([], { hour12: false })}</div>
              <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Active Phase</div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className={`flex flex-wrap gap-2 mb-10 p-2 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-200/50 border-slate-200'} w-fit backdrop-blur-md`}>
          {['overview', 'routine', 'exams', 'calendar', 'notes', 'music', 'calculator'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === t ? theme.navActive : 'text-slate-500 hover:text-blue-400'}`}>
              {t}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-l-4 border-l-blue-500 bg-blue-500/5">
                  <Quote className="text-blue-500 mb-2" size={28} />
                  <p className={`text-xl italic font-semibold ${theme.header} leading-relaxed`}>"Energy is neither created nor destroyed; it is only transformed by focus."</p>
                  <p className="text-xs mt-3 font-mono text-blue-400/60 uppercase tracking-widest">— House Open Circuit Manual</p>
                </Card>

                <div className="flex items-center justify-between mt-10">
                  <h2 className={`text-2xl font-black ${theme.header} flex items-center gap-3`}><Clock className="text-blue-500" /> Live Stream</h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Incoming Events</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.filter(ex => new Date(ex.date) >= new Date()).slice(0, 4).map(ex => (
                    <Card key={ex.id} className="border-l-4 border-l-amber-500 flex justify-between items-center group">
                      <div>
                        <p className="font-black text-white text-lg">{ex.course}</p>
                        <p className="text-xs text-blue-400/70 font-mono uppercase mt-1">{ex.type} • {ex.date}</p>
                      </div>
                      <div className="text-amber-500/30 group-hover:text-amber-500 transition-colors"><AlertCircle size={24} /></div>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Card className="border-t-4 border-t-blue-500 bg-blue-500/5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">System CGPA</h3>
                    <Award size={20} className="text-blue-500" />
                  </div>
                  <div className="text-6xl font-black mb-4 text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{stats.gpa}</div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${(stats.gpa/4)*100}%` }} />
                  </div>
                </Card>
                <Card className="bg-slate-900/80">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><StickyNote size={14}/> Recent Nodes</h3>
                  <div className="space-y-3">
                    {notes.slice(-3).map(n => (
                      <div key={n.id} className="text-sm border-l-2 border-slate-700 pl-3 py-1">
                        <p className="text-slate-300 font-medium truncate">{n.text}</p>
                        <p className="text-[10px] text-slate-600 font-mono">{n.date}</p>
                      </div>
                    ))}
                    {notes.length === 0 && <p className="text-xs italic text-slate-600 text-white">No active nodes in the buffer.</p>}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'routine' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-3xl font-black ${theme.header} flex items-center gap-3`}><Calendar className="text-blue-500" /> Modular Schedule</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routine.map((day, dIdx) => (
                  <Card key={dIdx} className="border-t-2 border-t-blue-500/20 hover:border-t-blue-500">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4 pb-2 border-b border-slate-800">{day.day}</h3>
                    <div className="space-y-4">
                      {day.classes.length === 0 && <p className="text-xs italic text-slate-500 py-4">No scheduled nodes.</p>}
                      {day.classes.map(cls => (
                        <div key={cls.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                          <p className="font-black text-slate-200 text-sm">{cls.name}</p>
                          <p className="text-[10px] font-mono text-blue-400 mt-1">{cls.time}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-600 mt-1">{cls.room}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'exams' && (
             <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className={`text-3xl font-black ${theme.header} flex items-center gap-3`}><AlertCircle className="text-amber-500" /> Exam Schedule</h2>
                <button onClick={() => setExams([...exams, { id: Date.now().toString(), date: "2026-06-01", day: "Day", time: "00:00", type: "LAB", course: "Course" }])} className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold uppercase hover:bg-amber-500 hover:text-black transition-all">Add Exam Node</button>
              </div>
              <Card className="p-0 overflow-hidden bg-slate-900/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="p-4">Date/Day</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Course</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-800">
                            {exams.sort((a,b) => new Date(a.date) - new Date(b.date)).map(ex => (
                                <tr key={ex.id} className="hover:bg-blue-500/5">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{ex.date}</div>
                                        <div className="text-[10px] text-slate-500">{ex.day}</div>
                                    </td>
                                    <td className="p-4 text-blue-400 font-mono text-xs">{ex.time}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${ex.type === 'FINAL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                            {ex.type}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-white">{ex.course}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => setExams(exams.filter(i => i.id !== ex.id))} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-3xl font-black ${theme.header} flex items-center gap-3`}><CalendarDays className="text-purple-500" /> Chronos Calendar</h2>
                <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                    <button onClick={() => setCurrentYearView(v => v-1)} className="text-white"><ChevronLeft size={16}/></button>
                    <span className="font-mono font-bold text-white">{currentYearView}</span>
                    <button onClick={() => setCurrentYearView(v => v+1)} className="text-white"><ChevronRight size={16}/></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(12)].map((_, month) => (
                    <Card key={month} className="p-4 bg-slate-900/40">
                        <h3 className="text-center text-xs font-black uppercase tracking-widest text-blue-400 mb-4 border-b border-slate-800 pb-2">
                            {new Date(0, month).toLocaleString('default', { month: 'long' })}
                        </h3>
                        <div className="grid grid-cols-7 gap-1 text-[9px] text-center font-bold text-slate-600 mb-2">
                            {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {[...Array(getFirstDayOfMonth(month, currentYearView))].map((_, i) => <div key={`empty-${i}`} />)}
                            {[...Array(getDaysInMonth(month, currentYearView))].map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${currentYearView}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isMarked = bookmarks[dateStr];
                                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                return (
                                    <button 
                                        key={day}
                                        onClick={() => handleDayClick(dateStr)}
                                        className={`h-7 w-7 rounded-md text-[10px] font-mono flex flex-col items-center justify-center relative transition-all
                                            ${isMarked ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : 'hover:bg-slate-800 text-slate-400'}
                                            ${isToday ? 'border-2 border-blue-500 text-white font-bold' : ''}
                                        `}
                                    >
                                        {day}
                                        {isMarked && <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className={`text-3xl font-black ${theme.header} flex items-center gap-3`}><StickyNote className="text-blue-400" /> My Notes Buffer</h2>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">{notes.length} ACTIVE NODES</div>
              </div>
              <Card className="bg-slate-900/60 p-4">
                <div className="flex gap-4">
                  <input 
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    placeholder="Input daily activity, chore, or project node..."
                    className="flex-grow bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                  />
                  <button onClick={addNote} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg transition-all"><PlusCircle size={24}/></button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map(n => (
                  <Card key={n.id} className="flex justify-between items-start group hover:bg-slate-900/40 border-slate-800/50">
                    <div>
                      <p className="text-white font-semibold text-lg leading-snug">{n.text}</p>
                      <p className="text-[10px] text-blue-500/50 font-mono mt-2 uppercase font-bold tracking-widest">{n.date}</p>
                    </div>
                    <button onClick={() => deleteNote(n.id)} className="text-slate-600 hover:text-red-500 transition-colors p-2"><XCircle size={20}/></button>
                  </Card>
                ))}
                {notes.length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-30">
                    <StickyNote size={64} className="mx-auto mb-4 text-white" />
                    <p className="font-mono uppercase tracking-[0.3em] text-white">Buffer Empty. Add nodes to track chores.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-8 max-w-3xl mx-auto">
               <div className="flex items-center justify-between">
                <h2 className={`text-3xl font-black ${theme.header} flex items-center gap-3`}><Music className="text-pink-500" /> Sound Waves</h2>
              </div>
              <Card className="p-0 overflow-hidden bg-black border-pink-500/20 shadow-2xl">
                <iframe 
                  style={{borderRadius: "12px"}} 
                  src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8Ueb99idzhR?utm_source=generator&theme=0" 
                  width="100%" 
                  height="352" 
                  frameBorder="0" 
                  allowFullScreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy">
                </iframe>
              </Card>
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-xs font-mono text-slate-500 max-w-md">Connect to your primary Spotify core via external link for full control. Use this module for background Lo-Fi focus during study phases.</p>
                <a 
                  href="https://open.spotify.com" 
                  target="_blank" 
                  className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all shadow-xl"
                >
                  <ExternalLink size={16} /> Open Spotify Account
                </a>
              </div>
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-3xl font-black ${theme.header} flex items-center gap-3`}><Calculator className="text-emerald-500" /> GPA Processor</h2>
                <div className="flex gap-2 items-center bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Target CG</span>
                  <input type="number" step="0.1" value={targetCG} onChange={(e) => setTargetCG(parseFloat(e.target.value))} className="bg-transparent border-none p-0 w-12 text-sm font-mono text-emerald-500 focus:ring-0" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-6">
                  {semesters.map((sem, si) => (
                    <Card key={sem.id}>
                      <div className="flex justify-between items-center mb-6">
                        <input value={sem.name} onChange={(e) => {
                          const n = [...semesters]; n[si].name = e.target.value; setSemesters(n);
                        }} className="bg-transparent border-none text-xl font-black text-white p-0 focus:ring-0" />
                        <button onClick={() => setSemesters(semesters.filter(s => s.id !== sem.id))} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                      <div className="space-y-3">
                        {sem.courses.map((c, ci) => (
                          <div key={c.id} className="grid grid-cols-12 gap-4 items-center p-2 bg-slate-800/30 rounded border border-slate-800">
                            <input value={c.name} onChange={(e) => {
                              const n = [...semesters]; n[si].courses[ci].name = e.target.value; setSemesters(n);
                            }} className="col-span-6 bg-transparent border-none text-sm font-bold text-slate-200 focus:ring-0" />
                            <input type="number" value={c.credits} onChange={(e) => {
                              const n = [...semesters]; n[si].courses[ci].credits = parseInt(e.target.value) || 0; setSemesters(n);
                            }} className="col-span-2 bg-transparent border-none text-sm font-mono text-blue-400 focus:ring-0" />
                            <select value={c.grade} onChange={(e) => {
                              const n = [...semesters]; n[si].courses[ci].grade = parseFloat(e.target.value); setSemesters(n);
                            }} className="col-span-3 bg-slate-900 border border-slate-800 text-xs text-amber-500 rounded p-1">
                              {GRADING_SCALE.map(g => <option key={g.label} value={g.value}>{g.label} ({g.value})</option>)}
                            </select>
                            <button onClick={() => {
                              const n = [...semesters]; n[si].courses = sem.courses.filter(item => item.id !== c.id); setSemesters(n);
                            }} className="col-span-1 text-slate-700 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                        ))}
                        <button onClick={() => {
                          const n = [...semesters]; n[si].courses.push({ id: Date.now().toString(), name: "New Course", credits: 3, grade: 4.0 }); setSemesters(n);
                        }} className="w-full mt-2 py-2 border border-dashed border-slate-800 rounded-lg text-[10px] font-bold uppercase text-slate-500 hover:border-blue-500 hover:text-blue-500">Add Course Node</button>
                      </div>
                    </Card>
                  ))}
                  <button onClick={() => setSemesters([...semesters, { id: Date.now().toString(), name: "New Semester", courses: [] }])} className="w-full py-4 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all text-white">New Semester Group</button>
                </div>
                <div className="space-y-6">
                  <Card className="sticky top-8 border-t-4 border-t-emerald-500 bg-blue-500/5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-tighter">Cumulative Flow</h3>
                    <div className="space-y-4">
                      <div><p className="text-[10px] font-bold text-slate-500 uppercase">Current CGPA</p><p className="text-4xl font-black text-white">{stats.gpa}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-500 uppercase">Quality Points</p><p className="text-xl font-bold text-blue-500 font-mono">{stats.totalQualityPoints}</p></div>
                      <button onClick={async () => {
                        setIsAiLoading(true);
                        const res = await callGemini(`My CGPA is ${stats.gpa}. I am an Electrical Engineering student. Give me a brief technical strategy to maintain focus.`);
                        setAiOutput({ title: "AI Diagnostic", content: res });
                        setIsAiLoading(false);
                      }} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase shadow-lg shadow-blue-900/40">✨ Analyze Strategy</button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

        </main>

        <footer className={`mt-20 py-10 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] ${theme.sub} font-mono uppercase tracking-[0.3em]`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p>© 2026 HOUSE OPEN CIRCUIT. ALL NODES FULLY CONDUCTIVE.</p>
          </div>
          <div className="flex gap-8 text-white">
             <span className="flex items-center gap-2">TEMP: 38°C</span>
             <span className="flex items-center gap-2">OS: MISHI_ELECTRIC_V7.1</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;