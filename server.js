const https=require('https');
const {createServer}=require('node:http');
const options={
    hostname:'127.0.0.1',
    port: 3010,
};
const server=createServer((req,res)=>{
    res.statusCode=200;
    res.setHeader('Content-Type','text/plain');
    res.end('Hello World');
});

server.listen(options.port,options.hostname,()=>{
    console.log(`Server running at http://${options.hostname}:${options.port}/`);
})