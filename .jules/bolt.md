## 2024-05-08 - [O(N²) to O(N) in Transaction Reconciliation]
**Learning:** In transaction reconciliation processing large datasets, fuzzy constraints (like dates within 3 days) inside a nested loop lead to O(N²) bottlenecks. By pre-grouping inner candidates in a `Map` using exact match criteria (like amount) first, we can reduce the inner loop's scan scope to O(1) or O(k), effectively turning O(N²) into O(N).
**Action:** When implementing reconciliation or fuzzy matching loops, always pre-group candidates by exact criteria using a Hash Map before evaluating any remaining fuzzy constraints.
