import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { Plus, History, BarChart2, ChevronLeft, ArrowRight, FileText, X, RotateCcw, Undo2, Edit2, Target, List } from 'lucide-react';
import { Session, End, ArrowShot, TargetFaceType } from './types';
import { DEFAULT_ARROWS_PER_END, DEFAULT_ENDS } from './constants';
import { saveSession, getSessions, calculateSessionScore, deleteSession, updateSession } from './services/storage';
import TargetVisual from './components/TargetVisual';
import DialPad from './components/DialPad';
import SwipeableRow from './components/SwipeableRow';
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
      <div className="w-8 text-zinc-500 font-mono text-sm text-center">
        {endNumber}
      </div>
      <div className="flex-1 flex flex-wrap gap-1.5 px-2">
        {end.arrows.map((arrow, idx) => (
          <ArrowBadge key={idx} arrow={arrow} onClick={onClickArrow ? () => onClickArrow(arrow, idx) : undefined} size="sm" />
        ))}
      </div>
      <div className="text-right w-20">
        <div className="text-white font-bold">{endScore}</div>
        <div className="text-[10px] text-zinc-600 uppercase">Avg {endAvg}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<Session[]>([]);
  const [range, setRange] = useState<'1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');

  const loadHistory = () => {
    setHistory(getSessions());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this session?')) {
      deleteSession(id);
      loadHistory(); // Force re-render
    }
  };

  // Filter History
  const now = new Date();
  const filteredHistory = history.filter(s => {
    const date = new Date(s.date);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (range === '1W') return diffDays <= 7;
    if (range === '1M') return diffDays <= 30;
    if (range === '3M') return diffDays <= 90;
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
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/20">
          A
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-sm">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">All Time Avg</p>
          <p className="text-2xl font-bold text-white mt-1">{globalAverage}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-sm">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Arrows</p>
          <p className="text-2xl font-bold text-white mt-1">{totalArrowsAllTime}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-4 shadow-sm">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-zinc-400 text-sm font-medium">Progression (Avg Arrow)</h3>
             <div className="flex bg-zinc-800 rounded-lg p-0.5">
               {(['1W', '1M', '3M', '1Y', 'ALL'] as const).map(r => (
                 <button 
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${range === r ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
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
          <button onClick={() => navigate('/history')} className="text-emerald-500 text-sm font-medium">View All</button>
        </div>
        <div className="space-y-3">
          {history.slice(0, 5).map(s => {
            const { totalScore, average } = calculateStats(s);
            return (
              <SwipeableRow key={s.id} onDelete={() => handleDelete(s.id)}>
                <button 
                  onClick={() => navigate(`/summary/${s.id}`)}
                  className="w-full flex items-center justify-between p-4 active:bg-zinc-800 transition-colors text-left group"
                >
                  <div>
                     <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">{s.name || 'Practice Session'}</p>
                     <p className="text-xs text-zinc-500">{new Date(s.date).toLocaleDateString()} • {s.distance}m</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{totalScore}</p>
                    <p className="text-xs text-zinc-500">Avg {average.toFixed(1)}</p>
                  </div>
                </button>
              </SwipeableRow>
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
  const [viewMode, setViewMode] = useState<'list' | 'target'>('list');
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit State
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    const sessions = getSessions();
    const found = sessions.find(s => s.id === id);
    if (found) {
      setSession(found);
      setEditName(found.name);
      setEditNote(found.notes || '');
    }
  }, [id]);

  const handleSaveEdit = () => {
    if (!session) return;
    const updated = updateSession(session.id, { name: editName, notes: editNote });
    if (updated) {
       setSession(updated);
       setShowEditModal(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      if (session) deleteSession(session.id);
      navigate('/history', { replace: true });
    }
  };

  if (!session) return <div className="p-8 text-zinc-500">Loading...</div>;

  const { totalScore, totalArrows, average } = calculateStats(session);
  const tenCount = session.ends.flatMap(e => e.arrows).filter(a => a.value === 10).length;
  const allArrows = session.ends.flatMap(e => e.arrows);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate('/history')} className="p-2 -ml-2 text-zinc-400 hover:text-white"><ChevronLeft /></button>
          <div className="ml-2">
            <h1 className="text-xl font-bold text-white truncate max-w-[200px]" onClick={() => setShowEditModal(true)}>{session.name}</h1>
            <div className="text-xs text-zinc-500">{new Date(session.date).toLocaleDateString()} • {session.distance}m</div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowEditModal(true)} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white"><Edit2 size={18} /></button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Score</div>
          <div className="text-2xl font-bold text-emerald-400">{totalScore}</div>
        </div>
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Avg</div>
          <div className="text-2xl font-bold text-white">{average.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">10+X</div>
          <div className="text-2xl font-bold text-yellow-400">{tenCount}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 w-fit mx-auto">
        <button 
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <List size={16} /> Score Sheet
        </button>
        <button 
          onClick={() => setViewMode('target')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'target' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Target size={16} /> Point Cloud
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-6">
          <div className="p-4 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-medium text-white">Ends</h3>
            <span className="text-xs text-zinc-500">{session.ends.length} Ends</span>
          </div>
          <div className="p-4 space-y-1 max-h-96 overflow-y-auto">
            {session.ends.map((end, i) => (
              <ScoreSheetRow key={end.id} end={end} endNumber={end.number} totalEnds={session.totalEnds} />
            ))}
          </div>
        </div>
      ) : (
        <div className="aspect-square w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-6 relative flex items-center justify-center">
           <div className="w-full h-full">
              <TargetVisual type={session.targetType} existingShots={allArrows} readOnly />
           </div>
           <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-white pointer-events-none">
              {allArrows.length} Shots
           </div>
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-white flex items-center gap-2"><FileText size={16} /> Notes</h3>
        </div>
        <p className="text-zinc-400 text-sm whitespace-pre-wrap min-h-[20px]">
          {session.notes || "No notes added."}
        </p>
      </div>

      <div className="mt-8 text-center">
         <button onClick={handleDelete} className="text-red-500 text-sm font-medium px-4 py-2 hover:bg-red-500/10 rounded-lg transition-colors">
            Delete Session
         </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-zinc-900 w-full max-w-sm rounded-2xl border border-zinc-800 p-4 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-white mb-4">Edit Session</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase text-zinc-500 font-bold">Name</label>
                  <input 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-zinc-500 font-bold">Notes</label>
                  <textarea 
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    className="w-full h-24 bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white resize-none focus:border-emerald-500 outline-none mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium text-zinc-400">Cancel</button>
                <button onClick={handleSaveEdit} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">Save Changes</button>
              </div>
           </div>
        </div>
      )}
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
  const [editInputMode, setEditInputMode] = useState<'dial' | 'visual'>('dial');

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
        navigate(`/summary/${found.id}`, { replace: true });
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentArrows, session?.ends.length, inputMode]);

  const handleScore = (shot: ArrowShot) => {
    if (!session) return;

    if (editingArrow) {
      handleEditScore(shot);
      return;
    }
    
    if (currentArrows.length >= session.arrowsPerEnd) return;

    const newArrows = [...currentArrows, shot];
    setCurrentArrows(newArrows);

    if (newArrows.length === session.arrowsPerEnd) {
      setTimeout(() => completeEnd(newArrows), 300); // Slightly longer delay to allow visual feedback
    }
  };

  const handleEditScore = (shot: ArrowShot) => {
    if (!session || !editingArrow) return;

    if (editingArrow.endId === 'current') {
      const updated = [...currentArrows];
      updated[editingArrow.index] = shot;
      setCurrentArrows(updated);
    } else {
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
      navigate(`/summary/${updatedSession.id}`, { replace: true });
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
    setEditInputMode(inputMode); // Default to current mode, or 'dial'
  };

  if (!session) return <div className="p-8 text-zinc-500">Loading...</div>;

  const currentTotal = calculateSessionScore(session) + currentArrows.reduce((a,b)=>a+b.value, 0);
  const totalArrowsSoFar = session.ends.reduce((a,b)=>a+b.arrows.length,0) + currentArrows.length;
  const runningAvg = totalArrowsSoFar > 0 ? (currentTotal / totalArrowsSoFar).toFixed(1) : "0.0";

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-zinc-500 hover:text-white"><ChevronLeft /></button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-white text-sm">{session.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">End {currentEndIndex + 1} / {session.totalEnds}</span>
        </div>
        <button onClick={() => setShowNotesModal(true)} className={`p-2 -mr-2 ${notes ? 'text-emerald-500' : 'text-zinc-500'}`}>
          <FileText size={20} />
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
        <div className="p-2 text-center border-r border-zinc-800">
           <div className="text-[10px] uppercase text-zinc-500 font-bold">Total</div>
           <div className="text-lg font-bold text-emerald-500 leading-none">{currentTotal}</div>
        </div>
        <div className="p-2 text-center border-r border-zinc-800">
           <div className="text-[10px] uppercase text-zinc-500 font-bold">Avg</div>
           <div className="text-lg font-bold text-white leading-none">{runningAvg}</div>
        </div>
        <div className="p-2 text-center">
           <div className="text-[10px] uppercase text-zinc-500 font-bold">Remaining</div>
           <div className="text-lg font-bold text-zinc-400 leading-none">{(session.totalEnds - currentEndIndex)}</div>
        </div>
      </div>

      {/* Running Score Sheet */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 scroll-smooth bg-zinc-950 relative">
        {session.ends.map((end) => (
          <ScoreSheetRow 
            key={end.id} 
            end={end} 
            endNumber={end.number} 
            totalEnds={session.totalEnds}
            onClickArrow={(arrow, idx) => openEdit(end.id, idx)}
          />
        ))}
        
        <div className={`flex items-center justify-between py-3 border-b border-zinc-800 bg-zinc-900/30 -mx-2 px-2 border-l-2 border-l-emerald-500 transition-all mt-2`}>
          <div className="w-8 text-emerald-500 font-mono font-bold text-lg text-center">
            {currentEndIndex + 1}
          </div>
          <div className="flex-1 flex gap-2 px-2">
             {currentArrows.map((arrow, idx) => (
                <ArrowBadge key={idx} arrow={arrow} onClick={() => openEdit('current', idx)} />
             ))}
             {Array.from({length: Math.max(0, session.arrowsPerEnd - currentArrows.length)}).map((_, i) => (
               <div key={`empty-${i}`} className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-800 bg-zinc-900/50" />
             ))}
          </div>
          <div className="text-right w-16">
             <div className="text-[10px] text-zinc-500 uppercase">Current</div>
             <div className="text-emerald-400 font-bold">{currentArrows.reduce((a,b)=>a+b.value,0)}</div>
          </div>
        </div>
        
        <div className="h-4"></div>
      </div>

      {/* Control Area */}
      <div className="bg-zinc-900 border-t border-zinc-800 shrink-0 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-20">
        
        <div className="flex justify-between items-center py-2 px-4 border-b border-zinc-800/50">
           <button 
            onClick={handleUndo} 
            disabled={currentArrows.length === 0}
            className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${currentArrows.length > 0 ? 'text-zinc-300 bg-zinc-800 hover:bg-zinc-700' : 'text-zinc-600 bg-zinc-800/50 cursor-not-allowed'}`}
           >
             <Undo2 size={16} /> Undo
           </button>
           
           <div className="flex bg-zinc-800 p-1 rounded-lg">
             <button 
               onClick={() => setInputMode('dial')} 
               className={`px-4 py-1 text-xs font-bold uppercase rounded-md transition-all ${inputMode === 'dial' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500'}`}
             >
               Dial
             </button>
             <button 
               onClick={() => setInputMode('visual')} 
               className={`px-4 py-1 text-xs font-bold uppercase rounded-md transition-all ${inputMode === 'visual' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500'}`}
             >
               Face
             </button>
           </div>
           
           <div className="w-16"></div>
        </div>

        <div className="p-2 pb-6 bg-zinc-900">
          {inputMode === 'dial' ? (
             <DialPad onScore={handleScore} className="max-w-md mx-auto" />
          ) : (
             <div className="h-60 w-full max-w-md mx-auto">
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

      {/* Edit Modal */}
      {editingArrow && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
           <div className="bg-zinc-900 rounded-t-2xl border-t border-zinc-800 p-6 shadow-2xl animate-[slideUp_0.2s_ease-out] max-h-[80vh] flex flex-col">
             <div className="flex justify-between items-center mb-4 shrink-0">
               <h3 className="text-xl font-bold text-white">Edit Arrow</h3>
               <div className="flex bg-zinc-800 p-1 rounded-lg">
                  <button onClick={() => setEditInputMode('dial')} className={`px-3 py-1 text-xs font-bold rounded-md ${editInputMode === 'dial' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>DIAL</button>
                  <button onClick={() => setEditInputMode('visual')} className={`px-3 py-1 text-xs font-bold rounded-md ${editInputMode === 'visual' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>FACE</button>
               </div>
               <button onClick={() => setEditingArrow(null)} className="p-2 bg-zinc-800 rounded-full"><X size={20} /></button>
             </div>
             
             <div className="flex-1 overflow-hidden flex flex-col justify-center">
               {editInputMode === 'dial' ? (
                 <DialPad onScore={handleScore} className="w-full mb-4" />
               ) : (
                 <div className="aspect-square w-full max-w-md mx-auto mb-4">
                   <TargetVisual 
                      type={session.targetType}
                      onScore={handleScore}
                   />
                 </div>
               )}
             </div>
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

const HistoryPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadHistory = () => {
    setSessions(getSessions());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this session?')) {
      deleteSession(id);
      loadHistory();
    }
  };

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
             <SwipeableRow key={s.id} onDelete={() => handleDelete(s.id)}>
              <button 
                onClick={() => navigate(`/summary/${s.id}`)}
                className="w-full p-4 flex justify-between items-center active:bg-zinc-800 transition-colors text-left group"
              >
                <div>
                   <p className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">{s.name}</p>
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
            </SwipeableRow>
          );
        })}
        {sessions.length === 0 && <p className="text-zinc-600 text-center py-8">No history yet.</p>}
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
    type: TargetFaceType.WA_OUTDOOR,
    notes: ''
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
      notes: config.notes
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

      <div className="space-y-6 flex-1 overflow-y-auto pb-8">
        <div className="space-y-2">
          <label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Session Name</label>
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
            <label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Ends</label>
            <input 
              type="number" 
              value={config.ends} 
              onChange={e => setConfig({...config, ends: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 text-center font-mono text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Arrows / End</label>
            <input 
              type="number" 
              value={config.arrows} 
              onChange={e => setConfig({...config, arrows: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 text-center font-mono text-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Distance (m)</label>
           <div className="grid grid-cols-4 gap-2">
             {['18', '30', '50', '70'].map(d => (
               <button 
                key={d} 
                onClick={() => setConfig({...config, distance: d})}
                className={`p-3 rounded-lg font-medium border transition-all ${config.distance === d ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
               >
                 {d}m
               </button>
             ))}
           </div>
        </div>

        <div className="space-y-2">
          <label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Initial Notes</label>
          <textarea 
            value={config.notes} 
            onChange={e => setConfig({...config, notes: e.target.value})}
            placeholder="Weather, equipment setup, goals..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors min-h-[100px]"
          />
        </div>
      </div>

      <button 
        onClick={handleStart}
        className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold text-lg mt-4 active:scale-[0.98] transition-transform shadow-lg shadow-emerald-500/20"
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
        className={`flex flex-col items-center gap-1 transition-colors ${active === 'home' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <BarChart2 size={24} />
      </button>
      <button 
         onClick={() => navigate('/new')}
         className="bg-emerald-500 text-black p-4 rounded-full shadow-lg shadow-emerald-500/20 -mt-8 border-4 border-zinc-950 transform transition-transform active:scale-95 hover:bg-emerald-400"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
      <button 
         onClick={() => navigate('/history')}
        className={`flex flex-col items-center gap-1 transition-colors ${active === 'history' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <History size={24} />
      </button>
    </div>
  );
};

export default App;