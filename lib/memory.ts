import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

const CLAWD_DIR = '/Users/mac/clawd';
const LIFE_DIR = '/Users/mac/life/areas';

export interface DailyNote {
  id: string;
  date: Date;
  title: string;
  content: string;
  isToday: boolean;
  isYesterday: boolean;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  status: 'active' | 'paused' | 'completed';
  lastUpdated: Date;
}

export interface Person {
  id: string;
  name: string;
  summary: string;
  relationship: string;
}

export interface OvernightWork {
  date: Date;
  content: string;
  tasksCompleted: string[];
}

export interface DashboardData {
  today: DailyNote | null;
  yesterday: DailyNote | null;
  recentNotes: DailyNote[];
  projects: Project[];
  people: Person[];
  overnight: OvernightWork | null;
}

export function getDailyNotes(): DailyNote[] {
  const memoryDir = path.join(CLAWD_DIR, 'memory');
  if (!fs.existsSync(memoryDir)) return [];
  
  const files = fs.readdirSync(memoryDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('.'))
    .sort().reverse();
  
  return files.map(file => {
    const filePath = path.join(memoryDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    
    // Parse date from filename (YYYY-MM-DD or YYYY-MM-DD-HHMM)
    const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? parseISO(dateMatch[1]) : new Date();
    
    return {
      id: file,
      date,
      title: data.title || file.replace('.md', ''),
      content: body,
      isToday: isToday(date),
      isYesterday: isYesterday(date)
    };
  });
}

export function getProjects(): Project[] {
  const projectsDir = path.join(LIFE_DIR, 'projects');
  if (!fs.existsSync(projectsDir)) return [];
  
  const projects: Project[] = [];
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const summaryPath = path.join(projectsDir, entry.name, 'summary.md');
      if (fs.existsSync(summaryPath)) {
        const content = fs.readFileSync(summaryPath, 'utf-8');
        const { data, content: body } = matter(content);
        
        projects.push({
          id: entry.name,
          name: data.title || entry.name,
          summary: body.slice(0, 200) + '...',
          status: data.status || 'active',
          lastUpdated: fs.statSync(summaryPath).mtime
        });
      }
    }
  }
  
  return projects;
}

export function getPeople(): Person[] {
  const peopleDir = path.join(LIFE_DIR, 'people');
  if (!fs.existsSync(peopleDir)) return [];
  
  const people: Person[] = [];
  const entries = fs.readdirSync(peopleDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const summaryPath = path.join(peopleDir, entry.name, 'summary.md');
      if (fs.existsSync(summaryPath)) {
        const content = fs.readFileSync(summaryPath, 'utf-8');
        const { data, content: body } = matter(content);
        
        people.push({
          id: entry.name,
          name: data.name || entry.name,
          summary: body.slice(0, 150) + '...',
          relationship: data.relationship || 'contact'
        });
      }
    }
  }
  
  return people;
}

export function getOvernightWork(): OvernightWork | null {
  const overnightDir = path.join(CLAWD_DIR, 'memory', 'overnight');
  if (!fs.existsSync(overnightDir)) return null;
  
  const files = fs.readdirSync(overnightDir)
    .filter(f => f.endsWith('.md'))
    .sort().reverse();
  
  if (files.length === 0) return null;
  
  const latestFile = files[0];
  const content = fs.readFileSync(path.join(overnightDir, latestFile), 'utf-8');
  
  // Extract tasks completed
  const taskMatches = content.match(/- \[x\] (.+)/g) || [];
  const tasksCompleted = taskMatches.map(t => t.replace('- [x] ', ''));
  
  const dateMatch = latestFile.match(/(\d{4}-\d{2}-\d{2})/);
  
  return {
    date: dateMatch ? parseISO(dateMatch[1]) : new Date(),
    content,
    tasksCompleted
  };
}

export function getDashboardData(): DashboardData {
  const notes = getDailyNotes();
  
  return {
    today: notes.find(n => n.isToday) || null,
    yesterday: notes.find(n => n.isYesterday) || null,
    recentNotes: notes.slice(0, 7),
    projects: getProjects(),
    people: getPeople(),
    overnight: getOvernightWork()
  };
}
