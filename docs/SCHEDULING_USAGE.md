# 🚀 Using the Scheduling System - Quick Start Guide

## Installation & Setup

The scheduling system is already integrated into your app. No additional setup needed!

Just import the hooks:

```typescript
import { useScheduling } from "../lib/useScheduling";
import { useOrders } from "../lib/useOrders";
import { useSettings } from "../lib/useSettings";
```

## Quick Usage Examples

### 1️⃣ Calculate When You'll Finish an Order

```typescript
import { useScheduling } from "../lib/useScheduling";

function OrderCard({ order }) {
  const { calculateCompletionDate } = useScheduling();
  const [dueDate, setDueDate] = useState(null);

  useEffect(() => {
    const getDate = async () => {
      const completion = await calculateCompletionDate(order.estimated_total_hours);
      setDueDate(completion);
    };
    getDate();
  }, [order]);

  return (
    <View>
      <Text>{order.product_name}</Text>
      <Text>Will be done: {dueDate?.toLocaleDateString()}</Text>
    </View>
  );
}
```

### 2️⃣ Get Full Schedule When Creating an Order

```typescript
import { useScheduling } from "../lib/useScheduling";
import { useOrders } from "../lib/useOrders";

function CreateOrderForm() {
  const { scheduleOrder } = useScheduling();
  const { createOrder } = useOrders();
  const [schedule, setSchedule] = useState(null);

  const handleQuantityChange = async (qty, hoursPerItem) => {
    const estimatedHours = qty * hoursPerItem;
    
    // Get realistic schedule
    const sched = await scheduleOrder({
      estimated_total_hours: estimatedHours,
      deadline: formData.customerDeadline
    });
    
    setSchedule(sched);
  };

  return (
    <View>
      <TextInput 
        onChangeText={(qty) => handleQuantityChange(qty, formData.hoursPerItem)} 
      />
      
      {schedule && (
        <View>
          <Text>📅 Start Date: {schedule.startDate.toDateString()}</Text>
          <Text>✅ Completion: {schedule.estimatedCompletionDate.toDateString()}</Text>
          
          {schedule.status === "overdue" && (
            <Text style={{color: 'red'}}>
              ⚠️ {schedule.warningMessage}
            </Text>
          )}
          
          {schedule.status === "at-risk" && (
            <Text style={{color: 'orange'}}>
              ⚠️ {schedule.warningMessage}
            </Text>
          )}
          
          {schedule.status === "on-time" && (
            <Text style={{color: 'green'}}>
              ✅ On track for deadline
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
```

### 3️⃣ Show Workload Health on Dashboard

```typescript
import { useScheduling } from "../lib/useScheduling";

function Dashboard() {
  const { analyzeWorkload } = useScheduling();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    analyzeWorkload().then(setAnalysis);
  }, []);

  if (!analysis) return <Text>Loading...</Text>;

  return (
    <View>
      <View style={{padding: 15, backgroundColor: '#f0f0f0'}}>
        <Text style={{fontSize: 18, fontWeight: 'bold'}}>📊 Workload Status</Text>
        
        <View style={{marginTop: 10}}>
          <Text>Total hours: {analysis.totalHours} hours</Text>
          <Text>Working days needed: {analysis.daysOfWork} days</Text>
          <Text>
            Estimated completion: {analysis.estimatedCompletionDate.toLocaleDateString()}
          </Text>
        </View>

        <View 
          style={{
            marginTop: 15,
            padding: 10,
            backgroundColor: analysis.isOverloaded ? '#ffcccc' : '#ccffcc',
            borderRadius: 8
          }}
        >
          <Text style={{fontWeight: 'bold'}}>
            {analysis.recommendation}
          </Text>
        </View>
      </View>
    </View>
  );
}
```

### 4️⃣ Highlight At-Risk Orders

```typescript
import { useScheduling } from "../lib/useScheduling";

function OrdersList() {
  const { analyzeDeadlines } = useScheduling();
  const [deadlines, setDeadlines] = useState(null);

  useEffect(() => {
    analyzeDeadlines().then(setDeadlines);
  }, []);

  if (!deadlines) return <Text>Loading...</Text>;

  return (
    <View>
      {/* On-Time Orders */}
      <Section title="✅ On Time">
        {deadlines.onTime.map(order => (
          <OrderRow key={order.id} order={order} color="green" />
        ))}
      </Section>

      {/* At-Risk Orders */}
      {deadlines.atRisk.length > 0 && (
        <Section title="⚠️ At Risk">
          {deadlines.atRisk.map(order => (
            <OrderRow key={order.id} order={order} color="orange" />
          ))}
        </Section>
      )}

      {/* Overdue Orders */}
      {deadlines.overdue.length > 0 && (
        <Section title="🚨 Overdue">
          {deadlines.overdue.map(order => (
            <OrderRow key={order.id} order={order} color="red" />
          ))}
        </Section>
      )}

      {/* Next Urgent */}
      {deadlines.summary.nextUrgentDeadline && (
        <View style={{backgroundColor: '#fff3cd', padding: 15, margin: 10}}>
          <Text style={{fontWeight: 'bold', fontSize: 16}}>
            🚨 Next Urgent Deadline
          </Text>
          <Text>
            {deadlines.summary.nextUrgentDeadline.order.product_name}
          </Text>
          <Text>
            {deadlines.summary.nextUrgentDeadline.daysRemaining > 0 
              ? `Due in ${deadlines.summary.nextUrgentDeadline.daysRemaining} days`
              : `${Math.abs(deadlines.summary.nextUrgentDeadline.daysRemaining)} days overdue`
            }
          </Text>
        </View>
      )}
    </View>
  );
}
```

### 5️⃣ Update Settings with Auto-Recalculation

```typescript
import { useSettings } from "../lib/useSettings";
import { useScheduling } from "../lib/useScheduling";

function SettingsScreen() {
  const { setHoursPerDay, validateSettings } = useSettings();
  const { recalculateAllSchedules } = useScheduling();
  const [hours, setHours] = useState(8);

  const handleSave = async () => {
    // Validate
    const validation = await validateSettings({ hours_per_day: hours });
    if (!validation.valid) {
      Alert.alert("Invalid", validation.errors[0]);
      return;
    }

    // Update
    await setHoursPerDay(hours);
    
    // Auto-recalculate all orders
    await recalculateAllSchedules();
    
    Alert.alert("Success", "Settings updated and schedules recalculated");
  };

  return (
    <View>
      <Text>Hours per day:</Text>
      <TextInput
        value={String(hours)}
        onChangeText={(v) => setHours(parseInt(v))}
        keyboardType="number-pad"
      />
      <Button title="Save & Recalculate" onPress={handleSave} />
    </View>
  );
}
```

## Real-World Scenario

Let's trace through a complete example:

### **Scenario: Adding a Rush Order**

**Current Situation:**
- You can work 6 hours/day, Mon-Fri
- You have 2 active orders:
  - Order A: 24 hours (4 days of work)
  - Order B: 18 hours (3 days of work)
- Total: 42 hours = 7 days of work
- If today is Monday, you'll be free next Monday

**New Order Comes In:**
- Customer wants: 10 crochet cups
- Each cup: 6 hours
- Total: 60 hours
- Customer deadline: 2 weeks from now

**What the App Calculates:**

```
1. Current workload = 42 hours
   42 ÷ 6 hours/day = 7 working days
   Starting Monday → finish Friday of next week
   → Start Date = Friday (Aug 9)

2. New order = 60 hours
   60 ÷ 6 hours/day = 10 working days
   Starting Friday (Aug 9) → finish Thursday of following week (Aug 22)
   → Completion = Thursday Aug 22

3. Deadline is 2 weeks from now = Aug 15
   Completion (Aug 22) > Deadline (Aug 15)
   → Will be 7 days late!

4. Status = "overdue"
   Warning: "⚠️ This order will be 7 days LATE if started today"

5. Recommendation:
   - Finish current orders faster (increase hours/day? delegate?)
   - Negotiate deadline with customer
   - Reduce scope of new order
```

**User Actions:**
- Sees the warning
- Decides to increase hours/day to 8
- Saves setting
- App auto-recalculates:
  - Current work: 42h ÷ 8h/day = 5.25 = 6 days (finish Wed instead of Fri)
  - New order: 60h ÷ 8h/day = 7.5 = 8 days
  - Completion: Wed + 8 days = Thu Aug 16 ✅ (1 day after deadline!)

---

## Common Patterns

### Pattern 1: Show Estimated Hours as User Types

```typescript
const handleQuantityChange = (qty) => {
  const hours = qty * 6; // assuming 6 hours per item
  setEstimatedHours(hours);
  
  scheduleOrder({estimated_total_hours: hours})
    .then(schedule => setEstimate(schedule));
};

return (
  <View>
    <TextInput onChangeText={handleQuantityChange} />
    {estimate && (
      <Text>
        Will take {estimate.daysUntilCompletion} days
        (finish {estimate.estimatedCompletionDate.toDateString()})
      </Text>
    )}
  </View>
);
```

### Pattern 2: Color-Code by Status

```typescript
const getStatusColor = (status) => {
  switch(status) {
    case 'on-time': return '#4CAF50'; // green
    case 'at-risk': return '#FF9800'; // orange
    case 'overdue': return '#F44336'; // red
    default: return '#999';
  }
};

return (
  <View style={{borderLeftWidth: 4, borderLeftColor: getStatusColor(schedule.status)}}>
    {/* Order details */}
  </View>
);
```

### Pattern 3: Suggest Work Days

```typescript
const handleCreate = async (formData) => {
  const schedule = await scheduleOrder({
    estimated_total_hours: formData.hours,
    deadline: formData.deadline
  });
  
  // If at risk, show suggestion
  if (schedule.status === 'at-risk' || schedule.status === 'overdue') {
    const daysNeeded = Math.ceil(
      (schedule.estimatedCompletionDate - new Date()) / (1000 * 60 * 60 * 24)
    );
    const daysSuggested = Math.ceil(
      (schedule.deadline - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    Alert.alert(
      "Rush Order?",
      `This will take ${daysNeeded} days but deadline is ${daysSuggested} days away. Start immediately?`,
      [
        {text: "No", onPress: () => {}},
        {text: "Yes", onPress: () => createOrder({...formData, start_date: Date.now()})}
      ]
    );
  }
};
```

## Testing the Scheduling Logic

You can test the scheduling in your components:

```typescript
// Quick test component
function SchedulingTest() {
  const { scheduleOrder, analyzeWorkload } = useScheduling();

  const runTest = async () => {
    const result = await scheduleOrder({
      estimated_total_hours: 40,
      deadline: Date.now() + 14 * 24 * 60 * 60 * 1000 // 2 weeks
    });
    
    console.log("=== Schedule Result ===");
    console.log(`Start: ${result.startDate.toDateString()}`);
    console.log(`Complete: ${result.estimatedCompletionDate.toDateString()}`);
    console.log(`Status: ${result.status}`);
    console.log(`Message: ${result.warningMessage || 'No warning'}`);
    
    const workload = await analyzeWorkload();
    console.log("=== Workload ===");
    console.log(`Total hours: ${workload.totalHours}`);
    console.log(`Days of work: ${workload.daysOfWork}`);
    console.log(`Overloaded: ${workload.isOverloaded}`);
  };

  return <Button title="Run Test" onPress={runTest} />;
}
```

---

**Next Steps:**
1. Use `scheduleOrder()` in your order creation screen
2. Use `analyzeDeadlines()` on your dashboard
3. Use `analyzeWorkload()` to show capacity warnings
4. Test auto-recalculation when settings change

The scheduling engine is ready to power your app! 🚀
