## 2024-06-25 - [Reconciliation Engine] Eliminate O(n²) bottleneck in matching logic
**Learning:** The reconciliation logic involved a nested loop iterating over all bank transactions and all internal transactions to find matches based on amount and date. In high volume scenarios (e.g., 50k transactions), this O(n²) time complexity causes severe performance degradation (~9.2s).
**Action:** Always watch out for nested loops when comparing large datasets. Implement O(n) hash map lookups (e.g. indexing transactions by amount first) to dramatically reduce processing time (~100ms for 50k items).
