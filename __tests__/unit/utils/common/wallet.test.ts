import { generateSalt } from '../../../../src/utils/wallet'; 

describe('generateSalt', () => {
  test('should return a string', () => {
    const salt = generateSalt();
    expect(typeof salt).toBe('string');
  });

  test('should return a valid Ethereum hash', () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  test('should return a unique value each time', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toEqual(salt2);
  });
});