/* eslint-disable camelcase */
import { RandomBitmapIndexAllocator, StatusListAllocatorService } from './status-list-allocator.service';

describe('RandomBitmapIndexAllocator', () => {
  it('does not allocate an existing index', () => {
    const allocator = new RandomBitmapIndexAllocator(8, new Uint8Array([0b11111110]));
    expect(allocator.allocate()).toBe(0);
    expect(allocator.getAllocatedCount()).toBe(8);
    expect(() => allocator.allocate()).toThrow('No indexes left');
  });

  it('releases an allocated index', () => {
    const allocator = new RandomBitmapIndexAllocator(8, new Uint8Array([0b00000001]));
    allocator.release(0);
    expect(allocator.isIndexAllocated(0)).toBe(false);
    expect(allocator.getAllocatedCount()).toBe(0);
  });
});

describe('StatusListAllocatorService', () => {
  it('takes a transaction-scoped lock before reading the active list', async () => {
    const calls: string[] = [];
    const activeList = {
      id: 'allocation-id',
      orgId: 'org-id',
      issuerDid: 'did:example:issuer',
      listId: '00000000-0000-0000-0000-000000000001',
      listSize: 8,
      allocatedCount: 0,
      bitmap: Buffer.from([0]),
      isActive: true
    };
    const tx = {
      $executeRaw: jest.fn(() => {
        calls.push('lock');
        return Promise.resolve(1);
      }),
      status_list_allocation: {
        findFirst: jest.fn(() => {
          calls.push('find');
          return Promise.resolve(activeList);
        }),
        update: jest.fn(() => Promise.resolve(activeList)),
        updateMany: jest.fn(),
        create: jest.fn()
      }
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(tx))
    };

    const result = await new StatusListAllocatorService(prisma as never).allocate(
      activeList.orgId,
      activeList.issuerDid,
      activeList.listSize
    );

    expect(calls.slice(0, 2)).toEqual(['lock', 'find']);
    expect(result.listId).toBe(activeList.listId);
    expect(tx.status_list_allocation.update).toHaveBeenCalledTimes(1);
  });
});
