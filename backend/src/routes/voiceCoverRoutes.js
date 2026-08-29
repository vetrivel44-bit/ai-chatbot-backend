const express = require("express");
const multer = require("multer");
const router = express.Router();

const MAX_BYTES = 50 * 1024 * 1024;
const allowed = new Set(["audio/mpeg","audio/wav","audio/x-wav","audio/mp4","audio/x-m4a","audio/aac","audio/ogg","audio/flac","audio/webm","audio/pcm","application/octet-stream"]);
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:MAX_BYTES,files:10},fileFilter:(_req,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(new Error("Unsupported audio format"))});
const fail=(res,status,message,code)=>res.status(status).json({success:false,message,code});

// Custom voice cloning is intentionally not proxied to a paid provider here.
// The browser uses Puter directly for supported speech-to-speech voices.
// Exact user-voice cloning can be attached later through an authorized self-hosted RVC worker.
router.post("/voices",upload.array("samples",10),async(req,res)=>{
  if(req.body.consent!=="true") return fail(res,400,"Voice authorization consent is required.","VOICE_CONSENT_REQUIRED");
  if(!req.files?.length) return fail(res,400,"At least one voice sample is required.","VOICE_SAMPLE_REQUIRED");
  if(!process.env.RVC_SERVICE_URL) return fail(res,501,"Exact custom voice cloning is not enabled. Use a Puter-supported voice in Voice Cover, or configure the optional self-hosted RVC service.","RVC_NOT_CONFIGURED");
  return fail(res,501,"The self-hosted RVC service URL is configured but its training adapter is not connected yet.","RVC_ADAPTER_REQUIRED");
});

router.post("/separate",upload.single("song"),async(req,res)=>{
  if(!req.file) return fail(res,400,"Song audio file is required.","SONG_REQUIRED");
  if(!process.env.AUDIO_SEPARATOR_URL) return fail(res,501,"Audio stem separation is not configured yet. Configure a self-hosted Demucs/UVR-compatible service.","SEPARATOR_NOT_CONFIGURED");
  return fail(res,501,"Stem separator is configured but its provider adapter still needs to be connected.","SEPARATOR_ADAPTER_REQUIRED");
});

router.post("/mix",upload.single("convertedVocals"),async(req,res)=>{
  const {instrumentalUrl,outputFormat="mp3"}=req.body||{};
  if(!instrumentalUrl||!req.file) return fail(res,400,"Both instrumental and converted vocal audio are required.","TRACKS_REQUIRED");
  if(!["mp3","wav"].includes(outputFormat)) return fail(res,400,"Output format must be mp3 or wav.","BAD_OUTPUT_FORMAT");
  if(!process.env.AUDIO_MIXER_URL) return fail(res,501,"Final audio mixer is not configured yet. Configure a self-hosted FFmpeg/media worker.","MIXER_NOT_CONFIGURED");
  return fail(res,501,"Mixer is configured but its provider adapter still needs to be connected.","MIXER_ADAPTER_REQUIRED");
});

router.use((err,_req,res,_next)=>{
  if(err?.code==="LIMIT_FILE_SIZE") return fail(res,413,"Audio file exceeds the 50 MB limit.","FILE_TOO_LARGE");
  return fail(res,400,err?.message||"Audio upload failed.","AUDIO_UPLOAD_ERROR");
});
module.exports=router;
