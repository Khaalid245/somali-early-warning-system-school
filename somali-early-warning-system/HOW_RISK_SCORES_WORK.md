# 📊 How Risk Scores Are Calculated

## Simple Explanation

The system calculates a **Risk Score** for each student based on their attendance. This score helps identify students who need help.

---

## 🔢 Step-by-Step Calculation

### Step 1: Calculate Absence Rate for Each Subject

For each subject (Math, English, Science, etc.):

```
Absence Rate = (Number of Absences ÷ Total Sessions) × 100
```

**Example:**
- Math: Student missed 2 out of 10 classes
- Absence Rate = (2 ÷ 10) × 100 = **20%**

---

### Step 2: Calculate Average Absence Rate

Average all subject absence rates:

```
Average Absence Rate = Sum of all subject absence rates ÷ Number of subjects
```

**Example:**
- Math: 20%
- English: 30%
- Science: 10%
- Average = (20 + 30 + 10) ÷ 3 = **20%**

---

### Step 3: Add Penalty Points for Streaks

#### Subject Streak (Missing same subject multiple times in a row)
- **3-4 absences in a row**: +15 points
- **5-6 absences in a row**: +25 points
- **7+ absences in a row**: +40 points

#### Full Day Streak (Missing all classes on same day)
- **3-4 full days missed**: +25 points
- **5+ full days missed**: +40 points

---

### Step 4: Calculate Final Risk Score

```
Risk Score = Average Absence Rate + Subject Streak Penalty + Full Day Streak Penalty
```

**Example:**
- Average Absence Rate: 20%
- Subject Streak: 3 absences in Math (+15 points)
- Full Day Streak: 2 full days (+0 points)
- **Final Risk Score = 20 + 15 + 0 = 35**

---

## 🎯 Risk Levels

Based on the final score:

| Risk Score | Risk Level | What It Means | Action |
|------------|------------|---------------|--------|
| 0-29 | 🟢 **Low** | Student is doing well | Keep monitoring |
| 30-54 | 🟡 **Medium** | Some concern | Watch closely |
| 55-74 | 🟠 **High** | Needs help | Create alert + intervention case |
| 75-100 | 🔴 **Critical** | Urgent help needed | Immediate intervention required |

---

## 🔄 When Is It Calculated?

The risk score is **automatically recalculated** every time:
- ✅ A teacher takes attendance
- ✅ An attendance record is updated
- ✅ A new session is completed

---

## 📚 How Many Subjects Are Counted?

**All subjects assigned to the student's classroom** are counted:

1. Admin creates subjects (Math, English, Science, etc.)
2. Admin assigns subjects to classrooms
3. Students enrolled in that classroom automatically get all those subjects
4. Each subject's attendance is tracked separately
5. All subjects are averaged together for the final risk score

**Example:**
- Classroom: Grade 10A
- Subjects assigned: Math, English, Science, History, PE (5 subjects)
- All 5 subjects are counted in the risk calculation

---

## 💡 Important Notes

### Why Low Attendance % at First?
- If you just started taking attendance (only 1-2 days), the percentage will be low
- **More attendance sessions = More accurate risk score**
- Example: 1 absence out of 1 session = 100% absence rate (looks bad)
- Example: 1 absence out of 20 sessions = 5% absence rate (more accurate)

### Excused vs Unexcused Absences
- **Excused absences** (sick with doctor's note) are tracked separately
- They still count toward attendance % but are shown differently
- Teachers can see which absences were excused

### What Triggers Alerts?
- When risk score reaches **High (55+)** or **Critical (75+)**
- System automatically creates an alert
- Alert is assigned to the Form Master
- If no action is taken, it can escalate to admin

### What Triggers Intervention Cases?
- When an alert is created for High/Critical risk
- System automatically creates an intervention case
- Form Master must take action (meet with student, contact parents, etc.)
- Case tracks all actions taken to help the student

---

## 🎓 Real-World Example

**Student: Ahmed**
- Enrolled in Grade 10A
- Subjects: Math, English, Science, History, PE

**Attendance over 10 days:**
- Math: Present 8, Absent 2 → 20% absence rate
- English: Present 7, Absent 3 → 30% absence rate
- Science: Present 9, Absent 1 → 10% absence rate
- History: Present 8, Absent 2 → 20% absence rate
- PE: Present 10, Absent 0 → 0% absence rate

**Calculation:**
1. Average Absence Rate = (20 + 30 + 10 + 20 + 0) ÷ 5 = **16%**
2. Subject Streak: Missed Math 2 times in a row = **+0 points** (less than 3)
3. Full Day Streak: Never missed a full day = **+0 points**
4. **Final Risk Score = 16 + 0 + 0 = 16**
5. **Risk Level = Low (0-29)** ✅

**Result:** Ahmed is doing well, no intervention needed!

---

## 🔥 Missing One Class vs Missing Whole Day

### Scenario 1: Missing ONE Class (e.g., Math)

**Student has 5 subjects: Math, English, Science, History, PE**

**Day 1 Attendance:**
- Math: ❌ Absent (1 absence out of 1 session = 100%)
- English: ✅ Present (0 absences out of 1 session = 0%)
- Science: ✅ Present (0 absences out of 1 session = 0%)
- History: ✅ Present (0 absences out of 1 session = 0%)
- PE: ✅ Present (0 absences out of 1 session = 0%)

**Calculation:**
1. Average Absence Rate = (100 + 0 + 0 + 0 + 0) ÷ 5 = **20%**
2. Subject Streak = 1 (not enough for penalty)
3. Full Day Streak = 0 (didn't miss whole day)
4. **Risk Score = 20 + 0 + 0 = 20**
5. **Risk Level = Low** 🟢

---

### Scenario 2: Missing WHOLE Day (All 5 Classes)

**Student has 5 subjects: Math, English, Science, History, PE**

**Day 1 Attendance:**
- Math: ❌ Absent (1 absence out of 1 session = 100%)
- English: ❌ Absent (1 absence out of 1 session = 100%)
- Science: ❌ Absent (1 absence out of 1 session = 100%)
- History: ❌ Absent (1 absence out of 1 session = 100%)
- PE: ❌ Absent (1 absence out of 1 session = 100%)

**Calculation:**
1. Average Absence Rate = (100 + 100 + 100 + 100 + 100) ÷ 5 = **100%**
2. Subject Streak = 1 for each subject (not enough for penalty)
3. Full Day Streak = 1 (not enough for penalty yet)
4. **Risk Score = 100 + 0 + 0 = 100**
5. **Risk Level = Critical** 🔴

---

### 📊 Comparison Table

| Scenario | Absences | Average Rate | Penalties | Final Score | Risk Level |
|----------|----------|--------------|-----------|-------------|------------|
| **Miss 1 class** | 1 out of 5 | 20% | +0 | **20** | 🟢 Low |
| **Miss whole day** | 5 out of 5 | 100% | +0 | **100** | 🔴 Critical |

### 💡 Key Insight

**Missing a whole day is 5x worse than missing one class!**

- Missing 1 class = 20% absence rate = Low risk
- Missing whole day = 100% absence rate = Critical risk

**But this improves over time:**

After 10 days:
- Miss 1 class total: 1 ÷ 50 sessions = 2% (Very low)
- Miss 1 whole day: 5 ÷ 50 sessions = 10% (Still low)

**That's why more attendance data = more accurate risk scores!**

---

### Scenario 3: Missing 3 CONSECUTIVE Whole Days

**Student has 5 subjects: Math, English, Science, History, PE**

**Days 1-3 Attendance (3 days total = 15 sessions):**
- Day 1: ❌ All 5 subjects absent
- Day 2: ❌ All 5 subjects absent  
- Day 3: ❌ All 5 subjects absent

**Total Absences: 15 out of 15 sessions**

**Calculation:**
1. Average Absence Rate = 15 ÷ 15 = **100%**
2. Subject Streak = 3 consecutive absences per subject (**+15 points penalty**)
3. Full Day Streak = 3 consecutive full days (**+25 points penalty**)
4. **Risk Score = 100 + 15 + 25 = 140** (capped at 100)
5. **Final Risk Score = 100**
6. **Risk Level = Critical** 🔴

**What Happens:**
- 🚨 **Alert automatically created**
- 📋 **Intervention case opened**
- 👨‍🏫 **Form Master notified immediately**
- ⚠️ **Requires urgent action**

---

### 📊 Complete Comparison Table

| Scenario | Days Missed | Total Absences | Avg Rate | Penalties | Final Score | Risk Level | Alert? |
|----------|-------------|----------------|----------|-----------|-------------|------------|--------|
| **1 class** | 0 days | 1/5 sessions | 20% | +0 | **20** | 🟢 Low | No |
| **1 whole day** | 1 day | 5/5 sessions | 100% | +0 | **100** | 🔴 Critical | Yes |
| **3 consecutive days** | 3 days | 15/15 sessions | 100% | +40 | **100** | 🔴 Critical | Yes |

### 🎯 Key Takeaways

1. **Missing 1 class** = Low risk, no action needed
2. **Missing 1 whole day** = Critical risk, alert created
3. **Missing 3 consecutive days** = Critical risk + penalties, urgent intervention

**The streak penalties make consecutive absences even more serious!**

---

## 📞 Questions?

If you have questions about how risk scores work, contact your system administrator.
