# Design Guidelines: Sistem Pembuatan Kwitansi PNS

## Design Approach: Design System-Based (Material Design)

**Rationale**: This is a utility-focused government administrative tool requiring clarity, efficiency, and professional presentation. Material Design provides excellent form controls, data tables, and clear visual hierarchy suitable for data-intensive workflows.

**Core Principles**:
- Functional clarity over visual flair
- Efficient data entry workflows
- Professional government aesthetic
- Clear visual feedback for user actions

---

## Color Palette

### Light Mode (Primary)
- **Primary**: 219 78% 46% (Professional government blue)
- **Primary Hover**: 219 78% 38%
- **Surface**: 0 0% 100% (White cards)
- **Background**: 220 13% 96% (Subtle gray background)
- **Border**: 220 13% 85%
- **Text Primary**: 222 47% 11%
- **Text Secondary**: 215 16% 47%

### Semantic Colors
- **Success**: 142 71% 45% (Upload success, validation)
- **Error**: 0 84% 60% (Form errors, validation)
- **Warning**: 38 92% 50% (Alerts)
- **Accent**: 219 78% 46% (Matches primary for buttons/CTAs)

### Dark Mode
Not required for this administrative tool - government applications typically use light mode for document creation.

---

## Typography

**Font Family**: 
- Primary: 'Inter' from Google Fonts (excellent for forms and data tables)
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale**:
- **Headings (H1)**: text-2xl font-semibold (Sistem/Page titles)
- **Headings (H2)**: text-xl font-semibold (Section titles)
- **Headings (H3)**: text-lg font-medium (Card headers)
- **Body**: text-sm (Form labels, table content)
- **Small**: text-xs (Helper text, hints)
- **Button Text**: text-sm font-medium

**Special Considerations**:
- Indonesian text rendering: Ensure proper spacing for longer words
- Form labels: font-medium for clear hierarchy
- Table headers: font-semibold uppercase tracking-wide text-xs
- Monetary values: font-mono for alignment

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Form field spacing: gap-4
- Card padding: p-6
- Section margins: mb-8
- Input padding: px-4 py-2
- Table cell padding: px-4 py-3

**Grid Structure**:
- Container: max-w-7xl mx-auto px-4
- Card-based sections with consistent spacing
- Form fields: Single column for clarity (max-w-2xl)
- Table: Full width with horizontal scroll on mobile

**Responsive Breakpoints**:
- Mobile-first approach
- Stack vertically on mobile
- Two-column layout for date ranges on tablet+

---

## Component Library

### A. Header Component
- **Structure**: Fixed top bar with sticky positioning
- **Content**: Title (left), "Simpan / Export" button (right)
- **Styling**: White background, bottom border, shadow-sm
- **Height**: h-16
- **Button**: Primary color, px-6 py-2, rounded-lg, font-medium

### B. Upload Section
- **Card Design**: White background, rounded-xl, shadow-sm, p-6
- **File Input**: Custom styled with border-2 border-dashed, hover state
- **Upload Button**: Primary color, full width on mobile, inline on desktop
- **File List**: Display selected files with remove option
- **Success State**: Green border, checkmark icon, file count indicator
- **Error State**: Red border, error message below

### C. Activity Form
- **Layout**: Three-field horizontal layout on desktop, stacked on mobile
- **Input Style**: 
  - Border: border border-gray-300
  - Focus: ring-2 ring-primary
  - Padding: px-4 py-2.5
  - Rounded: rounded-lg
- **Labels**: Above inputs, text-sm font-medium, mb-2
- **Date Inputs**: Custom calendar icon, consistent height
- **Required Indicators**: Red asterisk after label

### D. Editable Table
- **Container**: Card with overflow-x-auto for mobile
- **Table Structure**:
  - Header: bg-gray-50, sticky top-0
  - Rows: Hover state bg-gray-50, border-b
  - Alternating row option: even:bg-gray-50/50
- **Cell Types**:
  - **Editable Text**: Inline input with transparent bg, border on focus
  - **Dropdowns**: Custom select with chevron icon
  - **Amounts**: Right-aligned, font-mono, auto-format on blur
  - **Conditional Fields**: Smooth transition, highlighted with subtle bg
- **Action Buttons**:
  - Add Row: Primary outline, icon + text
  - Delete Row: Red ghost button, trash icon
  - Position: Action column (right) with fixed width
- **Total Row**: 
  - Sticky bottom or regular footer
  - bg-gray-100, font-semibold
  - Amount formatted: "Rp 1.234.567" in larger text

### E. Buttons & Actions
- **Primary**: bg-primary, white text, hover:brightness-90
- **Secondary**: bg-gray-100, gray-700 text, hover:bg-gray-200
- **Outline**: border-2 border-primary, primary text, hover:bg-primary/5
- **Danger**: bg-red-600, white text, hover:bg-red-700
- **Sizes**: px-4 py-2 (regular), px-6 py-3 (large)
- **Icons**: Inline with text, mr-2 spacing

### F. Form Validation & Feedback
- **Input Error State**: 
  - Red border (border-red-500)
  - Error message: text-red-600 text-xs mt-1
  - Error icon inline (right side of input)
- **Success State**: 
  - Green border briefly
  - Checkmark icon
- **Loading State**: 
  - Spinner icon
  - Disabled cursor
  - Reduced opacity

### G. Data Display
- **Number Formatting**: Indonesian Rupiah format (Rp 1.234.567)
- **Date Display**: DD/MM/YYYY format
- **Empty States**: Centered text with icon, muted colors
- **Badges**: For transaction types (rounded-full, px-3 py-1, text-xs)

---

## Animations

**Minimal & Purposeful Only**:
- Input focus: 150ms transition for ring
- Button hover: 200ms background transition
- Table row hover: 150ms background fade
- Dropdown open: 200ms slide-down
- Success/Error toast: 300ms slide-in from top
- NO scroll animations or page transitions

---

## Images

**No hero image** - This is a functional administrative tool, not a marketing page. All visual focus should be on the form and table interface.

**Icons Only**:
- Use Heroicons (outline style) via CDN
- Upload icon: ArrowUpTrayIcon
- Calendar icon: CalendarIcon
- Trash icon: TrashIcon
- Plus icon: PlusIcon
- Check icon: CheckCircleIcon
- Error icon: ExclamationCircleIcon

---

## Specific Implementation Notes

1. **Indonesian Language UI**: All labels, buttons, and messages in Bahasa Indonesia
2. **Transport Conditional Logic**: Smooth show/hide for transport_detail dropdown with slide transition
3. **Real-time Calculation**: Total updates immediately on amount change
4. **Print Formatting**: Console output should be well-structured JSON
5. **Mobile Experience**: Table scrolls horizontally, forms stack vertically
6. **Accessibility**: Proper labels, keyboard navigation, focus indicators