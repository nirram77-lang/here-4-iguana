# Usage Examples

Real-world scenarios and how to use the testing system.

## Scenario 1: Daily Development

### Morning Routine
```bash
# Start your day
cd ~/projects/i4iguana
git pull origin main

# Install any new dependencies
npm install

# Run tests to ensure everything works
./scripts/run-all-tests.sh

# Start development
npm run dev
```

### Making Changes
```bash
# Create feature branch
git checkout -b feature/new-match-algorithm

# Make your changes...
# Edit files: components/match-screen.tsx, lib/matching-service.ts

# Test frequently during development
./scripts/01-typescript-check.sh  # Quick TypeScript check

# When done with changes
./scripts/run-all-tests.sh  # Full validation

# If tests pass, commit
git add .
git commit -m "Improved matching algorithm"
```

## Scenario 2: Fixing Build Failures

### Problem: Build Failed in Production

**Step 1: Reproduce locally**
```bash
# Pull the problematic code
git checkout main
git pull

# Run tests
./scripts/run-all-tests.sh
```

**Step 2: Identify the issue**
```
❌ FAILED: TypeScript Syntax Check
Error: Property 'onGetStarted' does not exist on type 'WelcomeScreenProps'
```

**Step 3: Fix the issue**
```typescript
// components/welcome-screen.tsx
interface WelcomeScreenProps {
  onGetStarted: () => void;  // Added missing prop
}
```

**Step 4: Verify the fix**
```bash
./scripts/01-typescript-check.sh  # Test the specific issue
✓ No TypeScript errors found

./scripts/run-all-tests.sh        # Full validation
✓ ALL TESTS PASSED
```

**Step 5: Deploy**
```bash
git add .
git commit -m "Fix: Added missing onGetStarted prop"
git push origin main
```

## Scenario 3: Code Review Process

### As Author

**Before creating PR:**
```bash
# Ensure code quality
./scripts/run-all-tests.sh

# If tests pass, create PR
git push origin feature/my-feature
# Create PR on GitHub/GitLab
```

### As Reviewer

**Clone and test the PR:**
```bash
# Fetch PR branch
git fetch origin pull/123/head:pr-123
git checkout pr-123

# Install dependencies
npm install

# Run tests
./scripts/run-all-tests.sh
```

**Review results:**
- ✅ All pass → Approve PR
- ❌ Tests fail → Request changes with specific test failures

## Scenario 4: Emergency Hotfix

### Quick Fix Process
```bash
# Create hotfix branch
git checkout -b hotfix/critical-bug

# Make minimal change
# Edit only the necessary file

# Quick validation (skip full tests if urgent)
./scripts/01-typescript-check.sh  # Just TypeScript
./scripts/02-dependency-check.sh  # Just dependencies

# If critical and tests pass
git add .
git commit -m "Hotfix: Critical bug XYZ"
git push origin hotfix/critical-bug

# Merge and deploy immediately
# Run full tests after deployment
./scripts/run-all-tests.sh
```

## Scenario 5: Refactoring Project Structure

### Large Refactoring
```bash
# Before refactoring - establish baseline
./scripts/run-all-tests.sh
# Save output for comparison

# Make structural changes
mv components/old-structure/* components/new-structure/

# Update imports across files
# ... (use find-replace tools)

# Test after each major change
./scripts/03-import-check.sh     # Check imports
./scripts/05-circular-deps-check.sh  # Check dependencies

# Final validation
./scripts/run-all-tests.sh
```

## Scenario 6: Adding New Feature

### Complete Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/chat-system

# 2. Create new files
touch components/chat-screen.tsx
touch lib/chat-service.ts

# 3. Develop the feature
# ... write code ...

# 4. Test as you go
./scripts/01-typescript-check.sh  # After writing types
./scripts/03-import-check.sh      # After adding imports
./scripts/04-props-check.sh       # After defining props

# 5. Before committing first version
./scripts/run-all-tests.sh

# 6. Commit incremental progress
git add .
git commit -m "WIP: Chat screen component"

# 7. Continue development...

# 8. Final validation before PR
./scripts/run-all-tests.sh
git push origin feature/chat-system
```

## Scenario 7: Onboarding New Developer

### New Team Member Setup
```bash
# Clone repository
git clone https://github.com/yourteam/i4iguana.git
cd i4iguana

# Install dependencies
npm install

# Verify setup
./scripts/run-all-tests.sh

# Expected output for properly set up project:
# ✓ ALL TESTS PASSED - Ready for deployment! 🚀
```

**If tests fail on fresh setup:**
```bash
# Check what's missing
./scripts/06-firebase-check.sh
# ❌ Environment variables not set

# Create environment file
cp .env.example .env.local
# Edit .env.local with Firebase credentials

# Test again
./scripts/run-all-tests.sh
# ✓ All tests pass
```

## Scenario 8: Pre-Deployment Checklist

### Before Production Deploy
```bash
# 1. Ensure on correct branch
git checkout main
git pull origin main

# 2. Clean install
rm -rf node_modules package-lock.json
npm install

# 3. Run full test suite
./scripts/run-all-tests.sh

# 4. Check specific concerns
./scripts/06-firebase-check.sh  # Verify Firebase config
./scripts/02-dependency-check.sh  # Check for vulnerabilities

# 5. Local build test
npm run build

# 6. If all pass, deploy
vercel --prod
# or
git push origin main  # Trigger CI/CD
```

## Scenario 9: Debugging Test Failures

### Systematic Debugging

**Problem: Tests failing but unclear why**

**Step 1: Run tests individually**
```bash
./scripts/01-typescript-check.sh
# ✓ PASSED

./scripts/02-dependency-check.sh
# ✓ PASSED

./scripts/03-import-check.sh
# ❌ FAILED - Here's the issue!
```

**Step 2: Examine detailed output**
```bash
# Re-run failed test with verbose mode
bash -x ./scripts/03-import-check.sh
```

**Step 3: Check specific files**
```bash
# If import check fails, manually verify
ls -la components/
# Check if files exist

grep -r "from.*login-screen" .
# Find all imports of the problematic file
```

## Scenario 10: CI/CD Integration

### GitHub Actions Setup

**Step 1: Add workflow file**
```bash
mkdir -p .github/workflows
touch .github/workflows/test.yml
```

**Step 2: Commit and push**
```bash
git add .github/workflows/test.yml
git commit -m "Add automated testing to CI"
git push origin main
```

**Step 3: Monitor first run**
- Go to GitHub → Actions tab
- Watch the workflow run
- Check test output in logs

**Step 4: Fix any CI-specific issues**
```yaml
# Common fix: permissions
- name: Make scripts executable
  run: chmod +x scripts/*.sh
```

## Common Commands Reference

### Quick Checks
```bash
# Just TypeScript
./scripts/01-typescript-check.sh

# Just imports
./scripts/03-import-check.sh

# Just props
./scripts/04-props-check.sh
```

### Full Validation
```bash
# All tests
./scripts/run-all-tests.sh

# With npm
npm test  # If configured in package.json
```

### Debugging
```bash
# Verbose mode
bash -x ./scripts/run-all-tests.sh

# Single test verbose
bash -x ./scripts/01-typescript-check.sh
```

### Integration
```bash
# Test before commit
./scripts/run-all-tests.sh && git commit

# Test before push
./scripts/run-all-tests.sh && git push

# Test before build
./scripts/run-all-tests.sh && npm run build
```

## Tips & Tricks

### Speed Up Development

**Run only necessary tests:**
```bash
# If you only changed TypeScript files
./scripts/01-typescript-check.sh

# If you only changed imports
./scripts/03-import-check.sh

# If you only changed component props
./scripts/04-props-check.sh
```

### Create Aliases

**Add to ~/.bashrc or ~/.zshrc:**
```bash
alias i4test="./scripts/run-all-tests.sh"
alias i4ts="./scripts/01-typescript-check.sh"
alias i4props="./scripts/04-props-check.sh"
```

**Usage:**
```bash
i4test     # Run all tests
i4ts       # Just TypeScript
i4props    # Just props
```

### VS Code Integration

**Add keyboard shortcut:**
1. File → Preferences → Keyboard Shortcuts
2. Search for "Tasks: Run Test Task"
3. Set to `Ctrl+Shift+T` (or your preference)

Now press `Ctrl+Shift+T` to run tests instantly!

---

**Remember:** Tests are your safety net. Run them often!
