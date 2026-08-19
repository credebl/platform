import { sendWithSendGrid } from './send-grid-helper-file';
import { fetchSecrets } from './utils/secretLoader.util';
import { CommonConstants } from './common.constant';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}));
jest.mock('./utils/secretLoader.util', () => ({
  fetchSecrets: jest.fn()
}));

import * as sendgrid from '@sendgrid/mail';
import { EmailDto } from './dtos/email.dto';

const mockedSetApiKey = sendgrid.setApiKey as jest.Mock;
const mockedSend = sendgrid.send as jest.Mock;
const mockedFetchSecrets = fetchSecrets as jest.MockedFunction<typeof fetchSecrets>;

const emailDto: EmailDto = {
  emailFrom: 'from@credebl.id',
  emailTo: ['to@example.com'],
  emailSubject: 'subject',
  emailText: 'text',
  emailHtml: '<p>html</p>'
};

describe('sendWithSendGrid', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.SENDGRID_API_KEY;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('sends an email using the provider-sourced API key', async () => {
    mockedFetchSecrets.mockResolvedValue({ SENDGRID_API_KEY: 'sg-key' });
    mockedSend.mockResolvedValue(true);

    await expect(sendWithSendGrid(emailDto)).resolves.toBe(true);

    expect(mockedFetchSecrets).toHaveBeenCalledWith(CommonConstants.SENDGRID_API_KEY);
    expect(mockedSetApiKey).toHaveBeenCalledWith('sg-key');
    expect(mockedSend).toHaveBeenCalledWith(expect.objectContaining({ to: emailDto.emailTo }));
  });

  it('falls back to the environment variable when no secret is returned', async () => {
    mockedFetchSecrets.mockResolvedValue({});
    process.env.SENDGRID_API_KEY = 'env-key';
    mockedSend.mockResolvedValue(true);

    await expect(sendWithSendGrid(emailDto)).resolves.toBe(true);

    expect(mockedSetApiKey).toHaveBeenCalledWith('env-key');
  });

  it('returns false when the API key is missing', async () => {
    mockedFetchSecrets.mockResolvedValue({});

    await expect(sendWithSendGrid(emailDto)).resolves.toBe(false);
    expect(mockedSetApiKey).not.toHaveBeenCalled();
  });

  it('returns false when send rejects', async () => {
    mockedFetchSecrets.mockResolvedValue({ SENDGRID_API_KEY: 'sg-key' });
    mockedSend.mockRejectedValue(new Error('rate limited'));

    await expect(sendWithSendGrid(emailDto)).resolves.toBe(false);
  });
});
