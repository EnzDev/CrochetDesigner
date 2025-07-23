import { QueryClient } from '@tanstack/react-query';
import { indexedDBStorage } from './indexdb-storage';

// Initialize IndexedDB on app start
indexedDBStorage.init().catch(console.error);

// Offline query function for IndexedDB
const defaultQueryFn = async ({ queryKey }: any) => {
  const [url, ...params] = queryKey;
  
  if (url === '/api/patterns') {
    return await indexedDBStorage.getAllPatterns();
  }
  
  if (url.startsWith('/api/patterns/') && params.length > 0) {
    const id = parseInt(params[0], 10);
    return await indexedDBStorage.getPattern(id);
  }
  
  throw new Error(`Unknown query: ${url}`);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Offline API request handlers
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const body = data;

  if (url === '/api/patterns') {
    if (method === 'GET') {
      return await indexedDBStorage.getAllPatterns();
    } else if (method === 'POST') {
      const id = await indexedDBStorage.savePattern(body as any);
      return { ...(body as object), id };
    }
  }

  if (url.startsWith('/api/patterns/')) {
    const id = parseInt(url.split('/').pop() || '0', 10);
    
    if (method === 'GET') {
      return await indexedDBStorage.getPattern(id);
    } else if (method === 'PUT') {
      await indexedDBStorage.updatePattern(id, body as any);
      return { ...(body as object), id };
    } else if (method === 'DELETE') {
      await indexedDBStorage.deletePattern(id);
      return { success: true };
    }
  }

  throw new Error(`Unknown API request: ${method} ${url}`);
}
