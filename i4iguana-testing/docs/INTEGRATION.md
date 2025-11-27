# Integration Guide

How to integrate the automated testing system into your development workflow.

## Overview

The testing system can be integrated at multiple points:

1. **Local Development** - Run manually before commits
2. **Pre-Commit Hooks** - Automatic validation before each commit
3. **Pre-Push Hooks** - Validation before pushing to remote
4. **CI/CD Pipeline** - Automated testing on every push
5. **Pre-Build** - Validation before production builds

## 1. Manual Local Testing

### Basic Usage
```bash
# Run all tests
./scripts/run-all-tests.sh

# Run specific test
./scripts/01-typescript-check.sh
```

### Recommended Workflow
```bash
# After making changes
npm run dev          # Test locally first
./scripts/run-all-tests.sh  # Validate
git add .
git commit -m "Your changes"
```

### Custom npm Scripts
```json
// package.json
{
  "scripts": {
    "test": "./scripts/run-all-tests.sh",
    "test:ts": "./scripts/01-typescript-check.sh",
    "test:deps": "./scripts/02-dependency-check.sh",
    "test:imports": "./scripts/03-import-check.sh",
    "test:props": "./scripts/04-props-check.sh",
    "test:circular": "./scripts/05-circular-deps-check.sh",
    "test:firebase": "./scripts/06-firebase-check.sh"
  }
}
```

Usage:
```bash
npm test              # All tests
npm run test:ts       # Just TypeScript
npm run test:props    # Just props
```

## 2. Git Pre-Commit Hooks

**Recommended for:** Catching issues before they enter your commit history.

### Using Husky (Recommended)

**Install Husky:**
```bash
npm install --save-dev husky
npx husky install
```

**Add pre-commit hook:**
```bash
npx husky add .husky/pre-commit "./scripts/run-all-tests.sh"
chmod +x .husky/pre-commit
```

**Your .husky/pre-commit file:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running automated tests before commit..."
./scripts/run-all-tests.sh

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Commit aborted."
    echo "Fix the issues above and try again."
    exit 1
fi

echo "✅ All tests passed. Proceeding with commit."
```

**Enable in package.json:**
```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

### Manual Git Hook (No Dependencies)

**Create the hook:**
```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Running automated tests before commit..."
./scripts/run-all-tests.sh

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Tests failed. Commit aborted."
    echo "Fix the issues above and try again."
    echo ""
    echo "To skip this check (not recommended):"
    echo "  git commit --no-verify"
    exit 1
fi

echo "✅ All tests passed. Proceeding with commit."
EOF

chmod +x .git/hooks/pre-commit
```

**Bypass when needed:**
```bash
# Emergency bypass (not recommended)
git commit --no-verify -m "Emergency fix"
```

## 3. Git Pre-Push Hooks

**Recommended for:** Final validation before code reaches remote repository.

### Using Husky
```bash
npx husky add .husky/pre-push "./scripts/run-all-tests.sh"
chmod +x .husky/pre-push
```

### Manual Hook
```bash
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "Running final tests before push..."
./scripts/run-all-tests.sh

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Tests failed. Push aborted."
    echo "Fix the issues and try again."
    exit 1
fi

echo "✅ Tests passed. Pushing..."
EOF

chmod +x .git/hooks/pre-push
```

## 4. Vercel Integration

### Option A: vercel.json

**Create/update vercel.json:**
```json
{
  "buildCommand": "chmod +x scripts/*.sh && ./scripts/run-all-tests.sh && next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Option B: package.json

**Update build script:**
```json
{
  "scripts": {
    "build": "./scripts/run-all-tests.sh && next build",
    "vercel-build": "./scripts/run-all-tests.sh && next build"
  }
}
```

### Option C: Pre-build Script

**Create scripts/prebuild.sh:**
```bash
#!/bin/bash
set -e

echo "Running pre-build validation..."
chmod +x scripts/*.sh
./scripts/run-all-tests.sh

echo "✅ Pre-build validation passed"
```

**In vercel.json:**
```json
{
  "buildCommand": "./scripts/prebuild.sh && next build"
}
```

## 5. GitHub Actions

**Create .github/workflows/test.yml:**

```yaml
name: Automated Build Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Make scripts executable
      run: chmod +x scripts/*.sh
    
    - name: Run automated tests
      run: ./scripts/run-all-tests.sh
    
    - name: Build application
      run: npm run build
      if: success()
```

### Advanced GitHub Actions

**With test reports:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Make scripts executable
      run: chmod +x scripts/*.sh
    
    - name: TypeScript Check
      run: ./scripts/01-typescript-check.sh
      continue-on-error: true
      id: typescript
    
    - name: Dependency Check
      run: ./scripts/02-dependency-check.sh
      continue-on-error: true
      id: dependencies
    
    - name: Import Check
      run: ./scripts/03-import-check.sh
      continue-on-error: true
      id: imports
    
    - name: Props Check
      run: ./scripts/04-props-check.sh
      continue-on-error: true
      id: props
    
    - name: Circular Dependencies Check
      run: ./scripts/05-circular-deps-check.sh
      continue-on-error: true
      id: circular
    
    - name: Firebase Check
      run: ./scripts/06-firebase-check.sh
      continue-on-error: true
      id: firebase
    
    - name: Generate Summary
      if: always()
      run: |
        echo "## Test Results" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY
        echo "| Test | Status |" >> $GITHUB_STEP_SUMMARY
        echo "|------|--------|" >> $GITHUB_STEP_SUMMARY
        echo "| TypeScript | ${{ steps.typescript.outcome }} |" >> $GITHUB_STEP_SUMMARY
        echo "| Dependencies | ${{ steps.dependencies.outcome }} |" >> $GITHUB_STEP_SUMMARY
        echo "| Imports | ${{ steps.imports.outcome }} |" >> $GITHUB_STEP_SUMMARY
        echo "| Props | ${{ steps.props.outcome }} |" >> $GITHUB_STEP_SUMMARY
        echo "| Circular Deps | ${{ steps.circular.outcome }} |" >> $GITHUB_STEP_SUMMARY
        echo "| Firebase | ${{ steps.firebase.outcome }} |" >> $GITHUB_STEP_SUMMARY
    
    - name: Fail if any test failed
      if: |
        steps.typescript.outcome != 'success' ||
        steps.dependencies.outcome != 'success' ||
        steps.imports.outcome != 'success' ||
        steps.props.outcome != 'success' ||
        steps.circular.outcome != 'success' ||
        steps.firebase.outcome != 'success'
      run: exit 1
```

## 6. GitLab CI/CD

**Create .gitlab-ci.yml:**

```yaml
image: node:18

stages:
  - test
  - build
  - deploy

cache:
  paths:
    - node_modules/

before_script:
  - npm ci
  - chmod +x scripts/*.sh

test:
  stage: test
  script:
    - ./scripts/run-all-tests.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - .next/
  only:
    - main
    - develop
```

## 7. Jenkins Pipeline

**Create Jenkinsfile:**

```groovy
pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS 18'
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Validate') {
            steps {
                sh 'chmod +x scripts/*.sh'
                sh './scripts/run-all-tests.sh'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'vercel --prod'
            }
        }
    }
    
    post {
        failure {
            echo 'Build validation failed!'
        }
        success {
            echo 'All tests passed!'
        }
    }
}
```

## 8. VS Code Integration

**Create .vscode/tasks.json:**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run All Tests",
      "type": "shell",
      "command": "./scripts/run-all-tests.sh",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "TypeScript Check",
      "type": "shell",
      "command": "./scripts/01-typescript-check.sh",
      "group": "test"
    }
  ]
}
```

**Usage:** Press `Ctrl+Shift+P` → "Tasks: Run Test Task"

## 9. Docker Integration

**In Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Make scripts executable
RUN chmod +x scripts/*.sh

# Run tests before build
RUN ./scripts/run-all-tests.sh

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 10. npm Life-cycle Scripts

**Automatic execution:**

```json
{
  "scripts": {
    "preinstall": "echo 'Installing dependencies...'",
    "postinstall": "chmod +x scripts/*.sh",
    "prebuild": "./scripts/run-all-tests.sh",
    "build": "next build",
    "predev": "./scripts/run-all-tests.sh",
    "dev": "next dev",
    "prestart": "./scripts/run-all-tests.sh",
    "start": "next start"
  }
}
```

**Selective execution:**

```json
{
  "scripts": {
    "build": "next build",
    "build:safe": "npm run test && npm run build",
    "test": "./scripts/run-all-tests.sh"
  }
}
```

## Best Practices

### 1. Choose the Right Integration Point

- **Pre-commit**: Fast feedback, catches issues early
- **Pre-push**: Thorough validation before sharing code
- **CI/CD**: Team-wide validation, required for collaboration
- **Pre-build**: Final check before production

### 2. Handle Failures Gracefully

```bash
# In scripts, always provide actionable feedback
if [ $ERRORS -gt 0 ]; then
    echo "❌ Build validation failed"
    echo ""
    echo "Next steps:"
    echo "  1. Review errors above"
    echo "  2. Fix the issues"
    echo "  3. Run tests again"
    exit 1
fi
```

### 3. Optimize for Speed

```json
// Use incremental TypeScript
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### 4. Document for Your Team

Add to your README:
```markdown
## Development Workflow

Before committing:
\`\`\`bash
npm test
\`\`\`

All tests must pass before deployment.
```

---

Choose the integration methods that best fit your workflow!
