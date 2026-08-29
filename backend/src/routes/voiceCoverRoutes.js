const express = require("express");
const multer = require("multer");
const router = express.Router();

const MAX_BYTES = 50 * 1024 * 1024;
const allowed = new Set(["audio/mpeg","audio/wav","audio/x-wav","audio/mp4","audio/x-m4a","audio/aac","audio/ogg","audio/flac","audio/webm","audio/pcm","application/octet-stream"]);
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:MAX_BYTES,files:2},fileFilter:(_req,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(new Error("Unsupported audio format"))});
const fail=(res,status,message,code)=>res.status(status).json({success:false,message,code});

router.post("/process", upload.fields([{name:"song",maxCount:1},{name:"referenceVoice",maxCount:1}]), async (req,res) => {
  try {
    const song = req.files?.song?.[0];
    const voice = req.files?.referenceVoice?.[0];
    if (!song) return fail(res,400,"Song audio is required.","SONG_REQUIRED");
    if (!voice) return fail(res,400,"Record or upload your own reference voice first.","REFERENCE_VOICE_REQUIRED");
    if (req.body.consent !== "true") return fail(res,400,"Voice authorization consent is required.","VOICE_CONSENT_REQUIRED");

    const workerUrl = process.env.VOICE_COVER_WORKER_URL;
    if (!workerUrl) return fail(res,503,"Self-voice engine is not deployed yet. Deploy the bundled Voice Cover worker and set VOICE_COVER_WORKER_URL in Render.","VOICE_WORKER_NOT_CONFIGURED");

    const form = new FormData();
    form.append("song", new Blob([song.buffer], {type:song.mimetype}), song.originalname || "song.mp3");
    form.append("reference_voice", new Blob([voice.buffer], {type:voice.mimetype}), voice.originalname || "my-voice.webm");
    form.append("output_format", ["wav","mp3"].includes(req.body.outputFormat) ? req.body.outputFormat : "mp3");

    const response = await fetch(`${workerUrl.replace(/\/$/,"")}/process`, {method:"POST",body:form});
    if (!response.ok) {
      const text = await response.text();
      return fail(res,response.status, text || "Self-voice processing failed.","VOICE_WORKER_FAILED");
    }

    const type = response.headers.get("content-type") || "audio/mpeg";
    res.status(200).set("Content-Type", type);
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error("voice-cover process failed", error);
    return fail(res,500,error?.message || "Voice cover processing failed.","VOICE_COVER_PROCESS_ERROR");
  }
});

router.use((err,_req,res,_next)=>{
  if(err?.code==="LIMIT_FILE_SIZE") return fail(res,413,"Audio file exceeds the 50 MB limit.","FILE_TOO_LARGE");
  return fail(res,400,err?.message||"Audio upload failed.","AUDIO_UPLOAD_ERROR");
});
module.exports=router;
