// 测试豆包 API - 使用正确的端点
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || "e148e3a4-6776-4316-99bf-2d19913e74ea";

async function testDoubaoAPI() {
  console.log("🧪 测试豆包 API...");
  
  // 尝试不同的端点
  const endpoints = [
    { url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", name: "北京", model: "doubao-pro-32k" },
    { url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", name: "北京2", model: "ep-20250213123456-abc123" },
    { url: "https://ark.cn-shanghai.volces.com/api/v3/chat/completions", name: "上海", model: "doubao-pro-32k" }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📍 尝试 ${endpoint.name} (${endpoint.model})...`);
      const startTime = Date.now();
      
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DOUBAO_API_KEY}`
        },
        body: JSON.stringify({
          model: endpoint.model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 100
        })
      });

      console.log("⏱️  响应时间:", Date.now() - startTime, "ms");
      console.log("📊 HTTP 状态:", response.status);
      
      const data = await response.json();
      if (response.ok) {
        console.log("✅ 成功!");
        console.log("💬 回复:", data.choices?.[0]?.message?.content);
        break;
      } else {
        console.log("❌ 错误:", data.error?.message);
      }
    } catch (error) {
      console.error("❌ 请求失败:", error.message);
    }
  }
}

testDoubaoAPI();
