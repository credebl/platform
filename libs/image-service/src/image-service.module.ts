import { Module } from '@nestjs/common';
import { ImageServiceService } from './image-service.service';

@Module({
  providers: [ImageServiceService],
  exports: [ImageServiceService],
})
export class ImageServiceModule {}
