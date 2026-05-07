import openapiConfig from './src/services/openapiConfig';

// 将已有的 openapi 配置转换为 openapi2ts 所需的配置格式
const cfg = Array.isArray(openapiConfig) ? openapiConfig[0] : openapiConfig;

export default {
  schemaPath: cfg.schemaPath,
  requestLibPath: cfg.requestLibPath,
  // 输出目录：将生成的 API 放到 src/services/api
  serversPath: './src/services/api',
  projectName: cfg.projectName || 'api',
};
