const http=require('http'), fs=require('fs'), path=require('path');
const root=path.resolve('dist');
http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)) {res.writeHead(403).end(); return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'); res.end(data);});
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));
