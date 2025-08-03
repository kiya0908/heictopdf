# 🔒 安全配置说明

## ⚠️ 重要提醒

**永远不要将敏感信息（如API密钥、数据库密码等）直接写在代码中！**

## 正确的配置方式

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **填入你的真实配置信息**
   编辑 `.env` 文件，将占位符替换为你的真实API密钥

3. **确保.env文件不会被提交**
   `.env` 文件已经在 `.gitignore` 中，确保它不会被意外提交到Git

## PayPal配置

如果你的PayPal密钥已经暴露，请立即：

1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/)
2. 删除或重新生成你的应用密钥
3. 更新你的 `.env` 文件中的新密钥

## 脚本使用

运行PayPal设置脚本前，确保先配置环境变量：

```bash
# 设置环境变量
export PAYPAL_CLIENT_ID="your_new_client_id"
export PAYPAL_CLIENT_SECRET="your_new_client_secret"

# 运行脚本
node scripts/setup-paypal.js
```

## 安全检查清单

- [ ] 所有敏感信息都在 `.env` 文件中
- [ ] `.env` 文件在 `.gitignore` 中
- [ ] 代码中没有硬编码的密钥
- [ ] 已重新生成暴露的API密钥