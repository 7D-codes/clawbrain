'use client';

import { Plus, FileText, Search, Sparkles } from 'lucide-react';

export function QuickActions() {
  const actions = [
    { icon: Plus, label: 'New Note', color: '#22d3ee', href: '#' },
    { icon: Sparkles, label: 'Create Mission', color: '#a78bfa', href: '#' },
    { icon: FileText, label: 'View PARA', color: '#10b981', href: '#' },
    { icon: Search, label: 'QMD Search', color: '#f59e0b', href: '#' },
  ];

  return (
    <div style={cardStyle}>
      <div style={{ ...headerStyle, borderColor: '#6366f1' }}>
        <Sparkles size={18} color="#6366f1" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Quick Actions</h3>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: 12,
        marginTop: 12
      }}>
        {actions.map((action, i) => (
          <button
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16,
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 8,
              color: '#e4e4e7',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3f3f46';
              e.currentTarget.style.borderColor = action.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#27272a';
              e.currentTarget.style.borderColor = '#3f3f46';
            }}
          >
            <action.icon size={20} color={action.color} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{action.label}</span>
          </button>
        ))}
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
