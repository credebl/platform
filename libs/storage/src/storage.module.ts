import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { S3StorageService } from './providers/s3-storage.service';
import { RustFsStorageService } from './providers/rustfs-storage.service';
import { LocalFsStorageService } from './providers/local-fs-storage.service';

@Module({
  providers: [StorageService, S3StorageService, RustFsStorageService, LocalFsStorageService],
  exports: [StorageService]
})
export class StorageModule {}
