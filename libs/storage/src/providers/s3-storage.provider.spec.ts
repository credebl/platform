import { S3StorageService } from './s3-storage.provider';
import { fetchSecrets } from '@credebl/common/utils/secretLoader.util';
import { CommonConstants } from '@credebl/common/common.constant';

jest.mock('aws-sdk', () => ({
  S3: jest.fn()
}));
jest.mock('@credebl/common/utils/secretLoader.util', () => ({
  fetchSecrets: jest.fn()
}));

import { S3 } from 'aws-sdk';

const MockedS3 = S3 as unknown as jest.Mock;
const mockedFetchSecrets = fetchSecrets as jest.MockedFunction<typeof fetchSecrets>;

type ClientGetter = () => Promise<S3>;

describe('S3StorageService', () => {
  const originalEnv = { ...process.env };
  let service: S3StorageService;

  beforeEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY;
    delete process.env.AWS_SECRET_KEY;
    delete process.env.AWS_PUBLIC_REGION;
    delete process.env.AWS_PUBLIC_ACCESS_KEY;
    delete process.env.AWS_PUBLIC_SECRET_KEY;
    delete process.env.AWS_S3_STOREOBJECT_REGION;
    delete process.env.AWS_S3_STOREOBJECT_ACCESS_KEY;
    delete process.env.AWS_S3_STOREOBJECT_SECRET_KEY;
    service = new S3StorageService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('builds the internal S3 client from provider-sourced credentials', async () => {
    mockedFetchSecrets.mockResolvedValue({ AWS_ACCESS_KEY: 'secret-key', AWS_SECRET_KEY: 'secret-secret' });
    process.env.AWS_REGION = 'us-east-1';

    await (service as unknown as { getS3Client: ClientGetter }).getS3Client();

    expect(mockedFetchSecrets).toHaveBeenCalledWith(CommonConstants.AWS_KEY);
    expect(MockedS3).toHaveBeenCalledWith({
      accessKeyId: 'secret-key',
      secretAccessKey: 'secret-secret',
      region: 'us-east-1'
    });
  });

  it('falls back to environment variables for the internal client', async () => {
    mockedFetchSecrets.mockResolvedValue({});
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY = 'env-key';
    process.env.AWS_SECRET_KEY = 'env-secret';

    await (service as unknown as { getS3Client: ClientGetter }).getS3Client();

    expect(MockedS3).toHaveBeenCalledWith({
      accessKeyId: 'env-key',
      secretAccessKey: 'env-secret',
      region: 'us-east-1'
    });
  });

  it('builds the public S3 client from the public credential pair', async () => {
    mockedFetchSecrets.mockResolvedValue({
      AWS_PUBLIC_ACCESS_KEY: 'public-key',
      AWS_PUBLIC_SECRET_KEY: 'public-secret'
    });
    process.env.AWS_PUBLIC_REGION = 'ap-south-1';

    await (service as unknown as { getPublicS3Client: ClientGetter }).getPublicS3Client();

    expect(MockedS3).toHaveBeenCalledWith({
      accessKeyId: 'public-key',
      secretAccessKey: 'public-secret',
      region: 'ap-south-1'
    });
  });

  it('builds the store-object S3 client from the store-object credential pair', async () => {
    mockedFetchSecrets.mockResolvedValue({
      AWS_S3_STOREOBJECT_ACCESS_KEY: 'store-key',
      AWS_S3_STOREOBJECT_SECRET_KEY: 'store-secret'
    });
    process.env.AWS_S3_STOREOBJECT_REGION = 'eu-west-1';

    await (service as unknown as { getStoreObjectS3Client: ClientGetter }).getStoreObjectS3Client();

    expect(MockedS3).toHaveBeenCalledWith({
      accessKeyId: 'store-key',
      secretAccessKey: 'store-secret',
      region: 'eu-west-1'
    });
  });

  it('builds the public URL from the bucket and public region', () => {
    process.env.AWS_PUBLIC_REGION = 'ap-south-1';

    expect(service.getPublicUrl('my-bucket', 'logos/logo.png')).toBe(
      'https://my-bucket.s3.ap-south-1.amazonaws.com/logos/logo.png'
    );
  });
});
