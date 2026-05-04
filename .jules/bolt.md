## 2024-05-04 - Backend Reconciliation Performance Improvement

**Learning:** `ReconcileService.js` contains a Pass 2 algorithm for matching transactions based on amount and date. It loops through all `bank` transactions and then all `internal` transactions. When there are thousands of records, this O(N^2) loop takes >11s in local benchmarking, causing severe backend blocking, as it performs `new Date(i.date).getTime()` on every iteration inside the nested loop.

**Action:** Optimized the Pass 2 algorithm to use an O(N) hash map lookup approach. By grouping the `internal` transactions by `Math.round(amount * 100)` and then only iterating over matching amount candidates for each `bank` transaction, time complexity dropped from O(N^2) to near O(N), bringing execution time from >11000ms down to ~16ms for 5000 records.
