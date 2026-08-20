import { LocalFsStorageService } from './providers/local-fs-storage.provider';
import { Module } from '@nestjs/common';
import { RustFsStorageService } from './providers/rustfs-storage.provider';
import { S3StorageService } from './providers/s3-storage.provider';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService, S3StorageService, RustFsStorageService, LocalFsStorageService],
  exports: [StorageService]
})
export class StorageModule {}
