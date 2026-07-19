import { useEffect, useState } from 'react';
import { useApi } from '../lib/api.js';
import { colors, page, panel } from '../theme.js';

export default function BadgesPage() {
  const api = useApi();
  const [mine, setMine] = useState(null);
  const [all, setAll] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/api/badges/mine'), api('/api/badges')])
      .then(([mineData, allData]) => {
        setMine(mineData);
        setAll(allData);
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const earnedIds = new Set((mine ?? []).map((b) => b.id));

  return (
    <div style={page}>
      <h1>Badges</h1>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {all?.map((badge) => (
          <div key={badge.id} style={{ ...panel, opacity: earnedIds.has(badge.id) ? 1 : 0.4, textAlign: 'center' }}>
            <div style={{ fontSize: '32px' }}>{badge.icon}</div>
            <strong>{badge.name}</strong>
            <div style={{ color: colors.muted, fontSize: '12px' }}>{badge.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
