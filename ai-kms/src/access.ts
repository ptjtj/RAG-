// src/access.ts

/**
 * 权限控制的核心文件
 * @param initialState 从全局状态 (src/app.ts) 中获取的初始数据（如用户信息）
 */
export default function access(initialState: any) {
  // 这里可以根据 initialState 判断当前用户的角色
  // 目前我们先全部返回 true，放行所有权限
  return {
    canAdmin: true, // 只有管理员能看的权限标识
    canUser: true, // 普通用户的权限标识
  };
}
