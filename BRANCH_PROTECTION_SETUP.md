# Branch Protection Setup Guide

## 🛡️ Required GitHub Repository Settings

### Step 1: Navigate to Branch Protection Rules
1. Go to your GitHub repository: `https://github.com/Khaalid245/somali-early-warning-system-school`
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** button

### Step 2: Configure Protection Rule

**Branch name pattern:** `main`

**Enable these settings:**
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals:** 1
  - ✅ **Dismiss stale PR approvals when new commits are pushed**
  - ✅ **Require review from code owners** (if you have CODEOWNERS file)

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - **Required status checks:**
    - `lint` (Code Quality & Linting)
    - `test` (Backend Tests & Coverage)

- ✅ **Require linear history**
- ✅ **Include administrators**
- ✅ **Restrict pushes that create files larger than 100MB**

### Step 3: Save Protection Rule
Click **Create** to save the branch protection rule.

## 🎯 What This Achieves

- **No direct pushes to main** - All changes must go through PRs
- **Automated quality gates** - CI must pass before merge
- **Code review requirement** - At least 1 approval needed
- **Linear history** - Cleaner git history
- **Admin compliance** - Even admins follow the rules

## 📊 Coverage Setup (Optional)

1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Coverage reports will be automatically uploaded by the CI pipeline

## ✅ Verification

After setup, try creating a PR to test:
1. Create a new branch: `git checkout -b test-branch`
2. Make a small change
3. Push and create PR
4. Verify CI runs and status checks appear
5. Merge only after CI passes

Your repository is now production-ready with enterprise-grade protection!