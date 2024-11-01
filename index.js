
const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const compilerSfc = require('@vue/compiler-sfc') // .vue
const compilerDom = require('@vue/compiler-dom') // 模板<template>处理
// const WebSocket = require('ws');
// const chokidar = require('chokidar');
const app = new Koa()

app.use(async ctx=>{
  const {request:{url,query} } = ctx
  if(url=='/'){ // 返回首页html内容
      ctx.type="text/html"
      let content = fs.readFileSync('./index.html','utf-8')
      
      ctx.body = content
  }else if(url.endsWith('.js')){ //返回js路径 既访问的文件是： <script type="module" src="/src/main.js"></script>的 main.js
    // js文件
    const p = path.resolve(__dirname,url.slice(1))
    ctx.type = 'application/javascript'
    const content = fs.readFileSync(p,'utf-8')
    ctx.body = rewriteImport(content) // 替换路径
  }else if(url.startsWith('/@modules/')){ // 处理node_module 
    const prefix = path.resolve(__dirname,'node_modules',url.replace('/@modules/',''))
    const module = require(prefix+'/package.json').module
    const p = path.resolve(prefix,module)
    const ret = fs.readFileSync(p,'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(ret) // 递归调用
  }else if(url.indexOf('.vue')>-1){ //发现是.vue单文件组件，判断 1.无参数生成：template + 当前script输出 2.有参数template 把template转成render函数 
      const p = path.resolve(__dirname, url.split('?')[0].slice(1))
       // 使用vue自导的compile框架 解析单文件组件，等价于vue-loader
      const {descriptor} = compilerSfc.parse(fs.readFileSync(p,'utf-8')) 
      let body = ''
      if(!query.type){ // 1.无参数生成：template + 当前script输出 ， 此版本只支持传统的options 写法 即 export default {  data() {},methods: {} } 
        ctx.type = 'application/javascript'  

        if(descriptor.styles && descriptor.styles.length > 0) { //如果有style ，也输出 import url?type=style
            body = body + ` import  "${url}?type=style"` 
        }
        //template + 当前script输出
        body = body + `
            ${rewriteImport(descriptor.script.content.replace('export default ','const __script = '))}
            import { render as __render } from "${url}?type=template"
            __script.render = __render
            export default __script;
        `  
       
        ctx.body = body 
      }else if(query.type==='template'){ // 2.有参数template 把template转成render函数  
        const template = descriptor.template 
        const render = compilerDom.compile(template.content, {mode:"module"}).code
        ctx.type = 'application/javascript'
        ctx.body = rewriteImport(render) // 继续递归处理import内容
      }else if(query.type==='style'){ // 3.有参数style 把template转成render函数  
        body = body + `
            let link = document.createElement('style')
            link.setAttribute('type', 'text/css')
            document.head.appendChild(link)
            let css2 = \`${descriptor.styles.map(o => o.content).join('\n')}\`
            link.innerHTML = css2 
            `
        ctx.type = 'application/javascript'
        ctx.body = body 
      }
    } else if(url.endsWith('.css')){ // 如果是css 生成style标签插入到html 
        const p = path.resolve(__dirname,url.slice(1))
        const file = fs.readFileSync(p,'utf-8')
        const content = `
        const css = "${file.replace(/\n/g,'')}"
        let link = document.createElement('style')
        link.setAttribute('type', 'text/css')
        document.head.appendChild(link)
       link.innerHTML = css 
        `
        ctx.type = 'application/javascript'
        ctx.body = content
      }

})
 


function rewriteImport(content){ //此方法用于 替换请求文件的路径 改成/@modules下面
  return content.replace(/ from ['|"]([^'"]+)['|"]/g, function(s0,s1){
    // . ../ /开头的，都是相对路径
    if(s1[0]!=='.'&& s1[1]!=='/'){
      return ` from '/@modules/${s1}'`
    }else{
      return s0
    }
  })
}

 

const server = app.listen(10086, ()=>{
  console.log('服务启动')
})

// const wss = new WebSocket.Server({ server });

// // 向所有客户端发送刷新通知
// function broadcast(message) {
//   wss.clients.forEach(client => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(message);
//     }
//   });
// }

// // 使用 chokidar 监听文件
// chokidar.watch(['./*.js', './*.vue'], {
//     ignored: /node_modules/,
//     persistent: true,
//     usePolling: true,
//     interval: 100, // 设置轮询间隔，单位是毫秒
//   }).on('change', (path) => {
//     console.log(`File ${path} has been changed`);
//     // 执行重载或其他操作
//   });
 

// wss.on('connection', ws => {
//   ws.on('message', message => console.log('received:', message));
// });