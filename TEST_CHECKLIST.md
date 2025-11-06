# Testing Checklist

## Automated Build Test
```bash
npm run build
```
**Expected**: Build should complete successfully with only minor ESLint warnings.

## Manual Testing Steps

### 1. Start Development Server
```bash
npm run dev
```
**Expected**: Server starts on http://localhost:3000

### 2. Test Initial Load
1. Open http://localhost:3000 in browser
2. **Expected**: See welcome screen with "Welcome!" message
3. **Expected**: No console errors

### 3. Test Graph Building
1. Type "programming" in the search box
2. Press Enter or select from autocomplete
3. **Expected Behavior**:
   - Status message changes to "Downloading graph data..."
   - Then "Building graph... (N pending)"
   - Then "Computing layout... X%"
   - Progress percentage increases from 0% to 100%
   - Graph nodes appear and start moving
   - After ~2-3 seconds, edges/links appear connecting nodes
   - Animation continues smoothly
   - Final result: Stable graph with "programming" in center

### 4. Test Autocomplete
1. Type "prog" in search box (don't press enter)
2. **Expected**: Dropdown appears with suggestions like "programming", "progressive", etc.
3. **Expected**: Suggestions are highlighted with search term in bold
4. Click on a suggestion
5. **Expected**: Graph builds for selected subreddit

### 5. Test Node Interaction
1. After graph is built, click on any node
2. **Expected**: Node and its connections highlight in blue
3. **Expected**: Right panel opens showing Reddit iframe for that subreddit
4. Double-click on a different node
5. **Expected**: Graph rebuilds with new subreddit as center

### 6. Test Pan and Zoom
1. After graph is built, drag the graph background
2. **Expected**: Graph pans smoothly
3. Use mouse wheel to zoom
4. **Expected**: Graph zooms in/out smoothly

### 7. Test Different Subreddits
Try these test cases:
- "math" - Should work
- "javascript" - Should work
- "askreddit" - Large subreddit, should work
- "nonexistentsubreddit12345" - Should handle gracefully

### 8. Test Mobile Responsiveness
1. Open browser dev tools
2. Toggle device emulation (mobile view)
3. **Expected**: Layout adapts, controls remain accessible

## Console Checks

### Should NOT see these errors:
- ❌ "distanceTo is not a function"
- ❌ "Cannot read property 'add' of undefined"
- ❌ "mag is not a function"
- ❌ Memory leak warnings
- ❌ "setState on unmounted component"

### May see these (OK):
- ⚠️ ESLint warnings about dependencies
- ⚠️ Google Analytics script preference
- ⚠️ Network errors during SSR build (doesn't affect runtime)

## Performance Checks
1. Open Performance tab in devtools
2. Start recording
3. Search for "programming"
4. Wait for animation to complete (~3-4 seconds)
5. Stop recording

**Expected**:
- Animation should run at ~60fps
- Memory usage should be stable
- No memory leaks after multiple searches

## Quick Regression Test

Run this sequence without refresh:
1. Search "programming"
2. Wait for completion
3. Search "javascript"
4. Wait for completion
5. Search "python"
6. Wait for completion

**Expected**:
- Each search properly cancels previous
- No errors accumulate
- Memory returns to baseline between searches

## Visual Verification

**Graph should look like this:**
1. Central node (searched subreddit) highlighted in blue
2. Connected nodes arranged in circular pattern
3. Lines connecting related subreddits
4. Nodes have rounded rectangles with subreddit names
5. Animation is smooth, not jittery
6. Final layout has no overlapping nodes

## Pass/Fail Criteria

✅ **PASS if:**
- Graph animates smoothly through all phases
- No JavaScript errors in console
- All interactions work
- Memory is stable

❌ **FAIL if:**
- Graph freezes or vibrates
- Console shows errors
- Progress bar stuck at any percentage
- Nodes don't appear
- Animation is choppy

## Automated Test (Future)
TODO: Add Playwright/Cypress tests for:
- Graph building
- Node interaction
- Search functionality
