import { describe, expect, it } from 'vitest';

function toggleMenu(open) {
  return !open;
}

describe('navigation menu', () => {
  it('opens and closes the dropdown menu', () => {
    expect(toggleMenu(false)).toBe(true);
    expect(toggleMenu(true)).toBe(false);
  });
});
