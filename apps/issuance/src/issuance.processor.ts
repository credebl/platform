import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { IssuanceService } from './issuance.service';
import { Logger } from '@nestjs/common';

@Processor('bulk-issuance')
export class BulkIssuanceProcessor {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(private readonly issuanceService: IssuanceService) {}

  @OnQueueActive()
  onActive(job: Job): void {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`
    );
  }

  @Process('issue-credential')
  async issueCredential(job: Job<unknown>):Promise<void> {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`
    );

    await this.issuanceService.processIssuanceData(job.data);
  }
}
