// src/access.ts

/**
 * 权限控制的核心文件
 * @param initialState 从全局状态 (src/app.ts) 中获取的初始数据（如用户信息）
 */
export default function access(initialState: {currentUser?:any} | undefined) {
  const {currentUser} =initialState ?? {};
  return {
    canAdmin: !!currentUser, // 只有管理员能看的权限标识
    // canUser: true, // 普通用户的权限标识
  };
}
