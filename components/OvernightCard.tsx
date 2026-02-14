'use client';

import { OvernightWork } from '@/lib/memory';
import { Moon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface OvernightCardProps {
  work: OvernightWork | null;
}

export function OvernightCard({ work }: OvernightCardProps) {
  if (!work) {
    return (
      <div style={cardStyle}>
        <div style={{ ...headerStyle, borderColor: '#f59e0b' }}>
          <Moon size={18} color="#f59e0b" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Overnight Work</h3>
        </div>
        <p style={{ color: '#71717a', fontStyle: 'italic' }}>No overnight work logged</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ ...headerStyle, borderColor: '#f59e0b' }}>
        <Moon size={18} color="#f59e0b" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Overnight Work — {format(work.date, 'MMM d')}
        </h3>
      </div>
      
      {work.tasksCompleted.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Completed
          </p>
          {work.tasksCompleted.slice(0, 4).map((task, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <CheckCircle2 size={14} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.4 }}>{task}</span>
            </div>
          ))}
          {work.tasksCompleted.length > 4 && (
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#71717a' }}>
              +{work.tasksCompleted.length - 4} more tasks
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 12,
  padding: 20,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingBottom: 12,
  borderBottom: '2px solid',
};
