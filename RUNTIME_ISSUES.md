# 🚨 RUNTIME ISSUES FOUND - CRITICAL REVIEW

## 🔴 CRITICAL ISSUES (Will cause crashes/errors)

### 1. **GraphVisualization.tsx - Memory Leaks from Event Listeners**
**Lines 155-164**
```typescript
// ❌ PROBLEM: Event listeners never removed
g.addEventListener('click', (e) => { ... });
g.addEventListener('dblclick', (e) => { ... });
```
**Impact**: Every time graph changes, new listeners are added but old ones remain. After 10 searches, you'll have 10x listeners on old DOM nodes that are no longer visible.

**Fix**: Store event handlers and remove them on cleanup.

---

### 2. **GraphVisualization.tsx - Stale Closures in useEffect**
**Line 107**
```typescript
// ❌ PROBLEM: Missing dependencies
}, [graph]); // Should include onLayoutReady, renderNode, renderLinks
```
**Impact**: Functions use stale values from previous renders. `onLayoutReady` might reference old state.

**Fix**: Include all dependencies or use useCallback to stabilize functions.

---

### 3. **HomeClient.tsx - Graph Builder Not Disposed**
**Line 50-64**
```typescript
const performSearch = (searchQuery: string) => {
  // ❌ PROBLEM: Old builder not disposed before creating new one
  const builder = buildGraph(...);
  setGraph(builder.graph);
};
```
**Impact**: Previous fetch requests continue running in background. Multiple simultaneous searches will conflict.

**Fix**: Track and dispose previous builder before creating new one.

---

### 4. **HomeClient.tsx - Progress Subscription Memory Leak**
**Line 30-38**
```typescript
useEffect(() => {
  const unsubscribe = progress.onChange(() => { ... });
  return unsubscribe;
}, [progress]); // ❌ progress changes on every search
```
**Impact**: New Progress object created each search, but old Progress object still has listeners. Memory leak grows with each search.

**Fix**: Don't recreate Progress object. Update the same instance or use ref.

---

### 5. **buildGraph.ts - setTimeout Not Cancelled**
**Line 121**
```typescript
setTimeout(loadNext, requestDelay);
```
**Impact**: If user performs new search, old setTimeout still runs. Can cause race conditions.

**Fix**: Track timeout IDs and cancel them in dispose().

---

### 6. **Typeahead.tsx - setState on Unmounted Component**
**Line 23-33**
```typescript
redditDataClient.getSuggestion(query).then((results) => {
  setSuggestions(results); // ❌ Component might be unmounted
});
```
**Impact**: Console warnings and potential memory leaks.

**Fix**: Use cleanup flag in useEffect.

---

## 🟡 HIGH PRIORITY ISSUES (Will cause bugs)

### 7. **HomeClient.tsx - Empty Dependency Array**
**Line 48**
```typescript
useEffect(() => {
  const queryParam = searchParams.get('query');
  // ... uses performSearch which is not in deps
}, []); // ❌ Should include searchParams, performSearch
```
**Impact**: Only runs on mount. URL parameter changes won't trigger search.

**Fix**: Add proper dependencies or use useCallback.

---

### 8. **GraphVisualization.tsx - document.querySelectorAll Leaks**
**Line 222**
```typescript
document.querySelectorAll('.hovered').forEach((el) => {
  el.classList.remove('hovered');
});
```
**Impact**: Queries entire document, not scoped to component. Could affect other components if they use "hovered" class.

**Fix**: Query within SVG ref scope only.

---

### 9. **buildGraph.ts - Race Condition in Promises**
**Line 151**
```typescript
function onPendingReady(res: string[], query: string) {
  // ❌ PROBLEM: doesn't check if cancelled
  if (!res || !res.length) res = [query];
  loadSiblings(res);
}
```
**Impact**: Even after dispose(), old promises can still execute.

**Fix**: Check `cancelled` flag before processing.

---

### 10. **Typeahead.tsx - Prop Not Synced**
**Line 17**
```typescript
const [query, setQuery] = useState(initialQuery || '');
```
**Impact**: If parent changes `query` prop, local state doesn't update. Stale data displayed.

**Fix**: Add useEffect to sync with prop changes.

---

## 🟠 MEDIUM PRIORITY ISSUES (Performance/UX)

### 11. **GraphVisualization.tsx - No Layout Cleanup**
**Line 65-74**
```typescript
const layout = createLayout(graph, { ... });
```
**Impact**: Layout simulation runs forever, consuming CPU even when not needed.

**Fix**: Dispose layout when component unmounts or graph changes.

---

### 12. **HomeClient.tsx - Recreating Functions on Every Render**
**Lines 50, 67, 72, 76**
```typescript
const performSearch = (searchQuery: string) => { ... }
const handleSearch = (searchQuery: string) => { ... }
const handleNodeClick = (nodeId: string) => { ... }
const handleNodeDoubleClick = (nodeId: string) => { ... }
```
**Impact**: Child components re-render unnecessarily. New function references break React.memo optimizations.

**Fix**: Wrap in useCallback with proper dependencies.

---

### 13. **redditDataClient.ts - Singleton Pattern Issues**
**Bottom of file**
```typescript
const redditDataClient = new RedditDataClient();
export default redditDataClient;
```
**Impact**: In Next.js, this creates instance on server AND client. Could cause hydration mismatches.

**Fix**: Use client-only wrapper or lazy initialization.

---

## 🔵 LOW PRIORITY ISSUES (Edge cases)

### 14. **GraphVisualization.tsx - Potential Null References**
**Line 166**
```typescript
nodesRef.current.appendChild(g); // Already checked line 110
```
**Impact**: TypeScript doesn't know ref was checked earlier in parent.

**Fix**: Add null assertion or separate into smaller functions.

---

### 15. **Typeahead.tsx - Non-unique Keys**
**Line 81**
```typescript
key={suggestion.text}
```
**Impact**: If duplicate subreddit names exist, React will warn.

**Fix**: Add index to key: `key={suggestion.text + index}`.

---

### 16. **buildGraph.ts - No Error Handling for Empty Results**
**Line 152**
```typescript
if (!res || !res.length) res = [query];
```
**Impact**: Falls back to query itself, but what if network is down?

**Fix**: Better error handling and user feedback.

---

## 📊 SUMMARY

| Severity | Count | Must Fix Before Deploy |
|----------|-------|------------------------|
| 🔴 Critical | 6 | ✅ YES |
| 🟡 High | 4 | ✅ YES |
| 🟠 Medium | 3 | ⚠️ Recommended |
| 🔵 Low | 3 | ❌ Nice to have |

**Total Issues: 16**

**Estimated Fix Time: 2-3 hours**

---

## 🛠️ RECOMMENDED FIX ORDER

1. Fix GraphVisualization event listener cleanup (Critical #1)
2. Fix graph builder disposal (Critical #3)
3. Fix Progress subscription leak (Critical #4)
4. Fix buildGraph setTimeout cleanup (Critical #5)
5. Fix Typeahead unmounted setState (Critical #6)
6. Fix HomeClient dependencies (High #7)
7. Add useCallback to handlers (Medium #12)
8. Fix remaining issues

Would you like me to implement these fixes now?
