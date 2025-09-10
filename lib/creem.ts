/**
 * Creem支付客户端封装
 * 
 * 基于Creem API文档实现的支付服务客户端
 * 支持订阅创建、查询、取消等核心功能
 */

// Creem API配置
const CREEM_CONFIG = {
  // 根据环境选择API基础URL
  API_BASE: process.env.CREEM_API_BASE_URL || (
    process.env.CREEM_ENVIRONMENT === "production" 
      ? "https://api.creem.io"  // 生产环境URL
      : "https://test-api.creem.io"  // 测试环境URL
  ),
  
  // API认证信息
  API_KEY: process.env.CREEM_API_KEY,
  SECRET_KEY: process.env.CREEM_SECRET_KEY,
  
  // Webhook配置
  WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET,
} as const;

// Creem订阅状态枚举
export enum CreemSubscriptionStatus {
  PENDING = "pending",
  ACTIVE = "active", 
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  SUSPENDED = "suspended",
}

// Creem订阅计划类型
export interface CreemPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  description?: string;
}

// Creem订阅信息
export interface CreemSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: CreemSubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Creem客户信息
export interface CreemCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

// API响应基础类型
interface CreemApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Creem支付客户端类
 */
export class CreemClient {
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret: string;

  constructor() {
    const apiKey = process.env.CREEM_API_KEY;

    if (!apiKey) {
      throw new Error("Creem API credentials not configured - need CREEM_API_KEY");
    }

    this.apiKey = apiKey;
    this.baseUrl = CREEM_CONFIG.API_BASE;
    this.webhookSecret = CREEM_CONFIG.WEBHOOK_SECRET || "";

    console.log('🔧 Creem客户端初始化:', {
      apiKey: apiKey.slice(0, 15) + '...',
      environment: process.env.CREEM_ENVIRONMENT,
      baseUrl: this.baseUrl
    });
  }

  /**
   * 获取重定向URL - 支持多语言动态路由
   */
  private getReturnUrl(isSuccess: boolean, locale?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const params = new URLSearchParams();
    
    if (isSuccess) {
      params.set('payment_success', 'true');
    } else {
      params.set('payment_failed', 'true');
    }
    
    params.set('provider', 'creem');
    
    // Test模式添加模式标识
    if (process.env.CREEM_ENVIRONMENT === 'sandbox') {
      params.set('mode', 'test');
    }
    
    // 动态语言路由处理
    let pathSegment = '/app'; // 默认英文路径
    
    if (locale) {
      // 如果提供了locale参数，使用动态路由
      if (locale !== 'en') {
        pathSegment = `/${locale}/app`;
      }
    } else {
      // 向后兼容：从环境变量获取默认语言
      const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'zh';
      if (defaultLocale !== 'en') {
        pathSegment = `/${defaultLocale}/app`;
      }
    }
    
    return `${baseUrl}${pathSegment}?${params.toString()}`;
  }

  /**
   * 发送API请求的通用方法 - 基于官方文档的标准实现
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CreemApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey, // 官方文档指定的认证方式
      ...options.headers,
    };

    try {
      console.log(`🔑 调用Creem API: ${url}`);
      console.log(`🔑 认证密钥: ${this.apiKey.slice(0, 15)}...`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));
      
      console.log(`📄 响应状态: ${response.status}`);
      console.log(`📄 响应数据:`, data);

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || response.status.toString(),
            message: data.message || response.statusText,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`❌ API请求失败:`, error);
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * 创建客户
   */
  async createCustomer(customerData: {
    email: string;
    name?: string;
    userId: string; // 系统用户ID，用于关联
  }): Promise<CreemApiResponse<CreemCustomer>> {
    
    const requestData = {
      email: customerData.email,
      name: customerData.name,
      metadata: {
        user_id: customerData.userId,
      },
    };

    console.log('🔍 Creem客户创建请求:', { url: `${this.baseUrl}/customers`, data: requestData });

    return this.makeRequest<CreemCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  }

  /**
   * 专门测试Bundle相关的API端点
   */
  async testBundleEndpoints(bundleId: string): Promise<void> {
    console.log('🎁 测试Bundle专用端点...');
    
    // 尝试获取bundle信息的端点
    const bundleInfoEndpoints = [
      `/bundles/${bundleId}`,           // 标准bundle端点
      `/products/${bundleId}`,          // 产品端点
      `/bundles/${bundleId}/info`,      // bundle信息
      `/v1/bundles/${bundleId}`,        // 带版本的bundle端点
      `/catalog/${bundleId}`,           // 目录端点
    ];

    console.log('📋 第一步：尝试获取Bundle信息...');
    for (const endpoint of bundleInfoEndpoints) {
      console.log(`🔍 测试Bundle信息端点: ${endpoint}`);
      const result = await this.makeRequest(endpoint, { method: 'GET' });
      console.log(`📄 ${endpoint} 响应:`, result);
      
      // 如果成功获取到bundle信息，打印详细内容
      if (result.success && result.data) {
        console.log(`✅ 成功获取Bundle信息:`, result.data);
      }
    }

    // 尝试bundle特定的checkout端点  
    const bundleCheckoutEndpoints = [
      `/bundles/${bundleId}/checkout`,         // Bundle专用checkout
      `/bundles/${bundleId}/purchase`,         // Bundle购买
      `/bundles/${bundleId}/subscribe`,        // Bundle订阅
      `/checkout/bundles/${bundleId}`,         // Checkout中的bundle
      `/v1/bundles/${bundleId}/checkout`,      // 带版本的
      `/create-checkout-session`,              // 通用checkout会话
    ];

    console.log('📋 第二步：尝试Bundle专用checkout端点...');
    const sampleData = {
      bundle_id: bundleId,
      customer_email: 'test@example.com',
      success_url: this.getReturnUrl(true),
      // cancel_url 字段被Creem API拒绝，移除
    };

    for (const endpoint of bundleCheckoutEndpoints) {
      console.log(`🔍 测试Bundle checkout: ${endpoint}`);
      const result = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(sampleData),
      });
      console.log(`📄 ${endpoint} 响应:`, result);
      
      // 如果不是404和认证错误，可能是有用的响应
      if (result.success || 
          (result.error?.code !== '404' && 
           result.error?.code !== '401' && 
           result.error?.code !== '403' &&
           result.error?.code !== 'AUTH_FAILED')) {
        console.log(`✅ ${endpoint} 返回了有意义的响应!`);
      }
    }
  }

  /**
   * 尝试通用的checkout会话创建
   */
  async createCheckoutSession(subscriptionData: {
    customerId: string;
    planId: string;
    userId: string;
  }): Promise<CreemApiResponse<any>> {
    
    console.log('💳 尝试创建通用Checkout会话...');
    
    // 通用checkout会话的常见格式
    const sessionFormats = [
      {
        endpoint: '/create-checkout-session',
        data: {
          mode: 'subscription',
          bundle_id: subscriptionData.planId,
          customer_email: subscriptionData.customerId,
          success_url: this.getReturnUrl(true),
          // cancel_url字段被Creem API拒绝，移除
          metadata: { user_id: subscriptionData.userId },
        }
      },
      {
        endpoint: '/checkout-sessions',
        data: {
          bundle_id: subscriptionData.planId,
          customer_email: subscriptionData.customerId,
          success_url: this.getReturnUrl(true),
          // cancel_url字段被Creem API拒绝，移除
          client_reference_id: subscriptionData.userId,
        }
      },
      {
        endpoint: '/v1/checkout/sessions',
        data: {
          line_items: [{
            bundle: subscriptionData.planId,
            quantity: 1,
          }],
          customer_email: subscriptionData.customerId,
          success_url: this.getReturnUrl(true),
          // cancel_url字段被Creem API拒绝，移除
        }
      }
    ];

    for (const format of sessionFormats) {
      console.log(`🔍 尝试 ${format.endpoint} 创建checkout会话:`, format.data);
      
      const result = await this.makeRequest(format.endpoint, {
        method: 'POST',
        body: JSON.stringify(format.data),
      });
      
      console.log(`📄 ${format.endpoint} 响应:`, result);
      
      // 如果成功或非404/401/403错误，返回结果
      if (result.success || 
          (result.error?.code !== '404' && 
           result.error?.code !== '401' && 
           result.error?.code !== '403' &&
           result.error?.code !== 'AUTH_FAILED')) {
        return result;
      }
    }
    
    return { success: false, error: { code: 'ALL_SESSIONS_FAILED', message: 'All checkout session formats failed' } };
  }
  async testEndpointAuth(endpoint: string): Promise<any> {
    console.log(`🔍 专门测试 ${endpoint} 端点的认证...`);
    
    // 已知这个端点存在（返回401而不是404），尝试所有认证方式
    const result = await this.makeRequest(endpoint, { method: 'GET' });
    console.log(`📄 ${endpoint} 认证测试结果:`, result);
    
    return result;
  }

  /**
   * 尝试创建订阅 - 使用已知存在的端点
   */
  async createSubscriptionWithKnownEndpoints(subscriptionData: {
    customerId: string;
    planId: string;
    userId: string;
  }): Promise<CreemApiResponse<any>> {
    
    console.log('🔍 使用已知存在的端点创建订阅...');
    
    // 使用我们知道存在的端点
    const knownEndpoints = [
      '/subscriptions',     // 401错误 = 端点存在
      '/v1/subscriptions',  // 403错误 = 端点存在  
      '/products',          // 401错误 = 端点存在
    ];

    const requestFormats = [
      {
        bundle_id: subscriptionData.planId,
        customer_email: subscriptionData.customerId,
        success_url: this.getReturnUrl(true),
        // cancel_url字段被Creem API拒绝，移除
        metadata: { user_id: subscriptionData.userId },
      },
      {
        product_id: subscriptionData.planId,
        email: subscriptionData.customerId,
        return_url: this.getReturnUrl(true),
        // cancel_url字段被Creem API拒绝，移除
        user_id: subscriptionData.userId,
      },
      {
        bundle: subscriptionData.planId,
        customer: subscriptionData.customerId,
        success_url: this.getReturnUrl(true),
        // cancel_url字段被Creem API拒绝，移除
      }
    ];

    for (const endpoint of knownEndpoints) {
      for (const [index, data] of requestFormats.entries()) {
        console.log(`🔍 尝试 ${endpoint} 端点，格式 ${index + 1}:`, data);
        
        const result = await this.makeRequest(endpoint, {
          method: "POST",
          body: JSON.stringify(data),
        });
        
        console.log(`📄 ${endpoint} 格式 ${index + 1} 响应:`, result);
        
        // 如果不是404或认证错误，可能是成功或有用的错误
        if (result.success || 
            (result.error?.code !== '404' && 
             result.error?.code !== '401' && 
             result.error?.code !== '403' &&
             result.error?.code !== 'AUTH_FAILED')) {
          console.log(`✅ ${endpoint} 格式 ${index + 1} 返回了有用的响应!`);
          return result;
        }
      }
    }
    
    return { success: false, error: { code: 'ALL_FAILED', message: 'All known endpoints failed' } };
  }
  async exploreAPI(): Promise<void> {
    console.log('🔍 探索Creem API可用端点...');
    
    // 先获取根路径信息
    const rootInfo = await this.makeRequest('/', { method: 'GET' });
    console.log('📄 根路径信息:', rootInfo);
    
    // 尝试常见的支付API端点
    const commonEndpoints = [
      // 常见的支付端点
      '/payment',
      '/payments', 
      '/checkout',
      '/checkout-sessions',
      '/create-checkout',
      '/bundles',
      '/products',
      '/subscriptions',
      '/create-subscription',
      '/create-payment',
      
      // 带版本的端点
      '/v1/payment',
      '/v1/checkout',
      '/v1/bundles', 
      '/v1/subscriptions',
      
      // API文档端点
      '/docs',
      '/api-docs',
      '/swagger',
      '/endpoints',
    ];

    const workingEndpoints: Array<{
      endpoint: string;
      status: string | undefined;
      response: string | undefined;
    }> = [];
    
    for (const endpoint of commonEndpoints) {
      try {
        const result = await this.makeRequest(endpoint, { method: 'GET' });
        
        if (result.success || (result.error?.code !== '404')) {
          workingEndpoints.push({
            endpoint,
            status: result.success ? 'SUCCESS' : result.error?.code,
            response: result.success ? 'Working' : result.error?.message
          });
          
          console.log(`✅ 发现可用端点: ${endpoint} - ${result.success ? 'SUCCESS' : result.error?.code}`);
        }
      } catch (error) {
        // 忽略网络错误，继续探索
      }
    }
    
    console.log('📋 所有可用端点总结:', workingEndpoints);
  }
  async testConnection(): Promise<CreemApiResponse<any>> {
    console.log('🔍 测试Creem API基础连接...');
    
    // 尝试一些常见的测试端点
    const testEndpoints = [
      '/', // 根路径
      '/health', // 健康检查
      '/status', // 状态检查
      '/ping', // ping端点
      '/api', // API根路径
      '/v1', // 版本端点
      '/bundles', // 产品列表
      '/products', // 产品列表（另一种命名）
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔍 测试端点: ${this.baseUrl}${endpoint}`);
        
        const result = await this.makeRequest(endpoint, {
          method: "GET",
        });
        
        console.log(`📄 ${endpoint} 响应:`, result);
        
        // 如果不是404，说明端点存在
        if (result.error?.code !== '404') {
          console.log(`✅ 找到有效端点: ${endpoint}`);
          return result;
        }
      } catch (error) {
        console.log(`❌ ${endpoint} 测试失败:`, error);
      }
    }
    
    return { success: false, error: { code: '404', message: 'No valid endpoints found' } };
  }
  async createSubscription(subscriptionData: {
    customerId: string;
    planId: string;
    userId: string; // 用于webhook识别
    returnUrl?: string;
    // cancelUrl参数被移除，因为Creem API不支持
    locale?: string; // 语言代码，用于动态路由
  }): Promise<CreemApiResponse<any>> {
    
    console.log('💳 创建Creem Checkout会话...');
    
    // 基于官方文档的标准格式
    const requestData = {
      product_id: subscriptionData.planId, // 官方文档要求的字段
      units: 1, // 购买数量
      customer: {
        email: subscriptionData.customerId, // 客户邮箱
      },
      success_url: subscriptionData.returnUrl || this.getReturnUrl(true, subscriptionData.locale),
      // cancel_url字段被Creem API拒绝，因此移除
      metadata: {
        user_id: subscriptionData.userId, // 用于webhook回调识别
      },
    };
    
    console.log('🔍 请求数据:', {
      url: `${this.baseUrl}/checkouts`,
      data: requestData
    });

    const result = await this.makeRequest<any>("/checkouts", {
      method: "POST",
      body: JSON.stringify(requestData),
    });

    console.log('📄 Creem API响应:', result);
    
    return result;
  }

  /**
   * 获取订阅详情
   */
  async getSubscription(subscriptionId: string): Promise<CreemApiResponse<CreemSubscription>> {
    return this.makeRequest<CreemSubscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<CreemApiResponse<CreemSubscription>> {
    return this.makeRequest<CreemSubscription>(`/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      body: JSON.stringify({
        cancel_at_period_end: cancelAtPeriodEnd,
      }),
    });
  }

  /**
   * 获取客户的所有订阅
   */
  async getCustomerSubscriptions(customerId: string): Promise<CreemApiResponse<CreemSubscription[]>> {
    return this.makeRequest<CreemSubscription[]>(`/customers/${customerId}/subscriptions`);
  }

  /**
   * 验证Webhook签名
   */
  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    try {
      if (!CREEM_CONFIG.WEBHOOK_SECRET) {
        console.error("Creem webhook secret not configured");
        return false;
      }

      // 根据Creem文档实现HMAC-SHA256签名验证
      const crypto = require('crypto');
      const computedSignature = crypto
        .createHmac('sha256', CREEM_CONFIG.WEBHOOK_SECRET)
        .update(payload, 'utf8')
        .digest('hex');
      
      console.log('🔐 Webhook签名验证:', {
        received: signature,
        computed: computedSignature,
        match: signature === computedSignature
      });
      
      return signature === computedSignature;
    } catch (error) {
      console.error("Creem webhook signature verification failed:", error);
      return false;
    }
  }
}

// 导出单例实例
export const creemClient = new CreemClient();

// 导出配置常量
export { CREEM_CONFIG };

/**
 * 工具函数：将Creem订阅状态映射到系统状态
 */
export function mapCreemStatusToSystem(creemStatus: string): string {
  const statusMap: Record<string, string> = {
    [CreemSubscriptionStatus.PENDING]: "pending",
    [CreemSubscriptionStatus.ACTIVE]: "active",
    [CreemSubscriptionStatus.CANCELLED]: "cancelled", 
    [CreemSubscriptionStatus.EXPIRED]: "expired",
    [CreemSubscriptionStatus.SUSPENDED]: "cancelled",
  };

  return statusMap[creemStatus] || "unknown";
}

/**
 * 工具函数：检查订阅是否有效
 */
export function isSubscriptionActive(subscription: CreemSubscription): boolean {
  if (subscription.status !== CreemSubscriptionStatus.ACTIVE) {
    return false;
  }

  // 检查是否过期
  const now = new Date();
  if (subscription.currentPeriodEnd < now) {
    return false;
  }

  return true;
}