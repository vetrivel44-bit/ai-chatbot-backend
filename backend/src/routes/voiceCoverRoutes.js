const express = require("express");
const multer = require("multer");
const router = express.Router();

const MAX_BYTES = 50 * 1024 * 1024;
const allowed = new Set(["audio/mpeg","audio/wav","audio/x-wav","audio/mp4","audio/x-m4a","audio/aac","audio/ogg","audio/flac","audio/webm","audio/pcm","application/octet-stream"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 10 },
  fileFilter: (_req,file,cb) => allowed.has(file.mimetype) ? cb(null,true) : cb(new Error("Unsupported audio format"))
});
const fail = (res,status,message,code,details) => res.status(status).json({success:false,message,code,...(details?{details}: {})});

router.post("/voices", upload.array("samples",10), async (req,res) => {
  try {
    if (req.body.consent !== "true") return fail(res,400,"Voice authorization consent is required.","VOICE_CONSENT_REQUIRED");
    if (!req.files?.length) return fail(res,400,"At least one voice sample is required.","VOICE_SAMPLE_REQUIRED");

    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VOICE_PROFILE_PROVIDER_KEY;
    if (!apiKey) {
      return fail(res,501,"ElevenLabs voice cloning is not configured yet. Add ELEVENLABS_API_KEY in Render Environment and redeploy.","ELEVENLABS_KEY_MISSING");
    }

    const form = new FormData();
    form.append("name", (req.body.name || "My Voice").slice(0,100));
    form.append("description", "User-authorized VetroAI Voice Cover profile");
    form.append("remove_background_noise", "false");

    for (const file of req.files) {
      const blob = new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" });
      form.append("files", blob, file.originalname || `voice-sample-${Date.now()}.wav`);
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });

    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

    if (!response.ok) {
      const providerMessage = data?.detail?.message || data?.detail || data?.message || `ElevenLabs returned ${response.status}`;
      return fail(res,response.status,"Could not create the ElevenLabs voice profile.","ELEVENLABS_VOICE_CREATE_FAILED",providerMessage);
    }

    if (!data.voice_id) return fail(res,502,"ElevenLabs created no voice ID.","ELEVENLABS_NO_VOICE_ID");
    return res.json({ success:true, voiceId:data.voice_id, requiresVerification:!!data.requires_verification });
  } catch (error) {
    console.error("voice-cover voice creation failed", error);
    return fail(res,500,error?.message || "Voice profile creation failed.","VOICE_PROFILE_CREATE_ERROR");
  }
});

router.post("/separate",upload.single("song"),async(req,res)=>{
  if(!req.file) return fail(res,400,"Song audio file is required.","SONG_REQUIRED");
  if(!process.env.AUDIO_SEPARATOR_URL) return fail(res,501,"Audio stem separation is not configured yet. Configure a Demucs/UVR-compatible service.","SEPARATOR_NOT_CONFIGURED");
  return fail(res,501,"Stem separator is configured but its provider adapter still needs to be connected.","SEPARATOR_ADAPTER_REQUIRED");
});

router.post("/mix",upload.single("convertedVocals"),async(req,res)=>{
  const {instrumentalUrl,outputFormat="mp3"}=req.body||{};
  if(!instrumentalUrl||!req.file) return fail(res,400,"Both instrumental and converted vocal audio are required.","TRACKS_REQUIRED");
  if(!["mp3","wav"].includes(outputFormat)) return fail(res,400,"Output format must be mp3 or wav.","BAD_OUTPUT_FORMAT");
  if(!process.env.AUDIO_MIXER_URL) return fail(res,501,"Final audio mixer is not configured yet. Configure an FFmpeg/media worker.","MIXER_NOT_CONFIGURED");
  return fail(res,501,"Mixer is configured but its provider adapter still needs to be connected.","MIXER_ADAPTER_REQUIRED");
});

router.use((err,_req,res,_next)=>{
  if(err?.code==="LIMIT_FILE_SIZE") return fail(res,413,"Audio file exceeds the 50 MB limit.","FILE_TOO_LARGE");
  return fail(res,400,err?.message||"Audio upload failed.","AUDIO_UPLOAD_ERROR");
});
module.exports=router;
