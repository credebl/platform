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
      },
      issued_oid4vc_credentials: {
        deleteMany: jest.fn()
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

  it('commits full-list deactivation before reporting the bitmap is full', async () => {
    const calls: string[] = [];
    const activeList = {
      id: 'allocation-id',
      orgId: 'org-id',
      issuerDid: 'did:example:issuer',
      listId: '00000000-0000-0000-0000-000000000001',
      listSize: 8,
      allocatedCount: 0,
      bitmap: Buffer.from([0b11111111]),
      isActive: true
    };
    const tx = {
      $executeRaw: jest.fn(() => Promise.resolve(1)),
      status_list_allocation: {
        findFirst: jest.fn(() => Promise.resolve(activeList)),
        update: jest.fn(() => {
          calls.push('deactivate');
          return Promise.resolve(activeList);
        }),
        updateMany: jest.fn(() => Promise.resolve({ count: 1 })),
        create: jest.fn()
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback) => {
        const result = await callback(tx);
        calls.push('commit');
        return result;
      })
    };

    await expect(
      new StatusListAllocatorService(prisma as never).allocate(
        activeList.orgId,
        activeList.issuerDid,
        activeList.listSize
      )
    ).rejects.toThrow('Status list bitmap is full');
    expect(tx.status_list_allocation.update).toHaveBeenCalledWith({
      where: { id: activeList.id },
      data: { isActive: false }
    });
    expect(calls).toEqual(['deactivate', 'commit']);
  });

  it('removes a persisted credential before releasing its status-list slot', async () => {
    const calls: string[] = [];
    const allocation = {
      id: 'allocation-id',
      orgId: 'org-id',
      issuerDid: 'did:example:issuer',
      listId: '00000000-0000-0000-0000-000000000001',
      listSize: 8,
      allocatedCount: 1,
      bitmap: Buffer.from([0b00000001]),
      isActive: true
    };
    const tx = {
      $executeRaw: jest.fn(() => Promise.resolve(1)),
      issued_oid4vc_credentials: {
        deleteMany: jest.fn(() => {
          calls.push('delete-credential');
          return Promise.resolve({ count: 1 });
        })
      },
      status_list_allocation: {
        findUnique: jest.fn(() => Promise.resolve(allocation)),
        update: jest.fn(() => {
          calls.push('release-slot');
          return Promise.resolve(allocation);
        })
      }
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(tx))
    };

    await new StatusListAllocatorService(prisma as never).release(allocation.listId, 0);

    expect(tx.issued_oid4vc_credentials.deleteMany).toHaveBeenCalledWith({
      where: { listId: allocation.listId, index: 0 }
    });
    expect(calls).toEqual(['delete-credential', 'release-slot']);
  });
});
