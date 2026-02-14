import { searchMemory, semanticSearch } from '@/lib/search';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'text';
  
  console.log('Search API called:', { query, type });
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], query });
  }
  
  try {
    const results = type === 'semantic' 
      ? await semanticSearch(query, 5)
      : await searchMemory(query, 10);
    
    console.log('Search results:', results.length);
    
    return NextResponse.json({ results, query, type });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: 'Search failed', results: [], query },
      { status: 500 }
    );
  }
}
