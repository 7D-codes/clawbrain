'use client';

import { DailyNote } from '@/lib/memory';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DailyCardProps {
  title: string;
  note: DailyNote | null;
  accent?: string;
}

export function DailyCard({ title, note, accent = '#22d3ee' }: DailyCardProps) {
  if (!note) {
    return (
      <div style={cardStyle}>
        <div style={{ ...headerStyle, borderColor: accent }}>
          <Calendar size={18} color={accent} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
        </div>
        <p style={{ color: '#71717a', fontStyle: 'italic' }}>No entry yet</p>
      </div>
    );
  }

  // Extract first line as preview
  const preview = note.content.split('\n').find(line => line.trim() && !line.startsWith('#')) || '';
  
  return (
    <div style={cardStyle}>
      <div style={{ ...headerStyle, borderColor: accent }}>
        <Calendar size={18} color={accent} />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          {title} — {format(note.date, 'MMM d')}
        </h3>
      </div>
      
      <div style={{ marginTop: 12 }}>
        <p style={{ margin: 0, color: '#a1a1aa', lineHeight: 1.5, fontSize: 14 }}>
          {preview.slice(0, 120)}...
        </p>
      </div>
      
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <span style={badgeStyle}>
          <FileText size={12} />
          {note.id}
        </span>
      </div>
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

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  background: '#27272a',
  borderRadius: 4,
  fontSize: 12,
  color: '#a1a1aa',
};
