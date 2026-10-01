import { ResponseMessages } from './index';

describe('ResponseMessages', () => {
  describe('connection error messages', () => {
    it('should return "Please provide valid connectionId" for invalidConnectionId', () => {
      expect(ResponseMessages.connection.error.invalidConnectionId).toBe('Please provide valid connectionId');
    });
  });
});
