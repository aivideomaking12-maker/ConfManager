
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Participant, AbstractResult } from '../types';
import { FileSearch, Download, Upload, AlertCircle, CheckCircle, Table as TableIcon, Trash2, FileText, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  onExportToExcel: (data: Participant[]) => void;
}

export const AbstractExtractor: React.FC<Props> = ({ onExportToExcel }) => {
  const [results, setResults] = useState<AbstractResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    const newResults: AbstractResult[] = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        const nameMatch = text.match(/(?:Név|Nev|Név\s*:|Nev\s*:):\s*(.*)/i);
        const titleMatch = text.match(/(?:Cím|Cim|Előadás címe|Eloadas cime|Cím\s*:|Cim\s*:):\s*(.*)/i);

        const name = nameMatch ? nameMatch[1].trim() : 'N/A';
        const title = titleMatch ? titleMatch[1].trim() : 'N/A';

        newResults.push({
          fileName: file.name,
          name,
          title,
          status: (name === 'N/A' || title === 'N/A') ? 'warning' : 'ok'
        });
      } catch (error) {
        console.error(`Hiba a fájl feldolgozásakor: ${file.name}`, error);
        newResults.push({
          fileName: file.name,
          name: 'HIBA',
          title: 'HIBA',
          status: 'error'
        });
      }
    }

    setResults(prev => [...prev, ...newResults]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeResult = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => setResults([]);

  const handleTransfer = () => {
    const validData = results
      .filter(r => r.status !== 'error')
      .map(r => ({ name: r.name, title: r.title }));
    
    if (validData.length === 0) {
      alert("Nincs érvényes kinyert adat!");
      return;
    }
    onExportToExcel(validData);
  };

  const downloadExcel = () => {
    const data = results.map(r => ({ 'Név': r.name, 'Előadás címe': r.title }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Résztvevők");
    XLSX.writeFile(wb, `Absztrakt_Lista_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Absztrakt Feldolgozó</h2>
          <p className="text-slate-400">Tömeges adatkinyerés Word (.docx) absztraktokból.</p>
        </div>
        {results.length > 0 && (
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Lista törlése
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`
              h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-all cursor-pointer
              ${isProcessing ? 'bg-slate-900 border-slate-700 cursor-wait' : 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5'}
            `}
          >
            <div className={`p-4 rounded-2xl ${isProcessing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-500/10 text-indigo-400 shadow-inner'}`}>
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <div className="text-center px-6">
              <p className="font-semibold text-slate-200">{isProcessing ? 'Feldolgozás...' : 'Absztraktok feltöltése'}</p>
              <p className="text-xs text-slate-500 mt-1">Húzd ide a Word fájlokat vagy kattints.</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={processFiles} multiple accept=".docx" className="hidden" />
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <button 
                onClick={handleTransfer}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 group"
              >
                Adatok továbbítása <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={downloadExcel}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-200 py-3 rounded-2xl font-medium hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Download className="w-4 h-4" /> Excel letöltése
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 bg-slate-800/30">
              <TableIcon className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-200">Kinyert adatok</h3>
            </div>
            <div className="overflow-y-auto max-h-[500px] scrollbar-thin">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-slate-900 shadow-md">
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="px-6 py-4 font-medium">Név</th>
                    <th className="px-6 py-4 font-medium">Előadás címe</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-600">
                          <FileText className="w-12 h-12 opacity-10" />
                          <p className="italic text-slate-500">Még nincs feldolgozott absztrakt.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    results.map((r, i) => (
                      <tr key={i} className="group hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {r.status === 'ok' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span className={`font-medium ${r.name === 'N/A' ? 'text-amber-500/70 italic' : 'text-slate-200'}`}>{r.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs leading-relaxed ${r.title === 'N/A' ? 'text-amber-500/70 italic' : 'text-slate-400 font-light italic'}`}>
                            {r.title}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => removeResult(i)} className="p-1.5 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
