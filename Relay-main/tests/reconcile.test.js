import { describe, it, expect } from 'vitest';
const { reconcile } = require('../utils/reconcileEngine');

describe('Reconciliation Engine', () => {
  
  it('should match transactions with exact reference and amount', () => {
    const bank = [{ id: 'b1', amount: 100, reference: 'REF1', date: '2024-01-01', source: 'bank' }];
    const internal = [{ id: 'i1', amount: 100, reference: 'REF1', date: '2024-01-01', source: 'internal' }];
    
    const result = reconcile(bank, internal);
    
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]).toEqual({ bankId: 'b1', internalId: 'i1' });
    expect(result.unmatchedIds).toHaveLength(0);
  });

  it('should match transactions with same amount and date within 3 days without reference', () => {
    const bank = [{ id: 'b1', amount: 250.50, reference: null, date: '2024-01-01', source: 'bank' }];
    const internal = [{ id: 'i1', amount: 250.50, reference: 'OTHER', date: '2024-01-03', source: 'internal' }];
    
    const result = reconcile(bank, internal);
    
    expect(result.matches).toHaveLength(1);
    expect(result.unmatchedIds).toHaveLength(0);
  });

  it('should not match transactions if date difference is > 3 days', () => {
    const bank = [{ id: 'b1', amount: 100, reference: null, date: '2024-01-01', source: 'bank' }];
    const internal = [{ id: 'i1', amount: 100, reference: null, date: '2024-01-05', source: 'internal' }];
    
    const result = reconcile(bank, internal);
    
    expect(result.matches).toHaveLength(0);
    expect(result.unmatchedIds).toContain('b1');
    expect(result.unmatchedIds).toContain('i1');
  });

  it('should detect duplicate transactions (same source, amount, ref, within 1 day)', () => {
    const bank = [
      { id: 'b1', amount: 100, reference: 'REF1', date: '2024-01-01', source: 'bank' },
      { id: 'b2', amount: 100, reference: 'REF1', date: '2024-01-01', source: 'bank' }
    ];
    const internal = [];
    
    const result = reconcile(bank, internal);
    
    expect(result.duplicateIds).toContain('b2');
    expect(result.unmatchedIds).toContain('b1'); // b1 is the "original", b2 is the duplicate
  });

  it('should flag transactions over 10,000 as exceptions', () => {
    const bank = [{ id: 'b1', amount: 15000, reference: 'BIG', date: '2024-01-01', source: 'bank' }];
    const internal = [];
    
    const result = reconcile(bank, internal);
    
    expect(result.exceptionIds).toContain('b1');
    expect(result.unmatchedIds).not.toContain('b1');
  });

  it('should handle floating point precision correctly (0.01 threshold)', () => {
    const bank = [{ id: 'b1', amount: 100.001, reference: 'REF1', date: '2024-01-01', source: 'bank' }];
    const internal = [{ id: 'i1', amount: 100.002, reference: 'REF1', date: '2024-01-01', source: 'internal' }];
    
    const result = reconcile(bank, internal);
    
    expect(result.matches).toHaveLength(1);
  });
});
