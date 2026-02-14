'use client';

import { Person } from '@/lib/memory';
import { Users } from 'lucide-react';

interface PeopleListProps {
  people: Person[];
}

export function PeopleList({ people }: PeopleListProps) {
  const recentPeople = people.slice(0, 4);
  
  return (
    <div style={cardStyle}>
      <div style={{ ...headerStyle, borderColor: '#f472b6' }}>
        <Users size={18} color="#f472b6" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>People</h3>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#71717a' }}>
          {people.length} contacts
        </span>
      </div>
      
      <div style={{ marginTop: 12 }}>
        {recentPeople.length === 0 ? (
          <p style={{ color: '#71717a', fontStyle: 'italic' }}>No people in knowledge graph</p>
        ) : (
          recentPeople.map(person => (
            <div key={person.id} style={personItemStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff'
                }}>
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{person.name}</span>
                  <p style={{ margin: 0, fontSize: 11, color: '#71717a' }}>
                    {person.relationship}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
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

const personItemStyle: React.CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #27272a',
};
