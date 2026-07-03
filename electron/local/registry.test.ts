import { describe, it, expect, vi } from 'vitest';
import { Registry } from './registry';
import type { McpHost } from './mcp';
import type { McpServerConf, ToolSpec } from './types';

// Minimal stand-in for McpHost: `start()` fails the first `failTimes` calls
// (simulating a slow cold start that blows the initialize budget), then
// succeeds. Cast to McpHost at the injection site — the concrete class has
// private fields so it's nominal, but Registry only uses these public methods.
class FakeHost {
  startCalls = 0;
  stopCalls = 0;
  constructor(private failTimes = 0) {}
  async start(_c: McpServerConf): Promise<void> {
    this.startCalls++;
    if (this.startCalls <= this.failTimes) throw new Error('mcp rpc timeout');
  }
  async listTools(server: string): Promise<ToolSpec[]> {
    return [{ name: `mcp.${server}.tool1`, description: '', input_schema: {}, source: 'mcp', mutates: true }];
  }
  stop(): void {
    this.stopCalls++;
  }
  stopAll(): void {}
  async call(): Promise<{ output: string; is_error: boolean }> {
    return { output: '', is_error: false };
  }
}

const server = (over: Partial<McpServerConf> = {}): McpServerConf => ({ id: 'pw', command: 'x', args: [], enabled: true, ...over });
const mk = (host: FakeHost, retries = 3, delayMs = 5) => new Registry(host as unknown as McpHost, retries, delayMs);

describe('Registry MCP boot', () => {
  it('connects on first boot and advertises the server tools', async () => {
    const reg = mk(new FakeHost(0));
    await reg.boot([server()]);
    expect(reg.mcpStatus()).toEqual([{ id: 'pw', status: 'connected', toolCount: 1, tools: ['mcp.pw.tool1'] }]);
    expect(reg.specs().some((s) => s.name === 'mcp.pw.tool1')).toBe(true);
  });

  it('marks a disabled server disabled without spawning it', async () => {
    const host = new FakeHost(0);
    const reg = mk(host);
    await reg.boot([server({ enabled: false })]);
    expect(reg.mcpStatus()).toEqual([{ id: 'pw', status: 'disabled', toolCount: 0, tools: [] }]);
    expect(host.startCalls).toBe(0);
  });

  it('dedupes concurrent connects for the same id (no double-spawn)', async () => {
    const host = new FakeHost(0);
    const reg = mk(host);
    // Two overlapping boots (mirrors a background retry racing a user reconnect)
    // must share one spawn, not orphan a second child process.
    await Promise.all([reg.boot([server()]), reg.boot([server()])]);
    expect(host.startCalls).toBe(1);
    expect(reg.mcpStatus()[0].status).toBe('connected');
    // Exactly one tool spec, not duplicated.
    expect(reg.specs().filter((s) => s.name === 'mcp.pw.tool1')).toHaveLength(1);
  });

  it('retries a failed first connect in the background until it succeeds', async () => {
    const reg = mk(new FakeHost(2)); // fail twice, connect on the 3rd start
    await reg.boot([server()]);
    expect(reg.mcpStatus()[0].status).toBe('failed'); // initial attempt failed
    await vi.waitFor(
      () => {
        expect(reg.mcpStatus().find((s) => s.id === 'pw')?.status).toBe('connected');
      },
      { timeout: 1000 }
    );
    expect(reg.specs().some((s) => s.name === 'mcp.pw.tool1')).toBe(true);
  });

  it('gives up after the retry budget and stays failed', async () => {
    const host = new FakeHost(99); // never connects
    const reg = mk(host, 2, 5); // initial + 2 retries = 3 start attempts
    await reg.boot([server()]);
    await new Promise((r) => setTimeout(r, 80));
    expect(reg.mcpStatus()[0].status).toBe('failed');
    expect(host.startCalls).toBe(3);
  });

  it('drops pending retries once a reboot supersedes the config', async () => {
    const host = new FakeHost(99); // always fail → would keep scheduling retries
    const reg = mk(host, 5, 10);
    await reg.boot([server()]);
    const afterBoot = host.startCalls; // 1
    await reg.reboot([]); // new generation, no servers
    await new Promise((r) => setTimeout(r, 60)); // let any stale retry fire
    expect(host.startCalls).toBeLessThanOrEqual(afterBoot + 1); // stale retries dropped
    expect(reg.mcpStatus()).toEqual([]);
  });
});
