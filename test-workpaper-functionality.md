# Work Paper Detail Functionality Test Plan

## Test Scenarios

### 1. Draft Status Work Paper
**Expected Behavior:**
- ✅ GDrive link can be edited (Edit button visible)
- ❌ Statement, Explanation, Notes fields are read-only
- ❌ Generate button is NOT visible

### 2. Ongoing Status Work Paper
**Expected Behavior:**
- ❌ GDrive link CANNOT be edited (Edit button hidden)
- ✅ Statement, Explanation, Notes fields are editable (textarea inputs)
- ✅ Generate button IS visible and functional

### 3. Completed Status Work Paper
**Expected Behavior:**
- ❌ GDrive link CANNOT be edited (Edit button hidden)
- ❌ All fields are read-only (no inputs)
- ❌ Generate button is NOT visible
- ❌ Edit work paper button is NOT visible

## Implementation Verification

The current implementation in `WorkPaperDetailPage.tsx` correctly handles these scenarios:

### GDrive Link Editing (Draft Only)
```typescript
// Lines 764-772 - Only shows edit button when status is 'draft'
{workPaper.status === 'draft' && (
  <Button
    onClick={() => handleEditDriveLink(note.id, note.drive_link || '')}
    size="sm"
    variant="outline"
    title="Edit GDrive Link (hanya bisa di Draft)"
  >
    <Edit className="w-3 h-3" />
  </Button>
)}
```

### Notes Editing (Ongoing Only)
```typescript
// Lines 691-703 & 706-718 & 791-803 - Only show textareas when status is 'ongoing'
{workPaper.status === 'ongoing' ? (
  <Textarea
    value={note.statement || ''}
    onChange={(e) => handleEditNote(note.id, 'statement', e.target.value)}
    placeholder="Enter statement"
    rows={3}
    className="min-h-[80px] resize-y"
  />
) : (
  <div className="break-words whitespace-pre-wrap min-h-[80px] flex items-center">
    {note.statement || "-"}
  </div>
)}
```

### Generate Functionality (Ongoing Only)
```typescript
// Lines 810-822 - Only shows generate button when status is 'ongoing'
{workPaper.status === 'ongoing' && (
  <Button
    onClick={() => generateAIAnswerForNote(note.id)}
    disabled={isGeneratingAnswer}
    size="sm"
    variant="outline"
    className="flex items-center space-x-1"
    title="Generate AI Answer (hanya bisa di Ongoing)"
  >
    <Bot className="w-3 h-3" />
    <span>{isGeneratingAnswer ? "..." : "Generate"}</span>
  </Button>
)}
```

## All Requirements Met ✅

1. **GDrive link editing**: Available only when status is 'draft'
2. **Notes editing**: Available only when status is 'ongoing'
3. **Generate functionality**: Available only when status is 'ongoing'

The implementation correctly enforces the business rules as specified.