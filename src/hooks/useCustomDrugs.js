import { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api/custom-drugs';

export function useCustomDrugs() {
  const [drugs, setDrugs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => { setDrugs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function addDrug(drug) {
    const res  = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(drug),
    });
    const saved = await res.json();
    setDrugs(prev => [...prev, saved]);
    return saved;
  }

  async function deleteDrug(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    setDrugs(prev => prev.filter(d => d.id !== id));
  }

  return { drugs, loading, addDrug, deleteDrug };
}
