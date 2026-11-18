/* eslint-disable camelcase */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { issued_oid4vc_credentials } from '@prisma/client';
import { CommonConstants } from '@credebl/common/common.constant';
import { randomInt, randomUUID } from 'crypto';

export class RandomBitmapIndexAllocator {
  private bitmap: Uint8Array;
  private capacity: number;
  private allocatedCount: number;

  constructor(capacity: number, existing?: Uint8Array) {
    this.capacity = capacity;
    this.bitmap = existing ? new Uint8Array(existing) : new Uint8Array(Math.ceil(capacity / 8));

    this.allocatedCount = 0;

    for (const byte of this.bitmap) {
      if (0 !== byte) {
        this.allocatedCount += byte.toString(2).split('1').length - 1;
      }
    }
  }

  private isSet(index: number): boolean {
    const byteIndex = index >> 3;
    const bit = index & 7;
    return 0 !== (this.bitmap[byteIndex] & (1 << bit));
  }

  private set(index: number): void {
    const byteIndex = index >> 3;
    const bit = index & 7;
    this.bitmap[byteIndex] |= 1 << bit;
  }

  private clear(index: number): void {
    const byteIndex = index >> 3;
    const bit = index & 7;
    this.bitmap[byteIndex] &= ~(1 << bit);
  }

  public allocate(): number {
    if (this.allocatedCount === this.capacity) {
      throw new Error('No indexes left');
    }

    const maxRandomAttempts = 32;
    for (let i = 0; i < maxRandomAttempts; i++) {
      const idx = randomInt(this.capacity);
      if (!this.isSet(idx)) {
        this.set(idx);
        this.allocatedCount++;
        return idx;
      }
    }

    const startByte = randomInt(this.bitmap.length);
    for (let i = 0; i < this.bitmap.length; i++) {
      const byteIdx = (startByte + i) % this.bitmap.length;
      if (255 !== this.bitmap[byteIdx]) {
        for (let bit = 0; 8 > bit; bit++) {
          const idx = (byteIdx << 3) + bit;
          if (idx < this.capacity && !this.isSet(idx)) {
            this.set(idx);
            this.allocatedCount++;
            return idx;
          }
        }
      }
    }

    throw new Error('No indexes left');
  }

  public isIndexAllocated(index: number): boolean {
    if (0 > index || index >= this.capacity) {
      throw new Error('Invalid index');
    }
    return this.isSet(index);
  }

  public release(index: number): void {
    if (0 > index || index >= this.capacity) {
      throw new Error('Invalid index');
    }

    if (this.isSet(index)) {
      this.clear(index);
      this.allocatedCount--;
    }
  }

  public export(): Uint8Array {
    return new Uint8Array(this.bitmap);
  }

  public getAllocatedCount(): number {
    return this.allocatedCount;
  }
}

@Injectable()
export class StatusListAllocatorService {
  private readonly logger = new Logger(StatusListAllocatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async allocate(orgId: string, issuerDid: string, listSize?: number): Promise<{ listId: string; index: number }> {
    if (!orgId || !issuerDid) {
      throw new Error('orgId and issuerDid are required for status list allocation');
    }
    const defaultListSize = CommonConstants.DEFAULT_STATUS_LIST_SIZE;
    const allocation = await this.prisma.$transaction(async (tx) => {
      // Serialize allocations for the same tenant and issuer. A database-level lock is
      // required because multiple service replicas can execute this code concurrently.
      const allocationLockKey = `${orgId}:${issuerDid}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${allocationLockKey}, 0))`;

      // Find active list or create one
      let activeList = await tx.status_list_allocation.findFirst({
        where: { orgId, issuerDid, isActive: true },
        orderBy: { createDateTime: 'desc' }
      });

      if (!activeList) {
        activeList = await tx.status_list_allocation.create({
          data: {
            orgId,
            issuerDid,
            listId: randomUUID(),
            listSize: listSize || defaultListSize,
            allocatedCount: 0,
            bitmap: Buffer.from(new Uint8Array(Math.ceil((listSize || defaultListSize) / 8))),
            isActive: true
          }
        });
      }

      let allocator = new RandomBitmapIndexAllocator(activeList.listSize, new Uint8Array(activeList.bitmap));

      if (allocator.getAllocatedCount() >= activeList.listSize) {
        await tx.status_list_allocation.updateMany({
          where: { orgId, issuerDid, isActive: true },
          data: { isActive: false }
        });
        activeList = await tx.status_list_allocation.create({
          data: {
            orgId,
            issuerDid,
            listId: randomUUID(),
            listSize: listSize || defaultListSize,
            allocatedCount: 0,
            bitmap: Buffer.from(new Uint8Array(Math.ceil((listSize || defaultListSize) / 8))),
            isActive: true
          }
        });
        allocator = new RandomBitmapIndexAllocator(activeList.listSize, new Uint8Array(activeList.bitmap));
      }

      try {
        const index = allocator.allocate();

        // Update database
        await tx.status_list_allocation.update({
          where: { id: activeList.id },
          data: {
            bitmap: Buffer.from(allocator.export()),
            allocatedCount: allocator.getAllocatedCount()
          }
        });

        return { listId: activeList.listId, index };
      } catch (error) {
        if ('No indexes left' === error.message) {
          // A mismatched bitmap/count should not leave a full list active.
          await tx.status_list_allocation.update({
            where: { id: activeList.id },
            data: { isActive: false }
          });
          return undefined;
        }
        throw error;
      }
    });

    if (!allocation) {
      throw new Error('Status list bitmap is full');
    }

    return allocation;
  }

  async saveCredentialAllocation(
    orgId: string,
    credentialId: string,
    listId: string,
    index: number,
    issuanceSessionId: string,
    statusListUri: string
  ): Promise<void> {
    await this.prisma.issued_oid4vc_credentials.create({
      data: {
        orgId,
        credentialId,
        listId,
        index,
        issuanceSessionId,
        statusListUri
      }
    });
  }

  async getCredentialAllocations(orgId: string, issuanceSessionId: string): Promise<issued_oid4vc_credentials[]> {
    return this.prisma.issued_oid4vc_credentials.findMany({
      where: { orgId, issuanceSessionId }
    });
  }

  async release(listId: string, index: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Use the same relation lock order as the migration before reading either table.
      // ROW SHARE establishes order without serializing normal allocation writes.
      await tx.$executeRaw`LOCK TABLE "issued_oid4vc_credentials" IN ROW SHARE MODE`;
      await tx.$executeRaw`LOCK TABLE "status_list_allocation" IN ROW SHARE MODE`;

      let allocation = await tx.status_list_allocation.findUnique({
        where: { listId }
      });

      if (!allocation) {
        return;
      }

      const allocationLockKey = `${allocation.orgId}:${allocation.issuerDid}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${allocationLockKey}, 0))`;
      allocation = await tx.status_list_allocation.findUnique({
        where: { listId }
      });

      if (!allocation) {
        return;
      }

      const allocator = new RandomBitmapIndexAllocator(allocation.listSize, new Uint8Array(allocation.bitmap));
      allocator.release(index);

      // A previously persisted credential must be removed before its slot can be reused.
      await tx.issued_oid4vc_credentials.deleteMany({
        where: { listId, index }
      });

      await tx.status_list_allocation.update({
        where: { id: allocation.id },
        data: {
          bitmap: Buffer.from(allocator.export()),
          allocatedCount: allocator.getAllocatedCount()
        }
      });
    });
  }
}
