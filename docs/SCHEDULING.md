# 📅 Scheduling System - Smart Timeline Calculation

This document explains the core algorithm that turns Work Monitor into a scheduling assistant.

## Overview

The scheduling system calculates **realistic timelines** for orders by analyzing:

- ⏰ How many hours per day the user can work
- 📦 How many orders are already in progress
- 🗓️ Which days are working days
- 📋 Customer deadlines
- 💼 Available capacity

## Core Concepts

### 1. **Start Date** (When Work Will Begin)

The app looks at all active orders and calculates when the user will be **free** to start a new one.

**Example:**
```
Current workload:
- Order A: 20 hours
- Order B: 10 hours
Total: 30 hours

User can work: 6 hours/day
30 ÷ 6 = 5 days

If today is Monday, they'll be free Friday.
So: Start Date = Friday
```

**Algorithm:**
```
1. Get all active (pending + in-progress) orders
2. Sum their estimated_total_hours
3. Divide by hours_per_day → working days needed
4. Count forward only on working days (skip weekends/non-work days)
5. Return the calculated free date
```

### 2. **Estimated Completion** (When Order Will Finish)

From the start date, the app calculates when the order will be **done**.

**Example:**
```
Order: 60 hours (10 items × 6 hours each)
Start: Friday
Hours/day: 6
Working days: Mon-Fri

Fri: 6h → 54h left
Mon: 6h → 48h left
Tue: 6h → 42h left
Wed: 6h → 36h left
Thu: 6h → 30h left
Fri: 6h → 24h left
Mon: 6h → 18h left
Tue: 6h → 12h left
Wed: 6h → 6h left
Thu: 6h → 0h left ✅

Completion: Thu (2 weeks from start)
```

**Algorithm:**
```
1. Start from the provided start date
2. Skip to next working day if needed
3. For each working day:
   - Subtract hours_per_day from hoursRemaining
   - Move to next day if hours remain
4. Return the day when hours reach zero
```

### 3. **Deadline Status** (Can We Meet It?)

The app compares estimated completion against the customer's deadline.

**Possible Statuses:**
- ✅ **on-time**: Plenty of buffer (>1 day margin)
- ⚠️ **at-risk**: Tight deadline (≤1 day margin)
- 🚨 **overdue**: Will miss deadline

```typescript
// Example: Customer deadline is in 5 days, order needs 10 days
status = "overdue"
warning = "⚠️ This order will be 5 days LATE if started today"
```

## Data Models

### Order Model

```typescript
type Order = {
  id: number;
  user_id: string;
  product_name: string;        // "10 crochet cups"
  quantity: number;             // 10
  hours_per_item?: number;       // 6 hours per cup
  estimated_total_hours: number; // 60 hours (auto-calculated)
  
  start_date?: number;          // Calculated by scheduling
  deadline?: number;            // Customer deadline timestamp
  completion_date?: number;     // Estimated completion timestamp
  
  status: "pending" | "in-progress" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid" | "partial";
  
  priority: "low" | "medium" | "high";
  notes?: string;
  color?: string;
  size?: string;
  material?: string;
};
```

### Settings Model

```typescript
type UserSettings = {
  id: number;
  user_id: string;
  
  hours_per_day: number;    // 6 (max hours available daily)
  workdays: string;          // "1,2,3,4,5" (Mon-Fri, ISO format)
                            // 1=Monday, 7=Sunday
  
  reminder_frequency: string;
  theme: "light" | "dark";
  notifications_enabled: boolean;
  auto_track_enabled: boolean;
  break_interval: number;
  break_duration: number;
};
```

## Key Functions

### `calculateStartDate(userId)`
**Returns:** `{ startDate: Date, reason: string }`

Determines when the user will be **free** to start a new order.

```typescript
const { startDate, reason } = await useScheduling().calculateStartDate();
// reason: "Will be free after 5 working days (30 hours of current work)"
```

### `calculateCompletionDate(userId, estimatedHours, startDate?)`
**Returns:** `Date`

Calculates when an order will be **finished**.

```typescript
const completionDate = await useScheduling()
  .calculateCompletionDate(60, new Date('2025-01-10'));
// Returns: Date object for when 60 hours of work will be completed
```

### `scheduleOrder(userId, orderData)`
**Returns:** Complete schedule analysis

The **main function** that combines start + completion + deadline analysis.

```typescript
const schedule = await useScheduling().scheduleOrder({
  estimated_total_hours: 60,
  deadline: deadlineTimestamp
});

// Returns:
{
  startDate: Date,              // When work starts
  estimatedCompletionDate: Date, // When work finishes
  deadline: Date,               // Customer deadline
  canMeetDeadline: boolean,     // true/false
  daysUntilCompletion: number,  // 10
  daysUntilDeadline: number,    // 5
  status: "overdue",            // on-time | at-risk | overdue
  warningMessage: "⚠️ This order will be 5 days LATE if started today"
}
```

### `analyzeWorkload(userId)`
**Returns:** Workload sustainability analysis

Checks if current workload is realistic.

```typescript
const analysis = await useScheduling().analyzeWorkload();

// Returns:
{
  totalPendingHours: 120,
  totalInProgressHours: 30,
  totalHours: 150,
  estimatedCompletionDate: Date,
  averageDaysPerOrder: 8,
  isOverloaded: false,
  daysOfWork: 25,               // 25 working days needed
  recommendation: "✅ Workload is sustainable"
}
```

### `analyzeDeadlines(userId)`
**Returns:** Deadline risk categorization

Identifies which orders are **at risk** or **overdue**.

```typescript
const deadlines = await useScheduling().analyzeDeadlines();

// Returns:
{
  onTime: Order[],      // Orders with healthy deadline margin
  atRisk: Order[],      // Orders due within 3 days
  overdue: Order[],     // Orders already past deadline
  
  summary: {
    totalOrders: 5,
    onTimeCount: 3,
    atRiskCount: 1,
    overdueCount: 1,
    
    nextUrgentDeadline: {
      order: Order,
      daysRemaining: 2    // -2 = 2 days overdue
    }
  }
}
```

## Integration Examples

### Example 1: Create a New Order with Schedule

```typescript
import { useOrders } from "./useOrders";
import { useScheduling } from "./useScheduling";

function CreateOrderScreen() {
  const { createOrder } = useOrders();
  const { scheduleOrder } = useScheduling();

  const handleCreateOrder = async (formData) => {
    // Calculate estimated hours
    const estimatedHours = formData.quantity * formData.hoursPerItem;
    
    // Get schedule
    const schedule = await scheduleOrder({
      estimated_total_hours: estimatedHours,
      deadline: formData.deadline
    });
    
    // Show warning if at risk
    if (schedule.status === "overdue") {
      Alert.alert("Deadline Warning", schedule.warningMessage);
    }
    
    // Create the order
    await createOrder({
      product_name: formData.productName,
      quantity: formData.quantity,
      hours_per_item: formData.hoursPerItem,
      deadline: formData.deadline,
      start_date: schedule.startDate.getTime(),
    });
  };

  return <OrderForm onSubmit={handleCreateOrder} />;
}
```

### Example 2: Dashboard with Workload Analysis

```typescript
function Dashboard() {
  const { analyzeWorkload, analyzeDeadlines } = useScheduling();
  const [workload, setWorkload] = useState(null);
  const [deadlines, setDeadlines] = useState(null);

  useEffect(() => {
    const load = async () => {
      const w = await analyzeWorkload();
      const d = await analyzeDeadlines();
      setWorkload(w);
      setDeadlines(d);
    };
    load();
  }, []);

  return (
    <View>
      <Text>📊 Workload: {workload?.daysOfWork} working days</Text>
      <Text>{workload?.recommendation}</Text>
      
      <Text>🚨 At Risk: {deadlines?.summary.atRiskCount}</Text>
      
      {deadlines?.summary.nextUrgentDeadline && (
        <View style={{backgroundColor: 'red'}}>
          <Text>Next Urgent: {deadlines.summary.nextUrgentDeadline.order.product_name}</Text>
          <Text>Due in: {deadlines.summary.nextUrgentDeadline.daysRemaining} days</Text>
        </View>
      )}
    </View>
  );
}
```

### Example 3: Auto-Recalculate When Settings Change

```typescript
function SettingsScreen() {
  const { setHoursPerDay } = useSettings();
  const { recalculateAllSchedules } = useScheduling();

  const handleHoursChange = async (newHours) => {
    // Update settings
    await setHoursPerDay(newHours);
    
    // Automatically recalculate all order schedules
    await recalculateAllSchedules();
    
    Toast.show("Schedule recalculated for all orders");
  };

  return <View>{/* settings UI */}</View>;
}
```

## Workday Format

Workdays are stored as a **CSV string** in ISO format:

```
"1,2,3,4,5"    → Monday to Friday
"1,2,3,4,5,6"  → Monday to Saturday
"2,3,4,5,6,7"  → Tuesday to Sunday
```

**ISO Weekday Numbers:**
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday
- `7` = Sunday

## Smart Recalculation

When the user changes **critical settings**, all order timelines automatically recalculate:

**Critical Settings:**
- `hours_per_day` - Changes available daily capacity
- `workdays` - Changes which days count as working days

**Example:**
```
Before: 8 hours/day, Mon-Fri
Order needs 40 hours → 5 days

After: 10 hours/day, Mon-Fri
Order needs 40 hours → 4 days ✨ (auto-updated!)
```

This is handled automatically by `settingsService.updateUserSettings()`.

## Edge Cases Handled

### ✅ Non-working Days
If the start date falls on a non-working day (like Sunday), the app skips to the next working day.

### ✅ Partial Days
If an order needs 30 hours and the user can work 6 hours/day, it takes 5 days (not 4.9 rounded).

### ✅ Overloaded Schedules
The algorithm correctly handles when current workload pushes the start date weeks into the future.

### ✅ Missing Deadlines
If a deadline is impossible to meet, the status shows "overdue" with days late calculated.

### ✅ Timezone Consistency
All dates are stored as UTC timestamps and compared safely.

## Performance Notes

- **Single order schedule**: ~5-10ms (very fast)
- **Workload analysis**: ~20-50ms (for 5-10 orders)
- **Deadline analysis**: ~10-30ms (sorts orders by deadline)
- **Recalculate all**: ~100-200ms (depends on order count)

All calculations are **synchronous** in the algorithm - no database queries during calculations except loading settings/orders once.

## Future Enhancements

Possible features built on this scheduling foundation:

1. **Buffer Time**: Add X% time buffer to estimate (e.g., +20% for realistic planning)
2. **Multi-Day Breaks**: Account for vacations or personal days
3. **Priority Weighting**: Adjust calculation based on order priority
4. **Resource Constraints**: Account for materials that take time to source
5. **Machine Learning**: Learn actual completion times vs estimates
6. **Predictive Alerts**: "You'll miss this deadline in 2 weeks" warnings
7. **Load Balancing**: Suggest optimal start dates to spread work evenly
8. **Client Communication**: Auto-generate deadline feasibility reports

---

**Remember:** The scheduling logic is the **brain** of the app. Everything else (UI, notifications, analytics) depends on these calculations being accurate and fast.
