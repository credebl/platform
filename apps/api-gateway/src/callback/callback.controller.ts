import { Controller, Post, Headers, Body } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('')
export class CallbackController {
  @Post('uidai/callback')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleCallback(@Body() body: any, @Headers() headers: Record<string, string>): Promise<{ success: boolean }> {
    // eslint-disable-next-line no-console
    console.log('Callback body:', body);
    // eslint-disable-next-line no-console
    console.log('Callback headers:', headers);

    // process logic OR forward to service
    return { success: true };
  }
}
