# Design: UI Navigation Shell & Global Controls

## Architectural Breakdown

### 1. Component Hierarchy
- `src/ui/components/common/Icon.tsx`: Pure functional icon component with typed icon names (`IconName`) rendering stroke SVGs matching the HTML design guide.
- `src/ui/components/navigation/`:
  - `BrandLogo.tsx`: Renders brand symbol + serif title + sans subtitle in standard and collapsed variants.
  - `DriveCard.tsx`: Encapsulates Google Drive connection status, primary sync button, and accessible dropdown menu for secondary actions.
  - `PrivacyToggleButton.tsx`: Accessible button toggling `isBlurred` with `aria-pressed` and dynamic icon (`eye` / `eye-off`).
- `src/ui/components/AppSidebar.tsx`: Composes `BrandLogo`, navigation links, recent patients list, and `DriveCard`. Uses full-height layout (`min-h-screen`, `bg-surface`, `border-r border-line`).
- `src/app/page.tsx`: Mobile header updated to use SVG icons, `BrandLogo`, and `PrivacyToggleButton`.

### 2. State & Data Flow
- `UIContext`: Provides `activeTab`, `setActiveTab`, `isSidebarCollapsed`, `setIsSidebarCollapsed`.
- `useGoogleDrive`: Supplies `googleToken`, `syncStatus`, `lastSynced`, `performSync`, `preloadAllForOffline`, `downloadDiagnosticLogs`, `disconnectGoogle`, `connectGoogle`.
- `isBlurred`: Controlled boolean state passed to sensitive elements with CSS blur filter.
