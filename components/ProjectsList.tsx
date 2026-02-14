'use client';

import { Project } from '@/lib/memory';
import { FolderGit2, ArrowUpRight } from 'lucide-react';

interface ProjectsListProps {
  projects: Project[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 5);
  
  return (
    <div style={cardStyle}>
      <div style={{ ...headerStyle, borderColor: '#10b981' }}>
        <FolderGit2 size={18} color="#10b981" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Projects</h3>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#71717a' }}>
          {activeProjects.length} active
        </span>
      </div>
      
      <div style={{ marginTop: 12 }}>
        {activeProjects.length === 0 ? (
          <p style={{ color: '#71717a', fontStyle: 'italic' }}>No active projects</p>
        ) : (
          activeProjects.map(project => (
            <div key={project.id} style={projectItemStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: '#10b981',
                  flexShrink: 0
                }} />
                <span style={{ fontWeight: 500, fontSize: 14 }}>{project.name}</span>
                <ArrowUpRight size={14} color="#71717a" />
              </div>
              <p style={{ margin: '4px 0 0 16px', fontSize: 12, color: '#a1a1aa', lineHeight: 1.4 }}>
                {project.summary.slice(0, 80)}...
              </p>
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

const projectItemStyle: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: '1px solid #27272a',
};
