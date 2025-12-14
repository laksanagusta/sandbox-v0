# URL Configuration Migration

## 📋 Summary

Semua hardcoded base URL telah diganti dengan environment variables yang diambil dari file `.env`.

## 🔄 Changes Made

### 1. Created Environment Configuration Utility
**File:** `src/lib/env.ts`
- Centralized environment variable management
- Provides `getApiBaseUrl()` and `getApiIdentityUrl()` helper functions
- Type-safe with defaults for development

### 2. Updated ApiClient
**File:** `src/lib/api-client.ts`
- Now uses `getApiBaseUrl()` and `getApiIdentityUrl()`
- Removed hardcoded URLs

### 3. Updated Components
The following components have been updated to use the centralized env configuration:

**Identity API (localhost:5001):**
- `src/components/OrganizationBadge.tsx`
- `src/components/OrganizationTable.tsx`
- `src/components/PermissionTable.tsx`
- `src/components/UserTable.tsx`
- `src/pages/OrganizationDetailPage.tsx`
- `src/pages/PermissionDetailPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/UserDetailPage.tsx`

**Base API (localhost:5002):**
- `src/pages/BusinessTripVerificationsPage.tsx`
- `src/services/work-paper-api.ts`
- `src/services/vaccines-api.ts`

### 4. Created Environment Variables Template
**File:** `.env.example`
```
VITE_API_BASE_URL=http://localhost:5002
VITE_API_IDENTITY_URL=http://localhost:5001
```

## ✅ Verification

To verify all hardcoded URLs have been replaced, run:
```bash
grep -r "http://localhost:" src --include="*.ts" --include="*.tsx"
```

Should only show comments in `src/lib/env.ts`.

## 🚀 Usage

### Development
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update values in `.env` if needed:
   ```env
   VITE_API_BASE_URL=http://localhost:5002
   VITE_API_IDENTITY_URL=http://localhost:5001
   ```

### Production
Set environment variables before building:
```env
VITE_API_BASE_URL=https://api.yourproduction.com
VITE_API_IDENTITY_URL=https://identity.yourproduction.com
```

## 📝 Code Examples

### Before
```typescript
const response = await fetch(
  `http://localhost:5001/api/v1/users/${id}`,
  { /* ... */ }
);
```

### After
```typescript
import { getApiIdentityUrl } from "@/lib/env";

const response = await fetch(
  `${getApiIdentityUrl()}/api/v1/users/${id}`,
  { /* ... */ }
);
```

## 🎯 Benefits

1. **Centralized Configuration**: All API URLs managed in one place
2. **Environment Flexibility**: Easy to switch between dev/staging/prod
3. **Type Safety**: Helper functions provide consistent URL formatting
4. **Maintainability**: No scattered hardcoded URLs throughout codebase
5. **Documentation**: `.env.example` serves as API URL documentation

## 🧹 Cleanup

The following temporary files can be removed or kept for reference:
- `update-urls.cjs` - Script used for automated URL replacement
- `update-urls.sh` - Alternative bash script (not used)

## ⚠️ Important Notes

- Always use `getApiBaseUrl()` for main API endpoints
- Always use `getApiIdentityUrl()` for identity/auth endpoints
- Never commit `.env` file to git (it's in `.gitignore`)
- Always update `.env.example` when adding new environment variables
