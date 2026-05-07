import type { RequestConfig } from  '@umijs/max';

//全局网络请求拦截器
export const request: RequestConfig={
  baseURL: 'http://localhost:8080/api/v1',
  timeout:10000,
  //错误处理机制
  errorConfig:{
    errorHandler(){
      //这里的错误会被组件的try...catch捕获
    }
  }
}