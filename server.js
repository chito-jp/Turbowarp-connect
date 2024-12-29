import Mist from "@turbowarp/mist";
import express from "express";
import axios from "axios";
import fs from "fs";
import cors from "cors";
console.log(cors);

let ws;
ws=new Mist({projectId:"1114861075",userAgent:"chito-bot"});
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

const MAX_API_WAIT_TIME = 3000; 
const MAX_TIME = 15000;

//動画を取得
const getVideo=async(videoId)=>{
  const startTime = Date.now();

  for (const instance of apis) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: MAX_API_WAIT_TIME });
      console.log(`使ってみたURL: ${instance}/api/v1/videos/${videoId}`);
      
      if (response.data && response.data.formatStreams) {
        return response.data; 
      } else {
        console.error(`formatStreamsが存在しない: ${instance}`);
      }
    } catch (error) {
      console.error(`エラーだよ: ${instance} - ${error.message}`);
    }

    if (Date.now() - startTime >= MAX_TIME) {
      console.log("接続がタイムアウトしました"+instance);
    }
  }

  console.error("動画を取得する方法が見つかりません");
  return "Error : Instance is Timeout";
};


//リクエストが正常かどうかチェック
const check=str=>str[0]=="1";

//リクエストからUNNを取得
const getRequest=str=>{
  const length=Number(str[1]+str[2])-10;
  const name=str.slice(3,3+length);
  const request=str.slice(3+length);
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
    const videoInfo=await getVideo(match[1]);
    const formatStreams = videoInfo.formatStreams || [];
    const streamUrl = formatStreams.reverse().map(stream => stream.url)[0];
    if(streamUrl){console.log("got!");return toNum(streamUrl);}
    const serverUrls=["https://natural-voltaic-titanium.glitch.me","https://wtserver3.glitch.me","https://wtserver1.glitch.me","https://wtserver2.glitch.me"];
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
app.use(cors());

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

app.get("/refresh", async (req, res) => {
    await initializeApis();
    ws=new Mist({projectId:"1114861075",userAgent:"chito-bot"});
    console.log("Refreshed!");
    res.sendStatus(200);
});

const PORT = process.env.PORT || 7777;
const listener=app.listen(PORT,()=>{
  console.log(`Server is running on PORT ${listener.address().port}`);
});
