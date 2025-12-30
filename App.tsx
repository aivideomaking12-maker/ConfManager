
import React, { useState } from 'react';
import { CertificateWorkflow } from './components/CertificateWorkflow';
import { ScheduleBuilder } from './components/ScheduleBuilder';
import { AbstractExtractor } from './components/AbstractExtractor';
import { Participant } from './types';
import { Shield, FileText, Calendar, FileSearch, Info } from 'lucide-react';

type Tab = 'abstracts' | 'certificates' | 'schedule';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('abstracts');
  const [sharedParticipants, setSharedParticipants] = useState<Participant[]>([]);

  const handleAbstractExport = (data: Participant[]) => {
    setSharedParticipants(data);
    // Switch to certificates automatically if data is exported
    setActiveTab('certificates');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <FileText className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Konferencia Menedzser
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="uppercase tracking-wider">100% Privát Adatkezelés</span>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto pb-px no-scrollbar">
            <button
              onClick={() => setActiveTab('abstracts')}
              className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'abstracts'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              1. Absztrakt Feldolgozás
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'certificates'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              2. Igazolások Generálása
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              3. Szekcióbeosztás
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 mb-8 flex gap-4 items-start shadow-inner">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-200/80 leading-relaxed">
            Minden adat a böngésződben marad. A fájlokat lokálisan dolgozzuk fel, így az előadók adatai nem kerülnek feltöltésre külső szerverekre.
          </p>
        </div>

        {activeTab === 'abstracts' && (
          <AbstractExtractor 
            onExportToExcel={handleAbstractExport} 
          />
        )}
        {activeTab === 'certificates' && (
          <CertificateWorkflow 
            onDataLoaded={setSharedParticipants} 
            initialData={sharedParticipants} 
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleBuilder 
            participants={sharedParticipants} 
            onReorder={setSharedParticipants}
          />
        )}
      </main>

      <footer className="mt-auto py-12 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-2 text-slate-500 text-sm">
          <p className="font-medium">Minden jog fenntartva - HV VibeCoder</p>
          <p className="text-xs opacity-50 tabular-nums">Verzió: 1.2.5 (2025)</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
