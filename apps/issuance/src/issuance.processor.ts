import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { IssuanceService } from './issuance.service';
import { Logger } from '@nestjs/common';

@Processor('bulk-issuance')
export class BulkIssuanceProcessor {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(private readonly issuanceService: IssuanceService) {}

  @OnQueueActive()
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`
    );
  }

  @Process('issue-credential')
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
  async issueCredential(job: Job<unknown>) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`
    );

    this.issuanceService.processIssuanceData(job.data);
  }
}
