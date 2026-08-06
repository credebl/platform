import { TtlCache } from './ttl-cache.util';

describe('TtlCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls the fetch function only once and returns the cached value on subsequent gets', async () => {
    const cache = new TtlCache<number>(1000);
    const fetchFn = jest.fn().mockResolvedValue(42);

    await expect(cache.get(fetchFn)).resolves.toBe(42);
    await expect(cache.get(fetchFn)).resolves.toBe(42);

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after the ttl has elapsed', async () => {
    const cache = new TtlCache<number>(1000);
    const fetchFn = jest.fn().mockResolvedValue(1);

    await cache.get(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1001);
    fetchFn.mockResolvedValue(2);

    await expect(cache.get(fetchFn)).resolves.toBe(2);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('treats the ttl as a sliding window while the value is read frequently', async () => {
    const cache = new TtlCache<number>(1000);
    const fetchFn = jest.fn().mockResolvedValue(1);

    await cache.get(fetchFn);

    for (let i = 0; 5 > i; i += 1) {
      jest.advanceTimersByTime(900);
      await expect(cache.get(fetchFn)).resolves.toBe(1);
    }

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('clears the cached value and cancels the pending timer on clear()', async () => {
    const cache = new TtlCache<number>(1000);
    const fetchFn = jest.fn().mockResolvedValue(1);

    await cache.get(fetchFn);
    cache.clear();
    fetchFn.mockResolvedValue(2);

    await expect(cache.get(fetchFn)).resolves.toBe(2);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('propagates a rejection from the fetch function', async () => {
    const cache = new TtlCache<number>(1000);
    const fetchFn = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(cache.get(fetchFn)).rejects.toThrow('boom');
  });
});
