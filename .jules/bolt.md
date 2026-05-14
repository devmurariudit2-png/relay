## 2024-05-24 - Optimizing Float Boundary Matches in O(n) Time
**Learning:** When moving from an O(n²) nested loop to an O(n) hash map lookup for reconciliations, grouping float amounts directly by `Math.round(amount * 100)` creates rounding boundary edge cases. A bank tx amount of `100.004` (key: 10000) and an internal tx amount of `100.006` (key: 10001) would miss a match despite having a valid `< 0.01` diff.
**Action:** Always check `key - 1`, `key`, and `key + 1` when using rounded amount keys in HashMaps to evaluate fuzzy (<0.01) constraints, eliminating nested loops safely.
