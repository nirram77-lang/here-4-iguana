# Troubleshooting Guide

Common issues and their solutions.

## TypeScript Check Failures

### Error: "TypeScript compiler not found"

**Cause:** TypeScript is not installed.

**Solution:**
```bash
# Install TypeScript locally
npm install --save-dev typescript

# Or globally
npm install -g typescript
```

### Error: "Property 'X' does not exist on type 'Y'"

**Cause:** Type mismatch in your code.

**Solutions:**
1. Check interface definitions match usage
2. Verify you're not accessing props that don't exist
3. Update interface to include missing property

```typescript
// Before (error)
interface UserData {
  name: string;
}
const user: UserData = { name: "Nir", age: 30 }; // Error: age doesn't exist

// After (fixed)
interface UserData {
  name: string;
  age?: number; // Added optional age
}
```

### Error: "Cannot find module 'X'"

**Cause:** Import path is incorrect or module not installed.

**Solutions:**
```bash
# If it's a package, install it
npm install X

# If it's a local file, check the path
# Should be: import { X } from './correct/path'
```

## Dependency Check Failures

### Error: "node_modules not found"

**Solution:**
```bash
npm install
```

### Error: "Critical dependency missing: firebase"

**Solution:**
```bash
npm install firebase
```

### Warning: "Security vulnerabilities found"

**Solutions:**
```bash
# Automatic fix (safest)
npm audit fix

# Force fix (if automatic doesn't work)
npm audit fix --force

# Manual update
npm update
```

## Import Check Failures

### Error: "Broken import: ../components/loginScreen"

**Causes & Solutions:**

1. **Wrong file extension:**
```typescript
// Wrong
import Login from './loginScreen'

// Correct
import Login from './loginScreen.tsx'
// or
import Login from './login-screen' // if file is login-screen.tsx
```

2. **Case sensitivity:**
```typescript
// File is: LoginScreen.tsx

// Wrong
import Login from './loginscreen'

// Correct
import Login from './LoginScreen'
```

3. **File doesn't exist:**
- Check the file path
- Verify the file exists in that location

### Error: "Firebase imports incorrect"

**Common Issue:**
```typescript
// Wrong
import firebase from 'firebase'

// Correct - v9+ modular syntax
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
```

## Props Check Failures

### Error: "LoginScreen - Missing props: onSuccess"

**Cause:** Component interface doesn't match how it's being used.

**Solution:**
```typescript
// In login-screen.tsx
interface LoginScreenProps {
  onSuccess: (user: any) => void;  // Add this
  // ... other props
}
```

### Error: "Found: onLogin - Should be: onSuccess"

**Cause:** Using old prop name.

**Solution:**
```tsx
// In page.tsx - Wrong
<LoginScreen onLogin={handleLogin} />

// Correct
<LoginScreen onSuccess={handleLogin} />
```

### Error: "Firestore service - Missing function: saveUserProfile"

**Cause:** Function not exported from service.

**Solution:**
```typescript
// In lib/firestore-service.ts
export async function saveUserProfile(userId: string, data: any) {
  // implementation
}
```

## Circular Dependency Failures

### Error: "Circular dependency detected: A <-> B"

**Example Problem:**
```typescript
// file-a.ts
import { funcB } from './file-b'

// file-b.ts
import { funcA } from './file-a'  // CIRCULAR!
```

**Solutions:**

1. **Extract shared code:**
```typescript
// Create shared-utils.ts
export const sharedFunc = () => {}

// file-a.ts
import { sharedFunc } from './shared-utils'

// file-b.ts
import { sharedFunc } from './shared-utils'
```

2. **Use dependency injection:**
```typescript
// Instead of importing directly
export function funcA(callback: () => void) {
  callback()
}
```

3. **Restructure hierarchy:**
- Make one file depend on the other, not both ways
- Consider if both functions should be in the same file

### Warning: "Service imports from components"

**Problem:**
```typescript
// lib/user-service.ts
import { UserCard } from '../components/user-card'  // WRONG!
```

**Solution:**
Services should never import UI components. Move shared logic to utilities.

```typescript
// Create lib/user-utils.ts
export const formatUserData = (user) => { /* logic */ }

// Use in both service and component
import { formatUserData } from '../lib/user-utils'
```

## Firebase Check Failures

### Error: "Firebase config file not found"

**Solution:**
```bash
# Create lib/firebase.ts
mkdir -p lib
touch lib/firebase.ts
```

Then add Firebase initialization code.

### Error: "Environment variable not set: NEXT_PUBLIC_FIREBASE_API_KEY"

**Solution:**
```bash
# Create .env.local
touch .env.local
```

Add all required variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Where to find these:**
1. Go to Firebase Console
2. Project Settings → General
3. Scroll to "Your apps"
4. Copy configuration values

### Warning: "Firestore rules allow public access"

**Problem:** Your rules are:
```
allow read, write: if true;  // INSECURE!
```

**Solution for Development:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Script Execution Issues

### Error: "Permission denied"

**Solution:**
```bash
chmod +x scripts/*.sh
```

### Error: "bash: ./scripts/run-all-tests.sh: No such file or directory"

**Causes & Solutions:**

1. **Not in project root:**
```bash
cd /path/to/your/project
./scripts/run-all-tests.sh
```

2. **Scripts not copied:**
```bash
ls scripts/  # Check if files exist
```

3. **Wrong path:**
```bash
# Use absolute path
/full/path/to/scripts/run-all-tests.sh
```

## Performance Issues

### Tests are slow

**Causes & Solutions:**

1. **Large node_modules:**
- Tests scan files but exclude node_modules
- If slow, verify exclusions are working

2. **Many files:**
- Tests scan all .ts/.tsx files
- This is normal for large projects

3. **TypeScript check is slow:**
```bash
# Run incremental builds
npx tsc --noEmit --incremental
```

## Integration Issues

### Pre-commit hook not working

**Check hook file:**
```bash
cat .git/hooks/pre-commit
```

**Should contain:**
```bash
#!/bin/bash
./scripts/run-all-tests.sh || exit 1
```

**Make it executable:**
```bash
chmod +x .git/hooks/pre-commit
```

### Vercel build failing

**Check vercel.json:**
```json
{
  "buildCommand": "chmod +x scripts/*.sh && ./scripts/run-all-tests.sh && next build"
}
```

**Or in package.json:**
```json
{
  "scripts": {
    "build": "./scripts/run-all-tests.sh && next build"
  }
}
```

### GitHub Actions failing

**Check permissions:**
```yaml
- name: Make scripts executable
  run: chmod +x scripts/*.sh
  
- name: Run tests
  run: ./scripts/run-all-tests.sh
```

## Getting More Help

1. **Check script output** - Most errors include fix suggestions
2. **Run individual tests** - Isolate the problem
3. **Enable verbose mode:**
```bash
bash -x ./scripts/run-all-tests.sh
```

## Common Workflow

When you see a failure:

1. **Read the error message** - It usually tells you what's wrong
2. **Check this guide** - Most issues are documented
3. **Fix the issue** - Apply the suggested solution
4. **Re-run tests** - Verify the fix worked
5. **Commit & deploy** - Once all tests pass

---

**Remember:** Tests catch problems BEFORE deployment. A test failure is better than a production failure!
