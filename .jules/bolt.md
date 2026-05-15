## 2024-05-24 - Optimize ReconcileEngine Pass 2
**Learning:** The reconciliation engine processes large datasets. Pass 2 fuzzy matched dates (within 3 days) and exact amounts (within 0.01 threshold) using nested loops O(N^2). This was highly performance-critical.
**Action:** Used an O(N) approach by pre-grouping internal candidates in a Map using the rounded amount (Math.round(amount * 100)) as a key. When matching amounts within a 0.01 threshold, map lookups must check key - 1, key, and key + 1 to prevent missing valid matches across rounding boundaries.
