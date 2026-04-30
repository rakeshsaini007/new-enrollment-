import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, School, MapPin, GraduationCap, Calculator, Save, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// --- CONFIGURATION ---
// Replace this with your actual Google Apps Script web app URL after deployment
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvMO-ateg4cPhR9Kz0E2GDqMZEtr1-Cm-9NnNvn3dNNWwq7A9UC66gU53bL-jDS2UR/exec';

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

export default function App() {
  const [formData, setFormData] = useState<SchoolData>(INITIAL_STATE);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-calculate Totals
  useEffect(() => {
    const newEnrolledKeys: EnrollmentField[] = [
      'Class 1 New Enrolled',
      'Class 2 New Enrolled',
      'Class 3 New Enrolled',
      'Class 4 New Enrolled',
      'Class 5 New Enrolled',
      'Class 6 New Enrolled',
      'Class 7 New Enrolled',
      'Class 8 New Enrolled',
    ];

    const allEnrolledKeys: EnrollmentField[] = [
      ...newEnrolledKeys,
      'Class 2 Old Enrolled',
      'Class 3 Old Enrolled',
      'Class 4 Old Enrolled',
      'Class 5 Old Enrolled',
      'Class 6 Old Enrolled',
      'Class 7 Old Enrolled',
      'Class 8 Old Enrolled',
    ];

    const totalNew = newEnrolledKeys.reduce((sum, key) => sum + (Number(formData[key]) || 0), 0);
    const totalAll = allEnrolledKeys.reduce((sum, key) => sum + (Number(formData[key]) || 0), 0);

    setFormData(prev => ({
      ...prev,
      'Total New Enrolled': totalNew,
      'Total Enrolled': totalAll
    }));
  }, [
    formData['Class 1 New Enrolled'], formData['Class 2 New Enrolled'], formData['Class 2 Old Enrolled'],
    formData['Class 3 New Enrolled'], formData['Class 3 Old Enrolled'], formData['Class 4 New Enrolled'],
    formData['Class 4 Old Enrolled'], formData['Class 5 New Enrolled'], formData['Class 5 Old Enrolled'],
    formData['Class 6 New Enrolled'], formData['Class 6 Old Enrolled'], formData['Class 7 New Enrolled'],
    formData['Class 7 Old Enrolled'], formData['Class 8 New Enrolled'], formData['Class 8 Old Enrolled']
  ]);

  const handleFetch = async () => {
    if (!formData['Udise Code']) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${SCRIPT_URL}?udiseCode=${formData['Udise Code']}`);
      const result = await response.json();

      if (result.success) {
        // Map fetched data, ensuring numbers are numbers
        const fetchedData = result.data;
        const mappedData: any = { ...INITIAL_STATE };
        
        Object.keys(fetchedData).forEach(key => {
          if (key in INITIAL_STATE) {
            const val = fetchedData[key];
            mappedData[key] = (typeof INITIAL_STATE[key as keyof SchoolData] === 'number') 
              ? Number(val) || 0 
              : val;
          }
        });

        setFormData(mappedData);
        setIsUpdating(true);
        setMessage({ text: 'School data fetched successfully!', type: 'success' });
      } else {
        // If not found, reset others but keep UDISE
        setFormData(prev => ({ ...INITIAL_STATE, 'Udise Code': prev['Udise Code'] }));
        setIsUpdating(false);
        setMessage({ text: result.message || 'No existing data found.', type: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Connect your Apps Script to start syncing.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  const renderEnrollmentCard = (className: string, fields: EnrollmentField[]) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 flex flex-col gap-4"
        key={className}
        id={`card-${className.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <GraduationCap size={18} />
          </div>
          <h3 className="font-semibold text-slate-800">{className}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field as string} className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {field.toString().replace(className, '').trim() || 'New Enrolled'}
              </label>
              <input
                type="number"
                min="0"
                value={formData[field]}
                onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
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
    if (type === 'COMP' || type === 'Composite' || type === 'COMPOSITE') return [1, 2, 3, 4, 5, 6, 7, 8];
    return [];
  }, [formData['School Type']]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">School Enrollment</h1>
            <p className="text-slate-500 font-medium">Digital attendance & enrollment management</p>
          </div>
          {message && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </motion.div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Card */}
          <div className="p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-semibold text-slate-700 ml-1 block">UDISE Code</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter school UDISE code..."
                    value={formData['Udise Code']}
                    onChange={(e) => handleInputChange('Udise Code', e.target.value)}
                    onBlur={handleFetch}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono font-medium text-lg"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleFetch}
                disabled={isLoading || !formData['Udise Code']}
                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />}
                {isUpdating ? 'Refresh' : 'Fetch'}
              </button>
            </div>

            {/* School Info (Read-only population) */}
            <AnimatePresence>
              {formData['School Name'] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-100"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <School size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">School Name</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 leading-tight">{formData['School Name']}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Nyay Panchayat</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formData['Nyay Panchayat']}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <GraduationCap size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Type</span>
                    </div>
                    <div className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold ring-1 ring-indigo-200">
                      {formData['School Type']}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleClasses.map(num => {
                const className = `Class ${num}`;
                const fields: EnrollmentField[] = (num === 1 || (formData['School Type'] === 'UPS' && num === 6))
                  ? [`Class ${num} New Enrolled` as EnrollmentField]
                  : [`Class ${num} New Enrolled` as EnrollmentField, `Class ${num} Old Enrolled` as EnrollmentField];
                
                return renderEnrollmentCard(className, fields);
              })}
            </AnimatePresence>
          </div>

          {/* Totals & Submit */}
          {formData['School Name'] && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-8"
            >
              <div className="flex items-center gap-8 w-full md:w-auto">
                <div className="space-y-1">
                  <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider block">Total New</span>
                  <div className="text-3xl font-bold font-mono tracking-tighter flex items-center gap-2">
                    <Calculator size={20} className="text-indigo-300" />
                    {formData['Total New Enrolled']}
                  </div>
                </div>
                <div className="w-px h-12 bg-white/10 hidden md:block" />
                <div className="space-y-1">
                  <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider block">Total Enrolled</span>
                  <div className="text-3xl font-bold font-mono tracking-tighter">
                    {formData['Total Enrolled']}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-12 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                {isUpdating ? 'Update Data' : 'Submit Data'}
              </button>
            </motion.div>
          )}
        </form>
      </div>

      <footer className="max-w-4xl mx-auto py-12 text-center text-slate-400">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-px w-8 bg-slate-200" />
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Deployment Info</p>
          <div className="h-px w-8 bg-slate-200" />
        </div>
        <p className="text-xs">Ensure your Google Apps Script is deployed as a Web App with 'Anyone' access.</p>
      </footer>
    </div>
  );
}
