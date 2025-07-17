const { formatTime } = require('../../src/utils/timeUtils');

test('formatTime should format time correctly', () => {
	expect(formatTime(3600)).toBe('1 hour');
	expect(formatTime(60)).toBe('1 minute');
	expect(formatTime(1)).toBe('1 second');
	expect(formatTime(0)).toBe('0 seconds');
});