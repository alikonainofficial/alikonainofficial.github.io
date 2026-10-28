import { describe, expect, it } from 'vitest';
import { soundStateFor } from './audio';

describe('the sound button', () => {
  it('invites a press on every visit until the visitor answers', () => {
    expect(soundStateFor(false, false)).toBe('invite');
  });

  it('shows the band playing, and goes quiet once paused or declined', () => {
    expect(soundStateFor(true, true)).toBe('playing');
    expect(soundStateFor(false, true)).toBe('paused');
  });
});
