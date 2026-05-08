# 📊 Visual Scheduling Guide

## The Scheduling Timeline Concept

```
CURRENT WORKLOAD + NEW ORDER
═══════════════════════════════════════════════════════════════════

Today (Monday)
│
├─ Order A: 24 hours (4 days)
│  ├─ Mon: 6h ─┐
│  ├─ Tue: 6h  │ Finished Friday
│  ├─ Wed: 6h  │
│  └─ Thu: 6h ─┘
│
├─ Order B: 18 hours (3 days)
│  ├─ Fri: 6h ─┐
│  ├─ Mon: 6h  │ Finished Wednesday
│  └─ Tue: 6h ─┘
│
├─ YOU'RE FREE from Thursday onward
│
└─ NEW ORDER: 60 hours (10 days)
   ├─ Thu: 6h ──┐
   ├─ Fri: 6h   │
   ├─ Mon: 6h   │
   ├─ Tue: 6h   │ Finished Friday
   ├─ Wed: 6h   │ (2 weeks later)
   ├─ Thu: 6h   │
   ├─ Fri: 6h   │
   ├─ Mon: 6h   │
   ├─ Tue: 6h   │
   └─ Wed: 6h ──┘

RESULT:
─────────
Start Date: Thursday (after current work)
Completion: Friday (2 weeks later)
If deadline is before then: STATUS = ⚠️ AT-RISK or 🚨 OVERDUE
```

## Decision Tree: Should You Accept This Order?

```
                        ┌─── New Order Request ───┐
                        │ 10 items × 6 hours each │
                        │ Deadline: 10 days       │
                        └─────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │ Schedule Algorithm              │
                    │ 1. Calculate start date         │
                    │ 2. Calculate completion date    │
                    │ 3. Compare vs deadline          │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼─────────────────┐
                    │ Result:                         │
                    │ Start: Friday (after current)   │
                    │ Complete: 2 weeks later (Friday)│
                    │ Deadline: 10 days (Mon)         │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼─────────────────┐
                    │ Status: 🚨 OVERDUE              │
                    │ Will be 4 days LATE             │
                    └────────────────┬────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
   ❌ DECLINE              ⚠️ ACCEPT BUT WARN        ✅ SPEED UP
   Not feasible         Mark in yellow/orange     Increase hours
   Can't meet           in calendar & alerts      Can now do in 8 days
   deadline                                       Status: ✅ ON-TIME
```

## Workload Visualization

```
LOW WORKLOAD (5 days)       MODERATE (15 days)      OVERLOADED (25 days)
═════════════════════════════════════════════════════════════════════

Mon ███                      Mon ███                  Mon ███
Tue ███                      Tue ███                  Tue ███
Wed ███                      Wed ███                  Wed ███
Thu ███                      Thu ███                  Thu ███
Fri ███                      Fri ███                  Fri ███
                            
Mon (empty)                 Mon ███                  Mon ███
Tue (empty)                 Tue ███                  Tue ███
                            Wed ███                  Wed ███
                            Thu ███                  Thu ███
                            Fri ███                  Fri ███

                                                   Mon ███
                                                   Tue ███
                                                   Wed ███
                                                   Thu ███
                                                   Fri ███

Status: ✅                  Status: 📊              Status: 🚨
Sustainable                Manageable              TOO MUCH
                           Watch capacity         Need help
```

## Deadline Status Colors

```
ON-TIME                     AT-RISK                 OVERDUE
(Green)                     (Yellow/Orange)         (Red)

Customer Deadline: 10 days  Customer Deadline: 7 days  Customer Deadline: 5 days
Completion: 8 days         Completion: 8 days         Completion: 10 days
Buffer: 2 days ✅          Buffer: -1 day ⚠️         Buffer: -5 days 🚨

┌─────────────┐             ┌─────────────┐           ┌─────────────┐
│ ORDER       │             │ ORDER       │           │ ORDER       │
├─────────────┤             ├─────────────┤           ├─────────────┤
│ Complete:   │             │ Complete:   │           │ Complete:   │
│ Day 8 ✅    │             │ Day 8 ⚠️    │           │ Day 10 🚨   │
│             │             │             │           │             │
│ Deadline:   │             │ Deadline:   │           │ Deadline:   │
│ Day 10      │             │ Day 7       │           │ Day 5       │
│             │             │             │           │             │
│ Status:     │             │ Status:     │           │ Status:     │
│ Good! ✅    │             │ TIGHT! ⚠️   │           │ LATE! 🚨    │
└─────────────┘             └─────────────┘           └─────────────┘
```

## Settings Change Impact

```
BEFORE                          CHANGE                    AFTER
═══════════════════════════════════════════════════════════════════

Hours/day: 6                    User changes to: 8        Hours/day: 8
Workdays: Mon-Fri              hours/day                 Workdays: Mon-Fri

Order 1: 60 hours              🔄 Recalculation         Order 1: 60 hours
├─ Start: Friday               └──────────────>          ├─ Start: Friday (same)
├─ Completion: Day 12          TRIGGERED                ├─ Completion: Day 9
└─ Status: ⚠️ AT-RISK                                    └─ Status: ✅ ON-TIME

Order 2: 40 hours                                       Order 2: 40 hours
├─ Start: Wed (week 2)                                  ├─ Start: Wed (week 2)
├─ Completion: Day 22                                   ├─ Completion: Day 19
└─ Status: ✅ ON-TIME                                   └─ Status: ✅ ON-TIME

Workload: 20 days 🚨                                    Workload: 16 days 📊
Recommendation: TOO MUCH                                Recommendation: MANAGEABLE
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
│  [Create Order Form] [Dashboard] [Settings] [Order List]    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │  React Hooks Layer  │
                │ useScheduling()     │
                │ useOrders()         │
                │ useSettings()       │
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐     ┌─────────────┐     ┌─────────────┐
   │Scheduling│     │Orders       │     │Settings     │
   │Service   │     │Service      │     │Service      │
   ├─────────┤     ├─────────────┤     ├─────────────┤
   │Calculate │     │Create       │     │Update       │
   │StartDate │────▶│Order        │────▶│Settings     │
   │          │     │             │     │             │
   │Calculate │     │Update Order │     │Recalculate  │
   │Completion│     │             │     │Timelines    │
   │          │     │Get Orders   │     │             │
   │Schedule  │     │             │     │Validate     │
   │Order     │     │Delete Order │     │             │
   │          │     │             │     │             │
   │Analyze   │     │Status       │     │             │
   │Workload  │     │Updates      │     │             │
   │          │     │             │     │             │
   │Analyze   │     │Stats        │     │             │
   │Deadlines │     │             │     │             │
   └────┬─────┘     └──────┬──────┘     └──────┬──────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │      SQLite Database Layer           │
        │                                      │
        │  ┌─────────────────────────────┐   │
        │  │ orders table                │   │
        │  │ ├─ id                       │   │
        │  │ ├─ product_name             │   │
        │  │ ├─ estimated_total_hours    │   │
        │  │ ├─ start_date               │   │
        │  │ ├─ deadline                 │   │
        │  │ ├─ completion_date          │   │
        │  │ ├─ status                   │   │
        │  │ └─ ...                      │   │
        │  └─────────────────────────────┘   │
        │                                      │
        │  ┌─────────────────────────────┐   │
        │  │ user_settings table          │   │
        │  │ ├─ hours_per_day             │   │
        │  │ ├─ workdays                  │   │
        │  │ ├─ theme                     │   │
        │  │ └─ ...                       │   │
        │  └─────────────────────────────┘   │
        │                                      │
        └──────────────────────────────────────┘
```

## Scheduling Algorithm Flow

```
START: User wants to create order
└─ Input: 60 hours needed, deadline in 10 days
   │
   ├─ STEP 1: Get current workload
   │  └─ Query orders where status != 'completed'
   │     └─ Found: Order A (24h), Order B (18h)
   │        └─ Total: 42 hours
   │
   ├─ STEP 2: Calculate when user will be free
   │  └─ Current work: 42 hours
   │     Hours/day: 6
   │     42 ÷ 6 = 7 days
   │     └─ Today is Monday
   │        Count forward 7 working days (skip weekends)
   │        Mon, Tue, Wed, Thu, Fri, Mon, Tue, Wed (7 days)
   │        └─ USER WILL BE FREE: WEDNESDAY
   │           └─ START DATE = Wednesday
   │
   ├─ STEP 3: Calculate completion date
   │  └─ New order: 60 hours
   │     60 ÷ 6 = 10 days
   │     Starting Wednesday
   │     Count forward 10 working days
   │     Wed, Thu, Fri, Mon, Tue, Wed, Thu, Fri, Mon, Tue (10 days)
   │     └─ COMPLETION DATE = TUESDAY (2 weeks later)
   │
   ├─ STEP 4: Compare against deadline
   │  └─ Completion: Tuesday (in 15 days total)
   │     Deadline: 10 days
   │     Diff: 15 - 10 = 5 days LATE
   │     └─ STATUS = 🚨 OVERDUE
   │
   ├─ STEP 5: Generate warning
   │  └─ "⚠️ This order will be 5 days LATE if started today"
   │
   └─ RETURN to component:
      {
        startDate: Date(Wednesday),
        estimatedCompletionDate: Date(Tuesday, 2 weeks),
        deadline: Date(10 days),
        status: "overdue",
        warning: "⚠️ This order will be 5 days LATE if started today",
        canMeetDeadline: false,
        daysUntilCompletion: 15,
        daysUntilDeadline: 10
      }
```

## Real Example: Crochet Cup Order

```
SCENARIO:
─────────
You make crochet cups. Each takes 6 hours.
Customer orders: 10 cups = 60 hours
Deadline: 2 weeks from now

YOUR SCHEDULE:
───────────────
Work 6 hours/day, Monday-Friday only
Currently working on:
  - Order A: 10 cups (60 hours) - 50% done = 30 hours left
  - Order B: 5 cups (30 hours) - just started

CALCULATION:
────────────

Current work = 30 + 30 = 60 hours

When can you start Order C (the new rush order)?
  60 hours ÷ 6 hours/day = 10 working days
  Today is Monday Feb 3
  
  Week 1: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5)
  Week 2: Mon(6), Tue(7), Wed(8), Thu(9), Fri(10)
  
  So you'll be free Monday Feb 17

When will you finish Order C?
  New order = 60 hours
  60 hours ÷ 6 hours/day = 10 working days
  Starting Monday Feb 17
  
  Week 3: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5)
  Week 4: Mon(6), Tue(7), Wed(8), Thu(9), Fri(10)
  
  You'll finish Friday Mar 3 (2 weeks after starting Feb 17)

Can you meet the deadline?
  Deadline: 2 weeks from today = Friday Feb 17
  You'll finish: Friday Mar 3 (3 weeks from today)
  
  Result: ❌ LATE by 2 weeks!
  
WHAT THE APP SHOWS:
───────────────────

  Start Date: Monday Feb 17
  Completion: Friday Mar 3
  Deadline: Friday Feb 17
  Days Late: 14 days
  
  🚨 STATUS: OVERDUE
  ⚠️ WARNING: "This order will be 14 days LATE if started today"
  
USER OPTIONS:
──────────────

  1. Decline the order ❌
  2. Try to negotiate deadline ⏳
  3. Speed up (8 hours/day instead of 6) ⚡
     └─ Would finish: Thursday Mar 1 (still 2 days late)
  4. Hire help or use different approach 👥

WHAT HAPPENS WITH 8 HOURS/DAY:
───────────────────────────────

  Current work = 60 hours
  60 ÷ 8 = 7.5 = 8 days (finish Thursday Feb 13)
  
  New order = 60 hours
  60 ÷ 8 = 7.5 = 8 days
  Starting Friday Feb 14
  
  8 working days from Friday Feb 14 = Friday Feb 21
  
  Deadline: Friday Feb 17
  You'll finish: Friday Feb 21
  
  Result: Still 4 days late ❌
  
  🟠 STATUS: STILL OVERDUE (but better!)

DECISION:
──────────

  Even working 8 hours/day, you'd be 4 days late.
  Need to either:
  - Decline ❌
  - Negotiate deadline to Feb 24+ ✅
  - Get someone else to help 👥
```

---

This visual guide helps understand:
1. ✅ How the algorithm works step-by-step
2. ✅ What status warnings mean
3. ✅ How to make business decisions
4. ✅ Why settings changes matter
5. ✅ Real-world scenarios and solutions
