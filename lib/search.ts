import { execSync } from 'child_process';

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  type: 'memory' | 'project' | 'person';
  path: string;
  score: number;
}

function parseQmdOutput(output: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  try {
    // QMD outputs a JSON array
    const items = JSON.parse(output);
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.docid) {
          results.push({
            id: item.docid,
            title: item.title || item.file?.split('/').pop()?.replace('.md', '') || 'Untitled',
            snippet: item.snippet || item.text?.slice(0, 150) || '',
            type: item.file?.includes('projects') ? 'project' : 
                  item.file?.includes('people') ? 'person' : 'memory',
            path: item.file || item.docid,
            score: item.score || item.similarity || 0
          });
        }
      }
    }
  } catch (e) {
    // Try JSON lines format as fallback
    const lines = output.trim().split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.docid) {
          results.push({
            id: item.docid,
            title: item.title || item.file?.split('/').pop()?.replace('.md', '') || 'Untitled',
            snippet: item.snippet || '',
            type: item.file?.includes('projects') ? 'project' : 
                  item.file?.includes('people') ? 'person' : 'memory',
            path: item.file || item.docid,
            score: item.score || item.similarity || 0
          });
        }
      } catch {
        // Skip invalid lines
      }
    }
  }
  
  return results;
}

export function searchMemory(query: string, limit: number = 10): SearchResult[] {
  if (!query || query.length < 2) return [];
  
  try {
    const cmd = `export PATH="/Users/mac/.bun/bin:$PATH" && qmd search "${query.replace(/"/g, '\\"')}" -n ${limit} --json 2>&1`;
    const output = execSync(cmd, { 
      encoding: 'utf-8', 
      timeout: 5000,
      shell: '/bin/zsh'
    });
    
    return parseQmdOutput(output);
  } catch (err) {
    console.error('Search failed:', err);
    return [];
  }
}

export function semanticSearch(query: string, limit: number = 5): SearchResult[] {
  if (!query || query.length < 2) return [];
  
  try {
    const cmd = `export PATH="/Users/mac/.bun/bin:$PATH" && qmd vsearch "${query.replace(/"/g, '\\"')}" -n ${limit} --json 2>&1`;
    const output = execSync(cmd, { 
      encoding: 'utf-8', 
      timeout: 30000,
      shell: '/bin/zsh'
    });
    
    return parseQmdOutput(output);
  } catch (err) {
    console.error('Semantic search failed:', err);
    return [];
  }
}
