import { sendWithResend } from './resend-helper-file';
import { fetchSecrets } from './utils/secretLoader.util';
import { CommonConstants } from './common.constant';

jest.mock('resend', () => ({
  Resend: jest.fn()
}));
jest.mock('./utils/secretLoader.util', () => ({
  fetchSecrets: jest.fn()
}));

import { Resend } from 'resend';
import { EmailDto } from './dtos/email.dto';

const MockedResend = Resend as unknown as jest.Mock;
const mockedFetchSecrets = fetchSecrets as jest.MockedFunction<typeof fetchSecrets>;

const emailDto: EmailDto = {
  emailFrom: 'from@credebl.id',
  emailTo: ['to@example.com'],
  emailSubject: 'subject',
  emailText: 'text',
  emailHtml: '<p>html</p>'
};

describe('sendWithResend', () => {
  const originalEnv = { ...process.env };
  let sendMock: jest.Mock;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    sendMock = jest.fn().mockResolvedValue({ data: { id: 'email-1' } });
    MockedResend.mockImplementation(() => ({ emails: { send: sendMock } }));
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('sends an email using the provider-sourced API key', async () => {
    mockedFetchSecrets.mockResolvedValue({ RESEND_API_KEY: 'resend-key' });

    await expect(sendWithResend(emailDto)).resolves.toBe(true);

    expect(mockedFetchSecrets).toHaveBeenCalledWith(CommonConstants.RESEND_API_KEY);
    expect(MockedResend).toHaveBeenCalledWith('resend-key');
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: emailDto.emailTo, subject: emailDto.emailSubject })
    );
  });

  it('falls back to the environment variable when no secret is returned', async () => {
    mockedFetchSecrets.mockResolvedValue({});
    process.env.RESEND_API_KEY = 'env-key';

    await expect(sendWithResend(emailDto)).resolves.toBe(true);

    expect(MockedResend).toHaveBeenCalledWith('env-key');
  });

  it('returns false when the API key is missing', async () => {
    mockedFetchSecrets.mockResolvedValue({});

    await expect(sendWithResend(emailDto)).resolves.toBe(false);
    expect(MockedResend).not.toHaveBeenCalled();
  });

  it('returns false when the send response has no id', async () => {
    mockedFetchSecrets.mockResolvedValue({ RESEND_API_KEY: 'resend-key' });
    sendMock.mockResolvedValue({ data: {} });

    await expect(sendWithResend(emailDto)).resolves.toBe(false);
  });

  it('returns false when the send rejects', async () => {
    mockedFetchSecrets.mockResolvedValue({ RESEND_API_KEY: 'resend-key' });
    sendMock.mockRejectedValue(new Error('rate limited'));

    await expect(sendWithResend(emailDto)).resolves.toBe(false);
  });
});
