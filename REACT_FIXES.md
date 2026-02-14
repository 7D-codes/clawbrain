# React Infinite Loop Fixes - ClawBrain

## 🔴 Critical Issue: Maximum Update Depth Exceeded

### Root Cause
The `selectAllMessages` selector in `chat-store.ts` was creating a **new array on every render** when there was a streaming message:

```tsx
// BEFORE (BROKEN):
export const selectAllMessages = (state: ChatState): Message[] => {
  const { messages, currentStreamingMessage } = state;
  if (currentStreamingMessage) {
    return [...messages, currentStreamingMessage]; // NEW ARRAY EVERY TIME!
  }
  return messages;
};
```

This caused an infinite loop in `ChatPanel.tsx`:
1. Component renders
2. `selectAllMessages` returns new array `[...messages, streamingMessage]`
3. `useEffect` dependency `[messages]` changes
4. Effect runs and calls `setState` (scroll)
5. Re-render triggered
6. Go back to step 1 - **infinite loop!**

---

## Fixes Applied

### 1. `src/stores/chat-store.ts`
- Added warning comment about `selectAllMessages` creating new arrays
- Added `selectMessagesArray` selector for stable array reference
- Added `selectMessageCount` for primitive dependency tracking

### 2. `src/components/chat/ChatPanel.tsx`
- Changed from `selectAllMessages` to individual selectors
- Use `messages.length` and `currentStreamingMessage?.id` (primitives) in effect dependencies
- Track previous message count with `useRef` to prevent unnecessary scrolls
- Compute combined message array inline for rendering only

### 3. `src/lib/websocket.ts`
- **CRITICAL FIX**: Changed from using entire `store` object to individual selectors
- Store object is not stable and causes effect re-runs on every render
- Used `useCallback` for all store selectors to ensure stable function identity
- Split state selection from action selection properly

### 4. `src/components/ai-elements/message.tsx`
- Fixed `MessageBranchContent` effect dependencies
- Compare counts (numbers) instead of arrays in effect dependency tracking
- Added `eslint-disable` comments for intentional dependency patterns

### 5. `src/lib/file-watcher.ts`
- Used `useCallback` for store selectors
- Added `hasLoadedRef` to prevent double-loading in React Strict Mode
- Use ref pattern for the refresh function to avoid recreating debounced function

### 6. `src/components/kanban/KanbanBoard.tsx`
- Added `useMemo` for task counts to prevent recalculation on every render
- Memoized `tasksByStatus` function to maintain stable reference

### 7. `src/components/chat/MessageInput.tsx`
- Added proper dependency to `useEffect` for event listener

---

## Key Patterns to Remember

### ❌ DON'T: Use entire store object in dependencies
```tsx
// BROKEN - causes infinite loops
const store = useChatStore();
useEffect(() => {
  store.doSomething();
}, [store]); // Store object changes every render!
```

### ✅ DO: Use individual selectors with useCallback
```tsx
// CORRECT - stable dependencies
const doSomething = useChatStore(useCallback(state => state.doSomething, []));
useEffect(() => {
  doSomething();
}, [doSomething]); // Stable callback reference
```

### ❌ DON'T: Use arrays/objects as effect dependencies if they change every render
```tsx
// BROKEN - new array every time
const combined = [...arr1, ...arr2];
useEffect(() => {
  // runs every render
}, [combined]);
```

### ✅ DO: Use primitive values (strings, numbers, booleans)
```tsx
// CORRECT - primitives are stable
useEffect(() => {
  // only runs when length changes
}, [arr1.length, arr2.length]);
```

---

## Build Status
✅ TypeScript compilation: **PASSED**
✅ Production build: **PASSED**

---

## Additional Recommendations (Not Critical)

Consider implementing these for even better performance:

1. **Use `shallow` equality for array/object selectors**:
   ```tsx
   import { shallow } from 'zustand/shallow';
   const tasks = useTaskStore(state => state.tasks, shallow);
   ```

2. **Split large stores** into smaller, focused stores to reduce re-render scope

3. **Use React DevTools Profiler** to identify remaining performance issues

4. **Consider `useShallow` hook** from zustand for complex selectors:
   ```tsx
   import { useShallow } from 'zustand/react/shallow';
   const { tasks, loading } = useTaskStore(useShallow(state => ({ 
     tasks: state.tasks, 
     loading: state.loading 
   })));
   ```
