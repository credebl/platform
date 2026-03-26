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

    while (true) {
      const idx = randomInt(this.capacity);

      if (!this.isSet(idx)) {
        this.set(idx);
        this.allocatedCount++;
        return idx;
      }
    }
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
    return this.prisma.$transaction(async (tx) => {
      // Find active list or create one
      let activeList = await tx.status_list_allocation.findFirst({
        where: { orgId, issuerDid, isActive: true }
      });

      if (!activeList || activeList.allocatedCount >= activeList.listSize) {
        // Mark inactive if full
        if (activeList) {
          await tx.status_list_allocation.update({
            where: { id: activeList.id },
            data: { isActive: false }
          });
        }

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

      const allocator = new RandomBitmapIndexAllocator(activeList.listSize, new Uint8Array(activeList.bitmap));

      try {
        const index = allocator.allocate();

        // Update database
        await tx.status_list_allocation.update({
          where: { id: activeList.id },
          data: {
            bitmap: Buffer.from(allocator.export()),
            allocatedCount: activeList.allocatedCount + 1
          }
        });

        return { listId: activeList.listId, index };
      } catch (error) {
        if ('No indexes left' === error.message) {
          // Retry rotation if we hit the race condition limit
          await tx.status_list_allocation.update({
            where: { id: activeList.id },
            data: { isActive: false }
          });
          throw new Error('Retry allocation, list full');
        }
        throw error;
      }
    });
  }

  async saveCredentialAllocation(
    credentialId: string,
    listId: string,
    index: number,
    issuanceSessionId: string,
    statusListUri: string
  ): Promise<void> {
    await this.prisma.issued_oid4vc_credentials.create({
      data: {
        credentialId,
        listId,
        index,
        issuanceSessionId,
        statusListUri
      }
    });
  }

  async getCredentialAllocations(issuanceSessionId: string): Promise<issued_oid4vc_credentials[]> {
    return this.prisma.issued_oid4vc_credentials.findMany({
      where: { issuanceSessionId }
    });
  }

  async release(listId: string, index: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const allocation = await tx.status_list_allocation.findUnique({
        where: { listId }
      });

      if (!allocation) {
        return;
      }

      const allocator = new RandomBitmapIndexAllocator(allocation.listSize, new Uint8Array(allocation.bitmap));
      allocator.release(index);

      await tx.status_list_allocation.update({
        where: { listId },
        data: {
          bitmap: Buffer.from(allocator.export()),
          allocatedCount: Math.max(0, allocation.allocatedCount - 1)
        }
      });
    });
  }
}
