#!/usr/bin/env node

/**
 * SEO 检查工具
 * 检查所有页面的SEO配置是否正确
 */

const fs = require('fs');
const path = require('path');

// 需要检查的页面路径
const pagesToCheck = [
  'app/[locale]/(marketing)/page.tsx',
  'app/[locale]/(marketing)/pricing/page.tsx',
  'app/[locale]/(marketing)/blog/page.tsx',
  'app/[locale]/(app)/app/page.tsx',
  'app/[locale]/(app)/app/generate/page.tsx',
  'app/[locale]/(app)/app/history/page.tsx',
  'app/[locale]/(app)/app/order/page.tsx',
];

// SEO检查规则
const seoRules = {
  hasH1: {
    pattern: /<h1[^>]*>/,
    description: '页面包含H1标题',
    critical: true
  },
  hasMetaDescription: {
    pattern: /description.*[^>]*>/,
    description: '页面包含meta description',
    critical: true
  },
  hasRobotsMeta: {
    pattern: /robots.*[^>]*>/,
    description: '页面包含robots meta标签',
    critical: true
  },
  hasOpenGraph: {
    pattern: /openGraph/,
    description: '页面包含Open Graph元数据',
    critical: false
  },
  hasTwitterCard: {
    pattern: /twitter/,
    description: '页面包含Twitter Card元数据',
    critical: false
  }
};

function checkFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { exists: false, errors: ['文件不存在'] };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const results = { exists: true, errors: [], warnings: [] };

  // 检查SEO规则
  Object.entries(seoRules).forEach(([rule, config]) => {
    const hasRule = config.pattern.test(content);
    
    if (!hasRule) {
      if (config.critical) {
        results.errors.push(`❌ ${config.description}`);
      } else {
        results.warnings.push(`⚠️ ${config.description}`);
      }
    }
  });

  return results;
}

function main() {
  console.log('🔍 开始SEO检查...\n');
  
  let totalErrors = 0;
  let totalWarnings = 0;

  pagesToCheck.forEach(pagePath => {
    console.log(`📄 检查页面: ${pagePath}`);
    
    const results = checkFile(pagePath);
    
    if (!results.exists) {
      console.log(`   ❌ 文件不存在\n`);
      totalErrors++;
      return;
    }

    if (results.errors.length === 0 && results.warnings.length === 0) {
      console.log('   ✅ 所有SEO检查通过\n');
    } else {
      if (results.errors.length > 0) {
        results.errors.forEach(error => console.log(`   ${error}`));
        totalErrors += results.errors.length;
      }
      
      if (results.warnings.length > 0) {
        results.warnings.forEach(warning => console.log(`   ${warning}`));
        totalWarnings += results.warnings.length;
      }
      console.log('');
    }
  });

  console.log('📊 SEO检查总结:');
  console.log(`   总错误: ${totalErrors}`);
  console.log(`   总警告: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log('🎉 所有关键SEO检查都通过了！');
  } else {
    console.log('❌ 发现了一些SEO问题，请修复后再检查。');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, seoRules };
