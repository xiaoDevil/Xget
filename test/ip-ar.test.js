/**
 * Tests for ip-ar (AnyRouter) AI inference provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../src/index.js';

describe('ip-ar platform', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该正确识别 ip-ar 平台路径', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: '你好' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const request = new Request('http://localhost/ip/ar/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] })
    });

    const response = await worker.fetch(request, {}, {});
    expect(response.status).toBe(200);

    // 验证上游请求的 URL 是否正确
    const upstreamCall = mockFetch.mock.calls[0];
    expect(upstreamCall[0]).toBe('https://c.cspok.cn/v1/chat/completions');
  });

  it('应该为 AI 请求跳过缓存', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const request = new Request('http://localhost/ip/ar/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    });

    const response = await worker.fetch(request, {}, {});
    expect(response.status).toBe(200);

    // AI 请求不应该返回缓存相关的头
    expect(response.headers.has('X-Performance-Metrics')).toBe(false);
  });

  it('应该正确转发请求头', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const request = new Request('http://localhost/ip/ar/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Custom-Header': 'test-value'
      }
    });

    await worker.fetch(request, {}, {});

    // 检查上游请求是否正确转发了 Authorization 头
    const upstreamCall = mockFetch.mock.calls[0];
    const upstreamHeaders = upstreamCall[1].headers;
    expect(upstreamHeaders.get('Authorization')).toBe('Bearer test-token');
    expect(upstreamHeaders.get('Custom-Header')).toBe('test-value');
  });

  it('应该允许 POST 请求', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const request = new Request('http://localhost/ip/ar/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    });

    const response = await worker.fetch(request, {}, {});
    expect(response.status).toBe(200);
  });

  it('平台路径不完整时应该重定向到首页', async () => {
    const request = new Request('http://localhost/ip/ar', { method: 'GET' });
    const response = await worker.fetch(request, {}, {});
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://github.com/xixu-me/Xget');
  });

  it('平台路径只有斜杠时应该重定向到首页', async () => {
    const request = new Request('http://localhost/ip/ar/', { method: 'GET' });
    const response = await worker.fetch(request, {}, {});
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://github.com/xixu-me/Xget');
  });

  it('应该处理上游错误', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Service Unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })
    );

    const request = new Request('http://localhost/ip/ar/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    });

    const response = await worker.fetch(request, {}, {});
    expect(response.status).toBe(503);
  });
});
