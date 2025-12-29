
import React, { useState, useMemo } from 'react';
import { Participant, ScheduleItem } from '../types';
import { formatTime, addMinutes, parseTime } from '../utils';
import { Clock, Coffee, Copy, Download, Trash2, Plus, GripVertical, AlertTriangle, ListOrdered, Move } from 'lucide-react';

interface Props {
  participants: Participant[];
  onReorder: (data: Participant[]) => void;
}

export const ScheduleBuilder: React.FC<Props> = ({ participants: initialParticipants, onReorder }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(20);
  const [breakAfter, setBreakAfter] = useState(3);
  const [breakDuration, setBreakDuration] = useState(15);
  const [hasBreak, setHasBreak] = useState(true);

  // Reordering state for Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const schedule = useMemo(() => {
    const items: ScheduleItem[] = [];
    if (initialParticipants.length === 0) return items;

    let currentTime = parseTime(startTime);

    initialParticipants.forEach((p, index) => {
      // Add break if enabled and it's time (user specified "after Nth talk")
      if (hasBreak && index > 0 && index % breakAfter === 0) {
        const breakEnd = addMinutes(currentTime, breakDuration);
        items.push({
          name: 'SZÜNET',
          title: 'Networking & Kávé',
          startTime: formatTime(currentTime),
          endTime: formatTime(breakEnd),
          isBreak: true
        });
        currentTime = breakEnd;
      }

      const endTime = addMinutes(currentTime, duration);
      items.push({
        ...p,
        startTime: formatTime(currentTime),
        endTime: formatTime(endTime),
      });
      currentTime = endTime;
    });
    return items;
  }, [initialParticipants, startTime, duration, hasBreak, breakAfter, breakDuration]);

  const onDragStart = (index: number) => setDraggedIndex(index);
  
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newList = [...initialParticipants];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onReorder(newList);
  };

  const onDragEnd = () => setDraggedIndex(null);

  const downloadTxt = () => {
    const text = schedule
      .map(item => `${item.startTime}–${item.endTime}: ${item.isBreak ? '☕ ' + item.name : `${item.name} | ${item.title}`}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Program_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Szekcióbeosztás</h2>
          <p className="text-slate-400">Időterv generálása és az előadók sorrendezése.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Clock className="w-4 h-4 text-indigo-400" /> Időbeállítások
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Első előadás kezdete</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Előadás hossza (perc)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} className={inputClass} />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={hasBreak} onChange={(e) => setHasBreak(e.target.checked)} className="w-5 h-5 bg-slate-800 border-slate-700 rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-300">Szünetek alkalmazása</span>
                </label>
              </div>

              {hasBreak && (
                <div className="space-y-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 animate-in zoom-in-95 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hány előadás után?</label>
                    <input type="number" value={breakAfter} onChange={(e) => setBreakAfter(parseInt(e.target.value) || 1)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Szünet hossza (perc)</label>
                    <input type="number" value={breakDuration} onChange={(e) => setBreakDuration(parseInt(e.target.value) || 0)} className={inputClass} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {initialParticipants.length > 0 && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3">
              <Move className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-200/60 leading-normal">
                <strong>Tipp:</strong> A jobb oldali listában húzd a sorokat (Drag & Drop) az előadók sorrendjének módosításához!
              </p>
            </div>
          )}
        </div>

        {/* Schedule Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2 uppercase tracking-widest text-xs">
              Időrendi Tervezet
            </h3>
            <button 
              onClick={downloadTxt}
              disabled={schedule.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 disabled:opacity-30 shadow-lg"
            >
              <Download className="w-3.5 h-3.5" /> Program Letöltése
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <tbody className="divide-y divide-slate-800">
                  {schedule.length === 0 ? (
                    <tr>
                      <td className="px-6 py-24 text-center text-slate-600 italic">
                        Még nincs beolvasott adat a programhoz.
                      </td>
                    </tr>
                  ) : (
                    schedule.map((item, i) => {
                      // Find actual participant index for DnD
                      const pIndex = initialParticipants.findIndex(p => p.name === item.name && p.title === item.title);
                      
                      return (
                        <tr 
                          key={`${item.name}-${i}`}
                          draggable={!item.isBreak}
                          onDragStart={() => !item.isBreak && onDragStart(pIndex)}
                          onDragOver={(e) => !item.isBreak && onDragOver(e, pIndex)}
                          onDragEnd={onDragEnd}
                          className={`
                            transition-all relative
                            ${item.isBreak ? 'bg-indigo-500/5' : 'hover:bg-slate-800/50 cursor-grab active:cursor-grabbing'}
                            ${draggedIndex === pIndex ? 'opacity-20' : ''}
                          `}
                        >
                          <td className="px-6 py-5 whitespace-nowrap w-32">
                            <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10">
                              {item.startTime}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {item.isBreak ? (
                              <div className="flex items-center gap-3 text-indigo-300 font-bold uppercase tracking-widest text-[11px]">
                                <Coffee className="w-4 h-4" /> {item.name}
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <GripVertical className="w-4 h-4 text-slate-700 shrink-0" />
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-100">{item.name}</div>
                                  <div className="text-slate-500 italic text-xs leading-relaxed max-w-lg">{item.title}</div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right text-slate-600 font-mono text-xs w-24">
                            {item.endTime}
                          </td>
                        </tr>
                      );
                    })
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
