import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- ★あなたのSupabase情報をここに書き換える★ ---
const SUPABASE_URL = 'https://heijdrtigydbeszyfoll.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eoS3X-CVN9hStOFrEaRCHA_mC1TDeLX';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [setNumber, setSetNumber] = useState(1);
  const [lastLogs, setLastLogs] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchExercises();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      fetchLastLogs(selectedExercise);
    } else {
      setLastLogs([]);
    }
  }, [selectedExercise]);

  const fetchExercises = async () => {
    const { data } = await supabase.from('exercises').select('*').order('name');
    if (data) setExercises(data);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('workout_logs')
      .select('*, exercises(name)')
      .order('date', { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  const fetchLastLogs = async (exerciseId) => {
    const { data: latestLog } = await supabase
      .from('workout_logs')
      .select('date')
      .eq('exercise_id', exerciseId)
      .order('date', { ascending: false })
      .limit(1);

    if (latestLog && latestLog.length > 0) {
      const lastDate = latestLog[0].date;
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('date', lastDate)
        .order('set_number', { ascending: true });
      
      setLastLogs(logs || []);
      if (logs && logs.length > 0) {
        setSetNumber(logs.length + 1);
      }
    } else {
      setLastLogs([]);
      setSetNumber(1);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedExercise || !weight || !reps) return;

    const { error } = await supabase.from('workout_logs').insert([
      {
        exercise_id: selectedExercise,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        set_number: parseInt(setNumber),
        date: date,
      },
    ]);

    if (error) {
      alert('保存に失敗しました: ' + error.message);
    } else {
      alert('保存しました！');
      setSetNumber(prev => prev + 1);
      fetchHistory();
      fetchLastLogs(selectedExercise);
    }
  };

  const copyLastSet = (log) => {
    setWeight(log.weight);
    setReps(log.reps);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 max-w-md mx-auto font-sans">
      <h1 className="text-xl font-bold mb-4 text-center text-orange-400">⚡ 筋トレ記録</h1>

      <form onSubmit={handleSave} className="bg-gray-900 p-4 rounded-2xl shadow-lg mb-6 space-y-4 border border-gray-800">
        <div>
          <label className="block text-xs text-gray-400 mb-1">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">種目</label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
          >
            <option value="">種目を選んでください</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>

        {lastLogs.length > 0 && (
          <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700">
            <p className="text-xs text-orange-400 font-semibold mb-2">💡 前回の記録 ({lastLogs[0].date})</p>
            <div className="space-y-1">
              {lastLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center text-sm bg-gray-900/50 p-2 rounded-lg">
                  <span>{log.set_number}セット目: <strong>{log.weight}kg</strong> × {log.reps}回</span>
                  <button
                    type="button"
                    onClick={() => copyLastSet(log)}
                    className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded-md"
                  >
                    コピー
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">セット数</label>
            <input
              type="number"
              value={setNumber}
              onChange={(e) => setSetNumber(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-center"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">重量 (kg)</label>
            <input
              type="number"
              step="0.5"
              placeholder="80"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-center text-lg font-bold"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">回数 (reps)</label>
            <input
              type="number"
              placeholder="10"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-center text-lg font-bold"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-3 rounded-xl transition shadow-lg"
        >
          記録を保存する
        </button>
      </form>

      <h2 className="text-sm font-bold text-gray-400 mb-2">直近の履歴</h2>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="bg-gray-900 p-3 rounded-xl flex justify-between items-center border border-gray-800 text-sm">
            <div>
              <span className="text-gray-400 text-xs mr-2">{h.date}</span>
              <span className="font-bold text-white">{h.exercises?.name}</span>
            </div>
            <div className="text-orange-400 font-bold">
              {h.set_number}set: {h.weight}kg × {h.reps}回
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}