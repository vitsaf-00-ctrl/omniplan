import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileSpreadsheet, Calendar, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTaskStore, getProjectColor } from '../store/useTaskStore';

interface Props { isOpen: boolean; onClose: () => void; }

export function ImportModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<'selection'|'parsing'|'success'>('selection');
  const [error, setError] = useState<string|null>(null);
  const [importType, setImportType] = useState<'excel'|'google'>('excel');
  const [count, setCount] = useState(0);
  const { importTasks } = useTaskStore();

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]; if (!file) return;
    setStep('parsing'); setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(ws);
        const mapped = json.map(row => {
          const title = row['Завдання']||row['title']||row['Task']||String(Object.values(row)[0]||'');
          const project = row['Проєкт']||row['project']||'ДІС';
          const statusVal = row['Статус']||row['status'];
          const status = statusVal==='done'||statusVal==='Готово'?'done':statusVal==='in_progress'||statusVal==='В процесі'?'in_progress':'todo';
          let date = new Date();
          if (row['Дата']||row['date']) { const p=new Date(row['Дата']||row['date']); if(!isNaN(p.getTime())) date=p; }
          return { title, project, status, date, tagColor: getProjectColor(project) };
        }).filter(t=>t.title.trim()) as any[];
        setTimeout(() => { importTasks(mapped); setCount(mapped.length); setStep('success'); }, 1000);
      } catch { setError('Не вдалося прочитати файл.'); setStep('selection'); }
    };
    reader.readAsArrayBuffer(file);
  }, [importTasks]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'], 'application/vnd.ms-excel':['.xls'], 'text/csv':['.csv'] }, multiple: false
  });

  const handleClose = () => { setStep('selection'); setError(null); onClose(); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 dark:text-white">Імпорт задач</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-5">
          {step==='selection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{k:'excel',Icon:FileSpreadsheet,label:'Excel / CSV'},{k:'google',Icon:Calendar,label:'G-Calendar'}].map(({k,Icon,label})=>(
                  <button key={k} onClick={()=>setImportType(k as any)}
                    className={`p-4 rounded-xl border-2 text-center flex flex-col items-center gap-2 transition-all ${importType===k?'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20':'border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}>
                    <div className={`p-2.5 rounded-lg ${importType===k?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}><Icon className="w-5 h-5"/></div>
                    <span className="text-[10px] font-black uppercase tracking-wider dark:text-slate-200">{label}</span>
                  </button>
                ))}
              </div>
              {importType==='excel' ? (
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive?'border-indigo-500 bg-indigo-50':'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  <input {...getInputProps()}/>
                  <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-3"/>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Перетягніть файл сюди</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">або натисніть для вибору</p>
                </div>
              ) : (
                <div className="p-5 bg-indigo-600 rounded-xl text-center">
                  <p className="text-white font-bold mb-3 text-sm">Google Calendar</p>
                  <button className="w-full bg-white text-indigo-600 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest">Підключити акаунт</button>
                </div>
              )}
              {error&&<div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg text-xs font-bold border border-rose-100"><AlertCircle className="w-4 h-4"/>{error}</div>}
            </div>
          )}
          {step==='parsing'&&(
            <div className="py-12 text-center">
              <div className="relative w-12 h-12 mx-auto mb-4"><div className="absolute inset-0 rounded-full border-4 border-indigo-100"/><div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/></div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Аналізуємо дані...</p>
            </div>
          )}
          {step==='success'&&(
            <div className="py-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-7 h-7"/></div>
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-2">Імпорт завершено!</h3>
              <p className="text-sm text-slate-500 mb-5">{count} задач додано.</p>
              <button onClick={handleClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Закрити</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
