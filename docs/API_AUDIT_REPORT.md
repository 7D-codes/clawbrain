# ClawBrain API & Connection Audit Report

**Date:** 2026-02-07  
**Auditor:** Manual code review  
**Scope:** API routes, Gateway connection, Data stores, File operations

---

## Summary

| Category | Status | Issues | Priority |
|----------|--------|--------|----------|
| API Routes | ✅ Good | 2 minor | Low |
| Gateway Connection | ⚠️ Needs Fix | 3 issues | High |
| Data Stores | ✅ Good | 1 minor | Low |
| File Operations | ✅ Good | 1 minor | Low |
| Error Handling | ⚠️ Needs Fix | 2 issues | Medium |

---

## API Routes (`src/app/api/`)

### ✅ Strengths
- Proper Zod validation on all inputs
- Correct HTTP status codes
- UUID validation on task IDs
- Good error handling with custom error classes
- Atomic file operations

### ⚠️ Issues Found

#### 1. Missing Request Timeout (LOW)
**Location:** `tasks/route.ts`, `tasks/[id]/route.ts`  
**Issue:** No timeout on file operations - could hang indefinitely  
**Fix:** Add timeout wrapper for file operations

#### 2. No Rate Limiting (LOW)
**Issue:** No rate limiting on API endpoints  
**Risk:** Could be overwhelmed with requests  
**Fix:** Add rate limiting middleware (Next.js config or API route level)

---

## Gateway Connection (`src/lib/http-gateway.ts`)

### ⚠️ Issues Found

#### 1. No Connection Health Check (HIGH)
**Issue:** After initial connection, no periodic health checks  
**Impact:** Connection could drop silently, user won't know until they try to send  
**Fix:** Add periodic ping/health check every 30 seconds

#### 2. Message Loss on Disconnect (HIGH)
**Issue:** If connection drops while streaming, partial message is lost  
**Impact:** User sees incomplete bot response  
**Fix:** Buffer complete messages before displaying; handle reconnect with resume

#### 3. No Reconnection Backoff (MEDIUM)
**Issue:** Reconnect retries immediately without backoff  
**Impact:** Could hammer the server if it's down  
**Fix:** Add exponential backoff for reconnect attempts

#### 4. Race Condition in Streaming (MEDIUM)
**Issue:** `startStreamingMessage()` called after fetch starts, could race  
**Fix:** Call before fetch, handle abort properly

---

## Data Stores (`src/stores/`)

### ⚠️ Issues Found

#### 1. Double Debounce (LOW)
**Location:** `task-store.ts` + `file-watcher.ts`  
**Issue:** Both have 300ms debounce, could delay updates unnecessarily  
**Fix:** Remove one layer of debounce

#### 2. No Optimistic Update Rollback (LOW)
**Location:** `task-store.ts` updateTask  
**Issue:** On API error, state not rolled back  
**Fix:** Store previous state and restore on error

---

## File Operations

### ⚠️ Issues Found

#### 1. Silent Parse Failures (LOW)
**Location:** `file-store.ts` listTasks  
**Issue:** Invalid task files are skipped silently (only logged)  
**Fix:** Surface parse errors to user or collect them for reporting

---

## Recommendations

### Immediate (High Priority)
1. Add gateway health check polling
2. Fix message streaming race condition
3. Add reconnection backoff

### Short Term (Medium Priority)
4. Add API request timeouts
5. Implement optimistic update rollback
6. Add rate limiting

### Long Term (Low Priority)
7. Surface file parse errors
8. Remove double debounce
9. Add request/response logging

---

## Test Results

### Manual Testing
- ✅ Task CRUD operations work correctly
- ✅ API validation rejects invalid inputs
- ✅ Error responses have proper status codes
- ⚠️ Gateway connection shows status but doesn't detect drops
- ⚠️ No visual feedback when gateway reconnects

### Load Testing
- Not performed - recommend before production

---

## Action Items

1. [ ] Implement gateway health check polling
2. [ ] Fix streaming message race condition
3. [ ] Add exponential backoff for reconnects
4. [ ] Test full chat flow end-to-end
5. [ ] Add API timeout handling
