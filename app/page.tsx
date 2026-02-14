import { getDashboardData } from '@/lib/memory';
import { DailyCard } from '@/components/DailyCard';
import { ProjectsList } from '@/components/ProjectsList';
import { PeopleList } from '@/components/PeopleList';
import { OvernightCard } from '@/components/OvernightCard';
import { QuickActions } from '@/components/QuickActions';
import { SearchBar } from '@/components/SearchBar';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function Dashboard() {
  const data = getDashboardData();
  
  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #22d3ee, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ClawBrain
        </h1>
        <p style={{ color: '#71717a', margin: '8px 0 0 0' }}>
          Your AI command center. Memory synced. Ready to work.
        </p>
      </header>

      {/* Search */}
      <SearchBar />

      {/* Main Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: 24,
        marginTop: 24
      }}>
        {/* Today's Focus */}
        <DailyCard 
          title="Today" 
          note={data.today} 
          accent="#22d3ee"
        />
        
        {/* Overnight Work */}
        <OvernightCard work={data.overnight} />
        
        {/* Quick Actions */}
        <QuickActions />
        
        {/* Active Projects */}
        <ProjectsList projects={data.projects} />
        
        {/* People */}
        <PeopleList people={data.people} />
        
        {/* Recent Notes */}
        <DailyCard 
          title="Yesterday" 
          note={data.yesterday}
          accent="#a78bfa"
        />
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #27272a', color: '#52525b', fontSize: 14 }}>
        <p>Synced with ~/clawd/memory/ • {data.recentNotes.length} notes indexed</p>
      </footer>

      {/* Connection Status */}
      <ConnectionStatus />
    </main>
  );
}
