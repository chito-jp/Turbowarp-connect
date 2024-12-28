import Mist from "@turbowarp/mist";
import express from "express";
import axios from "axios";
import fs from "fs";

let ws=new Mist({projectId:"1114861075",userAgent:"chito-bot"});
const char=JSON.parse(fs.readFileSync("char.json"));
const getApis=async()=>{
    try {
      const {data:response} = await axios.get('https://wtserver.glitch.me/apis');
      return response;
    } catch (e) {
      console.error('データの取得に失敗しました:', e.message);
      return null;
    }
};

let apis;
const initializeApis = async () => {
  apis = await getApis();
  console.log(apis);
};

// 初期化
initializeApis();
console.log(apis);
//リクエストが正常かどうかチェック
const check=str=>str[0]=="1";

//リクエストからUNNを取得
const getRequest=str=>{
  const length=Number(str[1]+str[2])-10;
  let name="";
  let request="";
  for(let i=0;i<length;i++)name+=str[i+3];
  for(let i=0;i<str.length-length-3;i++)request+=str[i+length+3];
  return {length,name,request};
};
const toStr=num=>{
  let ans="";
  for(let i=0;i<num.length;i+=3)ans+=char[Number(`${num[i]}${num[i+1]}${num[i+2]}`)-101];
  return ans;
};
const toNum=str=>{
  let num="";
  for(let i=0;i<str.length;i++)num+=char.indexOf(str[i])+101;
  return num;
};

const requesthandler=async num=>{
  const dt=toStr(num);
  const match=dt.match(/(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w\-]+)/);
  if(match){
    const serverUrls=["https://natural-voltaic-titanium.glitch.me","https://wtserver3.glitch.me","https://wtserver1.glitch.me","https://wtserver2.glitch.me",];
    const randomIndex=Math.floor(Math.random() * serverUrls.length);
    const api=serverUrls[randomIndex];
    try{
      const {data:response}=await axios.get(`${api}/api/${match[1]}`);//わかめtubeのAPIを利用
      console.log(response?.stream_url);
      return toNum(response?.stream_url);
    }catch(e){
      console.error("Error : "+e.message+api);
      return toNum("Error : "+e.message);
    }
  };
  return num;
};

ws.on("set",async(n,v)=>{
  if(!check(v))return;
  console.log(`${n} to ${v[0]}`);
  const {length,name,request}=getRequest(v);
  const response=`${length+10}${name}${await requesthandler(request)}`;
  ws.set(n[2],`2${response}`);
  console.log(`Cloud is seted on ${n}`);
});

const app=express();

app.get("/",(req,res)=>{
  res.send("Server is running");
});

app.get("/tostr/:num",(req,res)=>{
  res.send(toStr(req.params.num));
});

app.get("/tonum/:str",(req,res)=>{
  res.send(toNum(req.params.str));
});

app.get("/apis",(req,res)=>{
  res.send(apis);
});

console.clear();

const PORT = process.env.PORT || 7777;
const listener=app.listen(PORT,()=>{
  console.log(`Server is running on PORT ${listener.address().port}`);
});
