const { contextBridge } = require('electron');

// 可以在这里暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 未来可以添加需要主进程通信的功能
});
