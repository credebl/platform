import { Module } from '@nestjs/common';
import { UserRequestService } from './user-request.service';

@Module({
  providers: [UserRequestService],
  exports: [UserRequestService]
})
export class UserRequestModule {}
