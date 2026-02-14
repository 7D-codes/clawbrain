'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, FileText, FolderGit2, Users, X, Loader2 } from 'lucide-react';
import { SearchResult } from '@/lib/search';

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'project': return FolderGit2;
      case 'person': return Users;
      default: return FileText;
    }
  };

  if (!isOpen) {
    return (
      <div style={containerStyle} onClick={() => setIsOpen(true)}>
        <Search size={18} color="#71717a" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search memory, projects, people... (Cmd+K)"
          style={inputStyle}
          readOnly
        />
        <kbd style={kbdStyle}>⌘K</kbd>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={() => setIsOpen(false)}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={searchContainerStyle}>
          <Search size={20} color="#71717a" />
          <input
            type="text"
            autoFocus
            placeholder="Search your memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={modalInputStyle}
          />
          {loading && <Loader2 size={18} color="#71717a" style={{ animation: 'spin 1s linear infinite' }} />}
          <button onClick={() => setIsOpen(false)} style={closeButtonStyle}>
            <X size={18} />
          </button>
        </div>

        <div style={resultsContainerStyle}>
          {results.length === 0 && query.length >= 2 && !loading && (
            <div style={emptyStyle}>No results found</div>
          )}
          
          {results.map((result, index) => {
            const Icon = getIcon(result.type);
            const isSelected = index === selectedIndex;
            
            return (
              <div
                key={result.id}
                style={{
                  ...resultItemStyle,
                  background: isSelected ? '#27272a' : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  console.log('Opening:', result.path);
                  setIsOpen(false);
                }}
              >
                <Icon size={16} color="#71717a" />
                <div style={resultContentStyle}>
                  <div style={resultTitleStyle}>{result.title}</div>
                  <div style={resultSnippetStyle}>{result.snippet}</div>
                  <div style={resultMetaStyle}>
                    <span style={typeBadgeStyle(result.type)}>{result.type}</span>
                    <span style={{ color: '#52525b' }}>Score: {(result.score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={footerStyle}>
          <span style={footerHintStyle}><kbd style={footerKbdStyle}>↑↓</kbd> to navigate</span>
          <span style={footerHintStyle}><kbd style={footerKbdStyle}>Enter</kbd> to open</span>
          <span style={footerHintStyle}><kbd style={footerKbdStyle}>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px 14px 48px',
  fontSize: 16,
  background: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 12,
  color: '#e4e4e7',
  outline: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const kbdStyle: React.CSSProperties = {
  position: 'absolute',
  right: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  padding: '4px 8px',
  background: '#27272a',
  border: '1px solid #3f3f46',
  borderRadius: 4,
  fontSize: 12,
  color: '#71717a',
  fontFamily: 'monospace',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '10vh',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 600,
  background: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 12,
  overflow: 'hidden',
};

const searchContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px 20px',
  borderBottom: '1px solid #27272a',
};

const modalInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#e4e4e7',
  fontSize: 16,
  outline: 'none',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#71717a',
  cursor: 'pointer',
  padding: 4,
};

const resultsContainerStyle: React.CSSProperties = {
  maxHeight: 400,
  overflow: 'auto',
};

const resultItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 20px',
  cursor: 'pointer',
  borderBottom: '1px solid #27272a',
};

const resultContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const resultTitleStyle: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 14,
  color: '#e4e4e7',
  marginBottom: 4,
};

const resultSnippetStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#a1a1aa',
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const resultMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 6,
  fontSize: 11,
};

const typeBadgeStyle = (type: string): React.CSSProperties => ({
  textTransform: 'uppercase',
  padding: '2px 6px',
  borderRadius: 4,
  background: type === 'project' ? '#10b98120' : type === 'person' ? '#f472b620' : '#22d3ee20',
  color: type === 'project' ? '#10b981' : type === 'person' ? '#f472b6' : '#22d3ee',
});

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: '#71717a',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  padding: '12px 20px',
  borderTop: '1px solid #27272a',
  background: '#0a0a0f',
};

const footerHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#71717a',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const footerKbdStyle: React.CSSProperties = {
  padding: '2px 6px',
  background: '#27272a',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: 11,
};
