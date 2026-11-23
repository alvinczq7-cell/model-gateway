// Jev 决策数据层（3.4）——纯前端模块，UI 组件只认它返回的 { status, data }
// data 结构严格遵循 CONTRACT §4 / §1：GET /api/dashboard/jev?limit=N → { data: JevDecision[] }
//   JevDecision = { request_id, input_summary, confidence, decision, created_at }
//   decision ∈ "free" | "sponsored" | "aiping" | "rule-default"
// 切换数据源只改调用参数 source（'mock' | 'real'），不改任何 UI 组件代码。
(function (global) {
  const MOCK_SAMPLES = [
    ['帮我写一段 Python 冒泡排序并解释复杂度', 0.92, 'free'],
    ['把这份 3 万字的社团年度报告压缩成摘要', 0.81, 'sponsored'],
    ['你好', 0.45, 'rule-default'],
    ['翻译下面这段论文摘要为英文（正式业务）', 0.74, 'aiping'],
    ['测试一下网关是否连通', 0.6, 'free'],          // 恰好等于阈值 0.6：采纳
    ['分析这批调用日志里的异常模式', 0.59, 'rule-default'], // 低于阈值：回退
    ['生成社团招新海报文案三版', 0.88, 'sponsored'],
    ['解释一下什么是熔断机制', 0.67, 'free']
  ];

  function mockDecisions(limit) {
    const n = Math.max(0, Math.min(Number(limit) || 20, 12));
    const now = Date.now();
    return Array.from({ length: n }, (_, i) => {
      const [input_summary, confidence, decision] = MOCK_SAMPLES[i % MOCK_SAMPLES.length];
      return {
        request_id: `req-jev-${String(i + 1).padStart(3, '0')}`,
        input_summary,
        confidence,
        decision,
        created_at: new Date(now - i * 7 * 60 * 1000).toISOString()
      };
    });
  }

  // fetcher：由调用方传入（看板传 apiFetch，自动带 x-admin-token / 401 弹框重放）
  async function load({ source, limit = 20, baseUrl = '', fetcher }) {
    if (source === 'mock') return { status: 'ok', data: mockDecisions(limit) };
    const res = await fetcher(`${baseUrl}/api/dashboard/jev?limit=${limit}`);
    if (res.status === 404) return { status: 'unavailable', data: [] };
    if (res.status === 401) return { status: 'unauthorized', data: [] };
    if (!res.ok) return { status: 'error', data: [] };
    const body = await res.json();
    return { status: 'ok', data: Array.isArray(body && body.data) ? body.data : [] };
  }

  global.JevData = { load, mockDecisions };
})(window);
