import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, School, MapPin, GraduationCap, Calculator, Save, RefreshCw, AlertCircle, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';

// --- CONFIGURATION ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvMO-ateg4cPhR9Kz0E2GDqMZEtr1-Cm-9NnNvn3dNNWwq7A9UC66gU53bL-jDS2UR/exec';

function normalizeKey(str: string) {
  return str.toString().trim().replace(/\s+/g, ' ');
}

interface SchoolData {
  'Udise Code': string;
  'School Name': string;
  'Nyay Panchayat': string;
  'School Type': 'PS' | 'UPS' | 'COMP' | string;
  'Class 1 New Enrolled': number;
  'Class 2 New Enrolled': number;
  'Class 2 Old Enrolled': number;
  'Class 3 New Enrolled': number;
  'Class 3 Old Enrolled': number;
  'Class 4 New Enrolled': number;
  'Class 4 Old Enrolled': number;
  'Class 5 New Enrolled': number;
  'Class 5 Old Enrolled': number;
  'Class 6 New Enrolled': number;
  'Class 6 Old Enrolled': number;
  'Class 7 New Enrolled': number;
  'Class 7 Old Enrolled': number;
  'Class 8 New Enrolled': number;
  'Class 8 Old Enrolled': number;
  'Total New Enrolled': number;
  'Total Enrolled': number;
}

const INITIAL_STATE: SchoolData = {
  'Udise Code': '',
  'School Name': '',
  'Nyay Panchayat': '',
  'School Type': '',
  'Class 1 New Enrolled': 0,
  'Class 2 New Enrolled': 0,
  'Class 2 Old Enrolled': 0,
  'Class 3 New Enrolled': 0,
  'Class 3 Old Enrolled': 0,
  'Class 4 New Enrolled': 0,
  'Class 4 Old Enrolled': 0,
  'Class 5 New Enrolled': 0,
  'Class 5 Old Enrolled': 0,
  'Class 6 New Enrolled': 0,
  'Class 6 Old Enrolled': 0,
  'Class 7 New Enrolled': 0,
  'Class 7 Old Enrolled': 0,
  'Class 8 New Enrolled': 0,
  'Class 8 Old Enrolled': 0,
  'Total New Enrolled': 0,
  'Total Enrolled': 0,
};

type EnrollmentField = keyof SchoolData;

const CLASS_THEMES: Record<number, string> = {
  1: 'from-blue-400 to-blue-600',
  2: 'from-emerald-400 to-emerald-600',
  3: 'from-violet-400 to-violet-600',
  4: 'from-rose-400 to-rose-600',
  5: 'from-amber-400 to-amber-600',
  6: 'from-cyan-400 to-cyan-600',
  7: 'from-indigo-400 to-indigo-600',
  8: 'from-fuchsia-400 to-fuchsia-600',
};

export default function App() {
  const [formData, setFormData] = useState<SchoolData>(INITIAL_STATE);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Derived Totals
  const totals = useMemo(() => {
    const newEnrolledKeys: EnrollmentField[] = [
      'Class 1 New Enrolled', 'Class 2 New Enrolled', 'Class 3 New Enrolled', 
      'Class 4 New Enrolled', 'Class 5 New Enrolled', 'Class 6 New Enrolled', 
      'Class 7 New Enrolled', 'Class 8 New Enrolled',
    ];
    const oldEnrolledKeys: EnrollmentField[] = [
      'Class 2 Old Enrolled', 'Class 3 Old Enrolled', 'Class 4 Old Enrolled', 
      'Class 5 Old Enrolled', 'Class 6 Old Enrolled', 'Class 7 Old Enrolled', 
      'Class 8 Old Enrolled',
    ];

    const totalNew = newEnrolledKeys.reduce((sum, key) => sum + (Number(formData[key]) || 0), 0);
    const totalAll = totalNew + oldEnrolledKeys.reduce((sum, key) => sum + (Number(formData[key]) || 0), 0);
    
    return { totalNew, totalAll };
  }, [formData]);

  const handleFetch = async () => {
    if (!formData['Udise Code']) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${SCRIPT_URL}?udiseCode=${formData['Udise Code']}`);
      const result = await response.json();

      if (result.success) {
        const fetchedData = result.data;
        const mappedData: any = { ...INITIAL_STATE, 'Udise Code': formData['Udise Code'] };
        
        const stateKeys = Object.keys(INITIAL_STATE).map(k => normalizeKey(k));
        const originalStateKeys = Object.keys(INITIAL_STATE);

        Object.keys(fetchedData).forEach(rawKey => {
          const nKey = normalizeKey(rawKey);
          const index = stateKeys.indexOf(nKey);
          
          if (index > -1) {
            const actualKey = originalStateKeys[index] as keyof SchoolData;
            const val = fetchedData[rawKey];
            mappedData[actualKey] = (typeof INITIAL_STATE[actualKey] === 'number') 
              ? Number(val) || 0 
              : val;
          }
        });

        setFormData(mappedData);
        setIsUpdating(true);
        setMessage({ text: 'School data fetched successfully!', type: 'success' });
      } else {
        setFormData(prev => ({ ...INITIAL_STATE, 'Udise Code': prev['Udise Code'] }));
        setIsUpdating(false);
        setMessage({ text: result.message || 'No existing data found.', type: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Error connecting to sheet. Verify Script URL & Deployment.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      ...formData,
      'Total New Enrolled': totals.totalNew,
      'Total Enrolled': totals.totalAll
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setMessage({ 
        text: isUpdating ? 'Data updated successfully!' : 'Data saved successfully!', 
        type: 'success' 
      });
      alert(isUpdating ? 'Data updated successfully!' : 'Data saved successfully!');
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Failed to save data.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: EnrollmentField, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderEnrollmentCard = (num: number, index: number) => {
    const className = `Class ${num}`;
    const isUps = formData['School Type'] === 'UPS';
    const fields: EnrollmentField[] = (num === 1 || (isUps && num === 6))
      ? [`Class ${num} New Enrolled` as EnrollmentField]
      : [`Class ${num} New Enrolled` as EnrollmentField, `Class ${num} Old Enrolled` as EnrollmentField];
    
    const theme = CLASS_THEMES[num] || 'from-slate-400 to-slate-600';

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[2.5rem] p-6 glass-card group transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 hover:shadow-indigo-500/40 border-2"
        key={num}
        id={`card-${num}`}
      >
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme}`} />
        
        <div className="flex justify-between items-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black bg-gradient-to-br ${theme} text-white shadow-2xl shadow-indigo-500/30 transform group-hover:rotate-12 transition-transform duration-500`}>
            {num}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Class</span>
        </div>

        <div className="space-y-6">
          {fields.map(field => (
            <div key={field as string} className="space-y-2">
              <label className="text-[10px] uppercase font-black text-white/40 tracking-widest block ml-1">
                {field.toString().replace(className, '').trim() || 'New Enrolled'}
              </label>
              <input
                type="number"
                min="0"
                value={formData[field]}
                onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl outline-none font-black text-white text-2xl transition-all focus:bg-white/10 focus:border-white/30 focus:ring-8 focus:ring-indigo-500/5 placeholder:text-white/10 text-center"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const visibleClasses = useMemo(() => {
    const type = formData['School Type'];
    if (type === 'PS') return [1, 2, 3, 4, 5];
    if (type === 'UPS') return [6, 7, 8];
    const isComp = type === 'COMP' || type === 'Composite' || type === 'COMPOSITE';
    if (isComp) return [1, 2, 3, 4, 5, 6, 7, 8];
    return [];
  }, [formData['School Type']]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col font-sans text-white relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background Blobs and Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Glow Orbs from theme kit */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Global Particles */}
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${10 + Math.random() * 15}s`,
              width: `${Math.random() * 2 + 2}px`,
              height: `${Math.random() * 2 + 2}px`,
              opacity: Math.random() * 0.2 + 0.1
            }}
          />
        ))}
      </div>

      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-30 bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-2xl shadow-indigo-500/50 transform hover:scale-110 transition-transform duration-300">
              <School size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                EduData <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Portal</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Student Records Management</p>
            </div>
          </div>
          <div className="text-xs font-bold text-white/80 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hidden sm:block hover:bg-white/15 transition-all">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-6 py-12 relative z-10 flex-grow">
        {/* Page Title Section */}
        <header className="mb-16 text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
            नवीन नामांकन <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">2026-27</span>
          </h1>
          <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
            Enter school UDISE code to manage enrollment
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Main Search & School Info Card */}
          <section className="animate-fade-in-up">
            <div className="max-w-xl mx-auto mb-12 relative group">
              {/* Glowing Background Ring */}
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500 animate-pulse" />
              
              <div className="relative flex p-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
                <input
                  type="text"
                  placeholder="Enter school UDISE code without Zero"
                  value={formData['Udise Code']}
                  onChange={(e) => handleInputChange('Udise Code', e.target.value)}
                  onBlur={handleFetch}
                  className="w-full pl-6 pr-4 py-4 bg-transparent text-xl font-bold text-white placeholder:text-white/20 outline-none"
                />
                <button
                  type="button"
                  onClick={handleFetch}
                  disabled={isLoading || !formData['Udise Code']}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 rounded-2xl font-bold shadow-lg shadow-indigo-500/50 transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[130px] group"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Search size={22} className="group-hover:scale-110 transition-transform" />}
                  <span className="hidden sm:inline ml-2 font-black">Fetch</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {formData['School Name'] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.01] transition-all duration-300"
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${isUpdating ? 'from-amber-400 via-orange-500 to-red-500' : 'from-indigo-500 via-purple-500 to-pink-500'}`} />
                  
                  <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-white leading-tight mb-4">{formData['School Name']}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-white/80 text-sm font-bold bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <span className="uppercase text-[10px] tracking-wider text-white/50">UDISE</span>
                            <span className="text-white font-black">{formData['Udise Code']}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/80 text-sm font-bold bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <span className="uppercase text-[10px] tracking-wider text-white/50">Panchayat</span>
                            <span className="text-white font-black">{formData['Nyay Panchayat']}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isUpdating && (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white border border-amber-300/50 shadow-lg shadow-amber-500/30 animate-bounce-subtle">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            UPDATE MODE
                          </span>
                        )}
                        <span className={`px-6 py-3 rounded-xl text-sm font-black tracking-wide shadow-xl border-2 backdrop-blur-sm ${
                          formData['School Type'] === 'PS' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/30' :
                          formData['School Type'] === 'UPS' ? 'bg-blue-500/20 text-blue-300 border-blue-400/50 shadow-blue-500/30' :
                          'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/30'
                        }`}>
                          {formData['School Type']}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Classes Grid Section */}
          <div className="px-2">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-white flex items-center gap-4">
                <span className="w-1.5 h-10 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
                Classwise Enrollment
              </h3>
              <div className="hidden sm:block text-xs font-black text-white/60 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                Academic Year 2026-27 Enrollment Cycle
              </div>
            </div>
            
            <AnimatePresence mode="popLayout">
              {visibleClasses.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                  {visibleClasses.map((num, idx) => renderEnrollmentCard(num, idx))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submission and Analytics Footer */}
          {formData['School Name'] && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky bottom-10 z-20 glass-card rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-12 bg-white/5 border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 opacity-50" />
              
              <div className="relative flex items-center gap-16 w-full md:w-auto">
                <div className="space-y-3">
                  <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Calculator size={14} /> Total New
                  </span>
                  <div className="text-5xl font-black text-white font-mono tracking-tighter">
                    {totals.totalNew}
                  </div>
                </div>
                <div className="w-px h-16 bg-white/10 hidden md:block" />
                <div className="space-y-3">
                  <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Total Enrolled</span>
                  <div className="text-5xl font-black text-white font-mono tracking-tighter">
                    {totals.totalAll}
                  </div>
                </div>
              </div>

              <div className="relative w-full md:w-auto">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`
                    w-full group relative overflow-hidden rounded-[2rem] shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/50 border border-white/20
                    ${isSubmitting ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${isUpdating ? 'from-amber-500 to-orange-600' : 'from-indigo-600 to-purple-600'} transition-all duration-300 group-hover:scale-110`} />
                  <div className="relative flex items-center justify-center gap-4 px-12 py-6 text-white font-black text-xl tracking-wide">
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={28} />
                    ) : (
                      <>
                        {isUpdating ? <RefreshCw size={24} /> : <Save size={24} />}
                        <span>{isUpdating ? 'Update Records' : 'Save Records'}</span>
                        <ChevronRight className="group-hover:translate-x-2 transition-transform duration-500" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </form>

        <footer className="mt-20 py-10 text-center opacity-30 border-t border-white/5">
          <p className="text-[10px] uppercase font-black tracking-widest">EduData Portal System © 2026-27 Phase I</p>
        </footer>

        {/* Global Toast Notifications */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`fixed bottom-12 right-12 z-[100] flex items-center gap-5 px-8 py-6 rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-3xl border-2 ${
                message.type === 'success' 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              <div className="pr-6 border-r border-white/10">
                <p className="text-lg font-black tracking-tight leading-tight">{message.text}</p>
                <p className="text-[10px] font-black uppercase opacity-60 tracking-wider mt-1">{message.type === 'success' ? 'Operation Success' : 'System Alert'}</p>
              </div>
              <button 
                onClick={() => setMessage(null)}
                className="p-3 hover:bg-white/10 rounded-full transition-colors"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
