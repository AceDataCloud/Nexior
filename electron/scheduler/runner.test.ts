import { describe, it, expect } from 'vitest';
import { wireTools } from './runner';

describe('wireTools', () => {
  it('sanitizes dotted tool names for OpenAI function names', () => {
    // Dots are legal in our tool names but not in OpenAI function names; an
    // unsanitized name makes the upstream 400 the whole turn.
    expect(wireTools(['fs.read_file'])).toEqual([{ real: 'fs.read_file', wire: 'fs_read_file' }]);
  });

  it('keeps the mapping injective when sanitizing collides', () => {
    // `mcp.a.b` and `mcp_a_b` both sanitize to `mcp_a_b`. Without the suffix
    // the reverse lookup would resolve one to the other and silently invoke
    // the WRONG local tool — a shell command instead of a file read, say.
    const wired = wireTools(['mcp.a.b', 'mcp_a_b']);
    expect(wired[0].wire).toBe('mcp_a_b');
    expect(wired[1].wire).toBe('mcp_a_b_2');
    expect(new Set(wired.map((w) => w.wire)).size).toBe(2);
  });

  it('is stable for the same input order', () => {
    // The daemon builds the map once per turn and reuses it on resume; an
    // order-dependent wire name would break the resume lookup.
    const names = ['fs.list_dir', 'shell.run_command', 'computer.screenshot'];
    expect(wireTools(names)).toEqual(wireTools(names));
  });

  it('leaves already-valid names untouched', () => {
    expect(wireTools(['memory'])).toEqual([{ real: 'memory', wire: 'memory' }]);
  });

  it('handles an empty list', () => {
    expect(wireTools([])).toEqual([]);
  });
});
