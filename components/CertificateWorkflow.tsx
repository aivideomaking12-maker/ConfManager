
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Participant, ProcessingStatus } from '../types';
import { sanitizeFilename } from '../utils';
import { Upload, FileDown, CheckCircle, AlertCircle, RefreshCw, Layers, FileText, Table as TableIcon, Loader2 } from 'lucide-react';

interface Props {
  onDataLoaded: (data: Participant[]) => void;
  initialData: Participant[];
}

export const CertificateWorkflow: React.FC<Props> = ({ onDataLoaded, initialData }) => {
  const [template, setTemplate] = useState<ArrayBuffer | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>(initialData);
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', progress: 0, message: '' });
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const fileInputTemplate = useRef<HTMLInputElement>(null);
  const fileInputExcel = useRef<HTMLInputElement>(null);

  // Sync state if initialData changes (transferred from abstracts)
  React.useEffect(() => {
    setParticipants(initialData);
  }, [initialData]);

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setTemplate(event.target?.result as ArrayBuffer);
      setZipBlob(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData.length === 0) return;
      let startRow = 0;
      const firstRow = jsonData[0].map(c => String(c || '').toLowerCase());
      if (firstRow.some(c => c.includes('név') || c.includes('eloada') || c.includes('cím'))) startRow = 1;
      const parsed: Participant[] = jsonData.slice(startRow)
        .filter(row => row[0] && row[1])
        .map(row => ({ name: String(row[0]).trim(), title: String(row[1]).trim() }));
      setParticipants(parsed);
      onDataLoaded(parsed);
      setZipBlob(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const processCertificates = async () => {
    if (!template || participants.length === 0) return;
    setStatus({ step: 'generating', progress: 0, message: 'Igazolások generálása...' });
    const zip = new JSZip();
    try {
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        const content = new PizZip(template);
        const doc = new Docxtemplater(content, { 
          paragraphLoop: true, 
          linebreaks: true, 
          delimiters: { start: '<<', end: '>>' } 
        });

        // A sablon kulcsai: NEV (ahogy kérted), NÉV (ékezettel), ELOADAS és ELŐADÁS
        doc.render({ 
          NEV: p.name, 
          NÉV: p.name, 
          ELOADAS: p.title,
          ELŐADÁS: p.title
        });

        const out = doc.getZip().generate({ 
          type: 'blob', 
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        const fileName = `Igazolas_${sanitizeFilename(p.name)}.docx`;
        zip.file(fileName, out);
        
        setStatus(prev => ({ 
          ...prev, 
          progress: Math.round(((i + 1) / participants.length) * 80), 
          message: `Feldolgozás: ${p.name}` 
        }));
      }
      setStatus(prev => ({ ...prev, step: 'zipping', progress: 85, message: 'ZIP tömörítése...' }));
      const zipContent = await zip.generateAsync({ type: 'blob' });
      setZipBlob(zipContent);
      setStatus({ step: 'completed', progress: 100, message: 'Kész!' });
    } catch (error) {
      console.error(error);
      setStatus({ step: 'error', progress: 0, message: 'Hiba történt!' });
    }
  };

  const reset = () => {
    setTemplate(null);
    setTemplateName('');
    setParticipants([]);
    setZipBlob(null);
    setStatus({ step: 'idle', progress: 0, message: '' });
    onDataLoaded([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Igazolás Generáló</h2>
          <p className="text-slate-400">Word dokumentumok tömeges kitöltése sablon alapján.</p>
        </div>
        <button onClick={reset} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors">
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {/* Node 1: Template */}
        <div className={`p-6 rounded-3xl border-2 transition-all ${template ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/50'}`}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`p-4 rounded-2xl ${template ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500'}`}>
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">DOCX Sablon</h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">&lt;&lt;NEV&gt;&gt; & &lt;&lt;ELOADAS&gt;&gt;</p>
            </div>
            <button onClick={() => fileInputTemplate.current?.click()} className="w-full py-2 px-4 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors">
              Sablon kiválasztása
            </button>
            <input type="file" ref={fileInputTemplate} onChange={handleTemplateUpload} accept=".docx" className="hidden" />
            {template && <div className="text-[10px] font-mono text-emerald-400 truncate w-full px-2">{templateName}</div>}
          </div>
        </div>

        {/* Node 2: Data */}
        <div className={`p-6 rounded-3xl border-2 transition-all ${participants.length > 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/50'}`}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`p-4 rounded-2xl ${participants.length > 0 ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500'}`}>
              <TableIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Adatforrás</h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Excel feltöltés vagy absztrakt</p>
            </div>
            <button onClick={() => fileInputExcel.current?.click()} className="w-full py-2 px-4 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors">
              Adatok beolvasása
            </button>
            <input type="file" ref={fileInputExcel} onChange={handleExcelUpload} accept=".xlsx" className="hidden" />
            {participants.length > 0 && <div className="text-[10px] font-mono text-emerald-400">{participants.length} fő betöltve</div>}
          </div>
        </div>

        {/* Node 3: Processing */}
        <div className={`p-6 rounded-3xl border-2 transition-all ${status.step !== 'idle' ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`p-4 rounded-2xl ${status.step === 'completed' ? 'bg-emerald-500 text-white' : status.step !== 'idle' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-slate-800 text-slate-500'}`}>
              <Layers className={`w-8 h-8 ${status.step === 'generating' ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Munkafolyamat</h3>
            <button 
              disabled={!template || participants.length === 0 || status.step === 'generating'}
              onClick={processCertificates}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                !template || participants.length === 0 || status.step === 'generating'
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              Indítás
            </button>
            {status.step !== 'idle' && (
              <div className="w-full mt-2">
                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${status.progress}%` }}></div>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter truncate">{status.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Node 4: Download */}
        <div className={`p-6 rounded-3xl border-2 transition-all ${zipBlob ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`p-4 rounded-2xl ${zipBlob ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce' : 'bg-slate-800 text-slate-500'}`}>
              <FileDown className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Letöltés</h3>
            <button 
              disabled={!zipBlob}
              onClick={() => zipBlob && saveAs(zipBlob, `Konferencia_Igazolasok.zip`)}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-md ${
                !zipBlob ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              ZIP Letöltése
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {participants.length > 0 && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-slate-500" /> Aktuális adatok ({participants.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-800">
                {participants.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-200">{p.name}</td>
                    <td className="px-6 py-3 text-slate-500 italic">{p.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
