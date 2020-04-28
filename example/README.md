# 时间轴插件开发, 和调试代码;


# 在根目录 , 启动命令行, 运行 npm i命令, 运行完毕会在根目录创建一个 dist目录, dist/index.js 文件即是时间轴打包后的代码;

# 使用时, 直接引用该文件即可;

# 开发或调试;
# 调试前先启动 example 下项目, 引用 dist/index 该文件,  
# 修改src目录下源代码, 修改完成后, 在根目录运行 npm prepublish命令打包文件到 dist/index.js 下, example示例项目即会自动刷新, 观察到更改

# 更新 npm包
# 先执行 npm i, 运行 npm login, 先登陆 npm 账号, 再执行 npm publish命令, 即可更新 npm包;
