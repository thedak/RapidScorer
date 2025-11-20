import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { Plus, History, BarChart2, Settings, ChevronLeft, ArrowRight, Target, Grid3X3, FileText, X, Edit2, Save } from 'lucide-react';
import { Session, End, ArrowShot, TargetFaceType } from './types';
import { DEFAULT_ARROWS_PER_END, DEFAULT_ENDS } from './constants';
import { saveSession, getSessions, calculateSessionScore, deleteSession } from './services/storage';
import TargetVisual from './components/TargetVisual';
import DialPad from './components/DialPad';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Helpers ---

const getArrowColor = (value: number) => {
  if (value >= 9) return { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-500' };
  if (value >= 7) return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' };
  if (value >= 5) return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' };
  if (value >= 3) return { bg: 'bg-black', text: 'text-white', border: 'border-zinc-600' };
  if (value >= 1) return { bg: 'bg-white', text: 'text-black', border: 'border-zinc-200' };
  return { bg: 'bg-green-900', text: 'text-white', border: 'border-green-800' };
};

const calculateStats = (session: Session) => {
  const totalScore = calculateSessionScore(session);
  const totalArrows = session.ends.reduce((acc, end) => acc + end.arrows.length, 0);
  const average = totalArrows > 0 ? totalScore / totalArrows : 0;
  return { totalScore, totalArrows, average };
};

// --- Components ---

const ArrowBadge = ({ arrow, onClick, size = 'md' }: { arrow: ArrowShot, onClick?: () => void, size?: 'sm'|'md' }) => {
  const style = getArrowColor(arrow.value);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  
  return (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold border shadow-sm ${style.bg} ${style.text} ${style.border} ${onClick ? 'active:scale-95 cursor-pointer hover:brightness-110' : ''}`}
    >
      {arrow.display}
    </button>
  );
};

const ScoreSheetRow = ({ end, endNumber, totalEnds, isCurrent, onClickArrow }: { end: End, endNumber: number, totalEnds: number, isCurrent?: boolean, onClickArrow?: (arrow: ArrowShot, idx: number) => void }) => {
  const endScore = end.arrows.reduce((a, b) => a + b.value, 0);
  const endAvg = end.arrows.length > 0 ? (endScore / end.arrows.length).toFixed(1) : '-';

  return (
    <div className={`flex items-center justify-between py-3 border-b border-zinc-800 ${isCurrent ? 'bg-zinc-900/30 -mx-4 px-4 border-l-2 border-l-emerald-500' : ''}`}>
      <div className="w-12 text-zinc-500 font-mono text-sm">
        {endNumber}
      </div>
      <div className="flex-1 flex flex-wrap gap-2">
        {end.arrows.map((arrow, idx) => (
          <ArrowBadge key={idx} arrow={arrow} onClick={onClickArrow ? () => onClickArrow(arrow, idx) : undefined} size="sm" />
        ))}
      </div>
      <div className="text-right w-24">
        <div className="text-white font-bold">{endScore}</div>
        <div className="text-xs text-zinc-600">Avg {endAvg}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<Session[]>([]);
  const [range, setRange] = useState<'1W' | '1M' | '1Y' | 'ALL'>('1M');

  useEffect(() => {
    setHistory(getSessions());
  }, []);

  // Filter History
  const now = new Date();
  const filteredHistory = history.filter(s => {
    const date = new Date(s.date);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (range === '1W') return diffDays <= 7;
    if (range === '1M') return diffDays <= 30;
    if (range === '1Y') return diffDays <= 365;
    return true;
  });

  // Prepare chart data (Average Arrow)
  const chartData = filteredHistory
    .slice()
    .reverse()
    .map(s => {
      const { average } = calculateStats(s);
      return {
        name: new Date(s.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
        avg: parseFloat(average.toFixed(2)),
        id: s.id
      };
    });

  const totalArrowsAllTime = history.reduce((acc, s) => acc + calculateStats(s).totalArrows, 0);
  const globalAverage = totalArrowsAllTime > 0 
    ? (history.reduce((acc, s) => acc + calculateStats(s).totalScore, 0) / totalArrowsAllTime).toFixed(2) 
    : "0.00";

  return (
    <div className="p-6 space-y-6 pb-28">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400">Welcome back, Archer.</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
          A
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">All Time Avg</p>
          <p className="text-2xl font-bold text-white mt-1">{globalAverage}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Arrows</p>
          <p className="text-2xl font-bold text-white mt-1">{totalArrowsAllTime}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-zinc-400 text-sm font-medium">Arrow Average</h3>
             <div className="flex bg-zinc-800 rounded-lg p-0.5">
               {(['1W', '1M', '1Y', 'ALL'] as const).map(r => (
                 <button 
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${range === r ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                   {r}
                 </button>
               ))}
             </div>
           </div>
           <div className="h-48">
             {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} onClick={(data: any) => data && data.activePayload && navigate(`/summary/${data.activePayload[0].payload.id}`)}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={['dataMin - 1', 10]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} 
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: number) => [value, 'Avg Arrow']}
                    />
                    <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" activeDot={{r: 6}} />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No data for this period</div>
             )}
           </div>
      </div>

      {/* CTA */}
      <button 
        onClick={() => navigate('/new')}
        className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg shadow-lg shadow-white/10 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <Plus size={24} /> Start New Session
      </button>

      {/* Recent List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Recent Sessions</h3>
          <button onClick={() => navigate('/history')} className="text-emerald-500 text-sm">View All</button>
        </div>
        <div className="space-y-3">
          {history.slice(0, 5).map(s => {
            const { totalScore, average } = calculateStats(s);
            return (
              <button 
                key={s.id} 
                onClick={() => navigate(`/summary/${s.id}`)}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800 active:bg-zinc-800 transition-colors text-left"
              >
                <div>
                   <p className="text-white font-medium">{s.name || 'Practice Session'}</p>
                   <p className="text-xs text-zinc-500">{new Date(s.date).toLocaleDateString()} • {s.distance}m</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{totalScore}</p>
                  <p className="text-xs text-zinc-500">Avg {average.toFixed(1)}</p>
                </div>
              </button>
            );
          })}
          {history.length === 0 && <p className="text-zinc-600 text-center py-4">No sessions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
};

const SessionSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    const sessions = getSessions();
    const found = sessions.find(s => s.id === id);
    if (found) {
      setSession(found);
      setNotes(found.notes || "");
    }
  }, [id]);

  const handleSaveNotes = () => {
    if (!session) return;
    const updated = { ...session, notes };
    saveSession(updated);
    setSession(updated);
    setIsEditingNotes(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      if (session) deleteSession(session.id);
      navigate('/history');
    }
  };

  if (!session) return <div className="p-8 text-zinc-500">Loading...</div>;

  const { totalScore, totalArrows, average } = calculateStats(session);
  const xCount = session.ends.flatMap(e => e.arrows).filter(a => a.value === 10 && a.display === 'X').length;
  const tenCount = session.ends.flatMap(e => e.arrows).filter(a => a.value === 10).length;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 hover:text-white"><ChevronLeft /></button>
          <h1 className="text-xl font-bold text-white ml-2 truncate max-w-[200px]">{session.name}</h1>
        </div>
        <button onClick={handleDelete} className="text-red-500 text-xs uppercase tracking-wider font-bold">Delete</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <div className="text-xs text-zinc-500 uppercase">Score</div>
          <div className="text-2xl font-bold text-emerald-400">{totalScore}</div>
        </div>
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <div className="text-xs text-zinc-500 uppercase">Avg</div>
          <div className="text-2xl font-bold text-white">{average.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <div className="text-xs text-zinc-500 uppercase">10+X</div>
          <div className="text-2xl font-bold text-yellow-400">{tenCount}</div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-6">
        <div className="p-4 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-medium text-white">Score Sheet</h3>
          <span className="text-xs text-zinc-500">{session.ends.length} Ends • {session.distance}m</span>
        </div>
        <div className="p-4 space-y-1">
          {session.ends.map((end, i) => (
            <ScoreSheetRow key={end.id} end={end} endNumber={end.number} totalEnds={session.totalEnds} />
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-white flex items-center gap-2"><FileText size={16} /> Notes</h3>
          {!isEditingNotes && (
            <button onClick={() => setIsEditingNotes(true)} className="text-emerald-500 text-sm">Edit</button>
          )}
        </div>
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm min-h-[100px]"
              placeholder="Wind conditions, technique notes..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1 text-sm text-zinc-400">Cancel</button>
              <button onClick={handleSaveNotes} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm">Save</button>
            </div>
          </div>
        ) : (
          <p className="text-zinc-400 text-sm whitespace-pre-wrap min-h-[20px]">
            {session.notes || "No notes added."}
          </p>
        )}
      </div>
    </div>
  );
};

const ActiveSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentEndIndex, setCurrentEndIndex] = useState(0);
  const [currentArrows, setCurrentArrows] = useState<ArrowShot[]>([]);
  const [inputMode, setInputMode] = useState<'dial' | 'visual'>('dial');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Editing state
  const [editingArrow, setEditingArrow] = useState<{ endId: string | 'current', index: number } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessions = getSessions();
    const found = sessions.find(s => s.id === id);
    if (found) {
      setSession(found);
      setNotes(found.notes || "");
      if (found.ends.length < found.totalEnds) {
        setCurrentEndIndex(found.ends.length);
      } else if (found.isComplete) {
        navigate(`/summary/${found.id}`);
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  useEffect(() => {
    // Scroll to bottom when arrows change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentArrows, session?.ends.length]);

  const handleScore = (shot: ArrowShot) => {
    if (!session) return;

    // Handle Editing Mode
    if (editingArrow) {
      handleEditScore(shot);
      return;
    }
    
    // Handle Normal Scoring
    if (currentArrows.length >= session.arrowsPerEnd) return;

    const newArrows = [...currentArrows, shot];
    setCurrentArrows(newArrows);

    if (newArrows.length === session.arrowsPerEnd) {
      setTimeout(() => completeEnd(newArrows), 250);
    }
  };

  const handleEditScore = (shot: ArrowShot) => {
    if (!session || !editingArrow) return;

    if (editingArrow.endId === 'current') {
      // Editing arrow in current buffer
      const updated = [...currentArrows];
      updated[editingArrow.index] = shot;
      setCurrentArrows(updated);
    } else {
      // Editing arrow in past end
      const updatedEnds = session.ends.map(end => {
        if (end.id === editingArrow.endId) {
          const updatedArrows = [...end.arrows];
          updatedArrows[editingArrow.index] = shot;
          return { ...end, arrows: updatedArrows };
        }
        return end;
      });
      setSession({ ...session, ends: updatedEnds });
    }
    setEditingArrow(null);
  };

  const handleUndo = () => {
    if (editingArrow) {
      setEditingArrow(null);
      return;
    }
    setCurrentArrows(prev => prev.slice(0, -1));
  };

  const completeEnd = (arrows: ArrowShot[]) => {
    if (!session) return;

    const newEnd: End = {
      id: crypto.randomUUID(),
      number: currentEndIndex + 1,
      arrows: arrows
    };

    const updatedSession = {
      ...session,
      ends: [...session.ends, newEnd]
    };

    if (updatedSession.ends.length >= session.totalEnds) {
      updatedSession.isComplete = true;
      saveSession(updatedSession);
      navigate(`/summary/${updatedSession.id}`);
    } else {
      setSession(updatedSession);
      setCurrentArrows([]);
      setCurrentEndIndex(p => p + 1);
    }
  };

  const saveNotes = () => {
    if (session) {
      setSession({ ...session, notes });
    }
    setShowNotesModal(false);
  };

  const openEdit = (endId: string | 'current', index: number) => {
    setEditingArrow({ endId, index });
  };

  if (!session) return <div className="p-8 text-zinc-500">Loading...</div>;

  // Stats for active session
  const currentTotal = calculateSessionScore(session) + currentArrows.reduce((a,b)=>a+b.value, 0);
  const totalArrowsSoFar = session.ends.reduce((a,b)=>a+b.arrows.length,0) + currentArrows.length;
  const runningAvg = totalArrowsSoFar > 0 ? (currentTotal / totalArrowsSoFar).toFixed(1) : "0.0";

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-zinc-500 hover:text-white"><ChevronLeft /></button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-white text-sm">{session.name}</span>
          <span className="text-xs text-zinc-500">End {currentEndIndex + 1} of {session.totalEnds}</span>
        </div>
        <button onClick={() => setShowNotesModal(true)} className={`p-2 -mr-2 ${notes ? 'text-emerald-500' : 'text-zinc-500'}`}>
          <FileText size={20} />
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
        <div className="p-2 text-center border-r border-zinc-800">
           <div className="text-[10px] uppercase text-zinc-500">Total</div>
           <div className="text-lg font-bold text-emerald-500 leading-none">{currentTotal}</div>
        </div>
        <div className="p-2 text-center border-r border-zinc-800">
           <div className="text-[10px] uppercase text-zinc-500">Avg</div>
           <div className="text-lg font-bold text-white leading-none">{runningAvg}</div>
        </div>
        <div className="p-2 text-center">
           <div className="text-[10px] uppercase text-zinc-500">Rem</div>
           <div className="text-lg font-bold text-zinc-400 leading-none">{(session.totalEnds - currentEndIndex)}</div>
        </div>
      </div>

      {/* Running Score Sheet */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth">
        {session.ends.map((end) => (
          <ScoreSheetRow 
            key={end.id} 
            end={end} 
            endNumber={end.number} 
            totalEnds={session.totalEnds}
            onClickArrow={(arrow, idx) => openEdit(end.id, idx)}
          />
        ))}
        
        {/* Current End Placeholder / Active */}
        <div className={`flex items-center justify-between py-4 border-b border-zinc-800 bg-zinc-900/20 -mx-4 px-4 border-l-4 border-l-emerald-500 transition-all`}>
          <div className="w-12 text-emerald-500 font-mono font-bold text-lg">
            {currentEndIndex + 1}
          </div>
          <div className="flex-1 flex gap-2">
             {/* Render Current Arrows */}
             {currentArrows.map((arrow, idx) => (
                <ArrowBadge key={idx} arrow={arrow} onClick={() => openEdit('current', idx)} />
             ))}
             {/* Empty Slots */}
             {Array.from({length: Math.max(0, session.arrowsPerEnd - currentArrows.length)}).map((_, i) => (
               <div key={`empty-${i}`} className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-800 bg-zinc-900/50" />
             ))}
          </div>
          <div className="text-right w-16">
             <div className="text-zinc-500 text-sm">Current</div>
             <div className="text-emerald-400 font-bold">{currentArrows.reduce((a,b)=>a+b.value,0)}</div>
          </div>
        </div>

        <div className="h-4" /> {/* Spacer */}
      </div>

      {/* Control & Input Area */}
      <div className="bg-zinc-900 border-t border-zinc-800 shrink-0 safe-area-bottom">
        
        {/* View Toggles */}
        <div className="flex justify-center py-2 gap-4 border-b border-zinc-800/50">
           <button onClick={() => setInputMode('dial')} className={`p-1 px-4 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${inputMode === 'dial' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>Dial</button>
           <button onClick={() => setInputMode('visual')} className={`p-1 px-4 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${inputMode === 'visual' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>Face</button>
        </div>

        <div className="p-4 pb-6">
          {inputMode === 'dial' ? (
             <DialPad 
              onScore={handleScore} 
              onUndo={handleUndo} 
              canUndo={currentArrows.length > 0} 
             />
          ) : (
             <div className="h-64 w-full">
               <TargetVisual 
                  type={session.targetType} 
                  onScore={handleScore} 
                  lastShot={currentArrows[currentArrows.length - 1]}
                  existingShots={currentArrows}
               />
             </div>
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingArrow && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end p-4">
           <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-4 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">Edit Arrow</h3>
               <button onClick={() => setEditingArrow(null)} className="p-2 bg-zinc-800 rounded-full"><X size={20} /></button>
             </div>
             <DialPad 
                onScore={handleScore} 
                onUndo={() => setEditingArrow(null)} 
                canUndo={false} // Hide undo in edit mode
                className="w-full"
             />
             <p className="text-center text-zinc-500 mt-4 text-sm">Select new value for the arrow</p>
           </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-zinc-900 w-full max-w-sm rounded-2xl border border-zinc-800 p-4 shadow-2xl transform transition-all">
              <h3 className="text-lg font-bold text-white mb-4">Session Notes</h3>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white resize-none focus:border-emerald-500 outline-none"
                placeholder="Write your thoughts here..."
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowNotesModal(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium text-zinc-400">Cancel</button>
                <button onClick={saveNotes} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">Save Notes</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

// Reusing HistoryPage from previous code but updating items to be clickable
const HistoryPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  return (
    <div className="p-6 pb-24 bg-zinc-950 min-h-screen">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-zinc-400"><ChevronLeft /></button>
        <h1 className="text-2xl font-bold text-white ml-2">History</h1>
      </div>
      
      <div className="space-y-3">
        {sessions.map(s => {
           const { totalScore, average } = calculateStats(s);
           return (
            <button 
              key={s.id} 
              onClick={() => navigate(`/summary/${s.id}`)}
              className="w-full p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center active:bg-zinc-800 transition-colors text-left"
            >
              <div>
                 <p className="text-white font-bold text-lg">{s.name}</p>
                 <div className="flex gap-2 text-xs text-zinc-500 mt-1">
                   <span>{new Date(s.date).toLocaleDateString()}</span>
                   <span>•</span>
                   <span>{s.distance}m</span>
                   <span>•</span>
                   <span>{s.ends.reduce((acc,e)=>acc+e.arrows.length,0)} arrows</span>
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-2xl font-bold text-emerald-500">{totalScore}</span>
                 <span className="text-xs text-zinc-600">Avg {average.toFixed(1)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const NewSession = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    name: '',
    ends: DEFAULT_ENDS.toString(),
    arrows: DEFAULT_ARROWS_PER_END.toString(),
    distance: '18',
    type: TargetFaceType.WA_OUTDOOR
  });

  const handleStart = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      name: config.name || `Session ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      targetType: config.type,
      totalEnds: parseInt(config.ends) || 10,
      arrowsPerEnd: parseInt(config.arrows) || 3,
      distance: parseInt(config.distance) || 18,
      ends: [], // Start empty
      isComplete: false,
      notes: ''
    };
    saveSession(newSession);
    navigate(`/active/${newSession.id}`);
  };

  return (
    <div className="p-6 min-h-screen bg-zinc-950 flex flex-col">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400"><ChevronLeft /></button>
        <h1 className="text-2xl font-bold text-white ml-2">New Session</h1>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="text-zinc-400 text-sm uppercase tracking-wider">Session Name</label>
          <input 
            type="text" 
            value={config.name} 
            onChange={e => setConfig({...config, name: e.target.value})}
            placeholder="Evening Practice"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm uppercase tracking-wider">Ends</label>
            <input 
              type="number" 
              value={config.ends} 
              onChange={e => setConfig({...config, ends: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 text-center font-mono text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm uppercase tracking-wider">Arrows / End</label>
            <input 
              type="number" 
              value={config.arrows} 
              onChange={e => setConfig({...config, arrows: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 text-center font-mono text-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-zinc-400 text-sm uppercase tracking-wider">Distance (m)</label>
           <div className="grid grid-cols-4 gap-2">
             {['18', '30', '50', '70'].map(d => (
               <button 
                key={d} 
                onClick={() => setConfig({...config, distance: d})}
                className={`p-3 rounded-lg font-medium border ${config.distance === d ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
               >
                 {d}m
               </button>
             ))}
           </div>
        </div>
      </div>

      <button 
        onClick={handleStart}
        className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold text-lg mt-8 active:scale-[0.98] transition-transform"
      >
        Start Scoring
      </button>
    </div>
  );
};

// --- Main Layout & Router ---

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new" element={<NewSession />} />
          <Route path="/active/:id" element={<ActiveSession />} />
          <Route path="/summary/:id" element={<SessionSummary />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
        
        {/* Navigation Bar (Only visible on Dashboard and History) */}
        <Routes>
          <Route path="/dashboard" element={<NavBar active="home" />} />
          <Route path="/history" element={<NavBar active="history" />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

const NavBar = ({ active }: { active: string }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-6 left-6 right-6 bg-zinc-900/90 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl flex justify-around items-center p-4 z-50">
      <button 
        onClick={() => navigate('/dashboard')}
        className={`flex flex-col items-center gap-1 ${active === 'home' ? 'text-emerald-400' : 'text-zinc-500'}`}
      >
        <BarChart2 size={24} />
      </button>
      <button 
         onClick={() => navigate('/new')}
         className="bg-emerald-500 text-black p-4 rounded-full shadow-lg shadow-emerald-500/20 -mt-8 border-4 border-zinc-950 transform transition-transform active:scale-95"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
      <button 
         onClick={() => navigate('/history')}
        className={`flex flex-col items-center gap-1 ${active === 'history' ? 'text-emerald-400' : 'text-zinc-500'}`}
      >
        <History size={24} />
      </button>
    </div>
  );
};

export default App;