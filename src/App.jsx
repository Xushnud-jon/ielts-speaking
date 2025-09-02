import React, { useState, useRef } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showFullResult, setShowFullResult] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // Reset funksiyasi
  const resetAudio = () => {
    setFile(null);
    setAudioUrl(null);
    setResult("");
    setShowFullResult(false);
  };

  // Upload & analyze audio
  const uploadAudio = async (audioBlob) => {
    setLoading(true);
    setResult("");

    const formData = new FormData();
    if (audioBlob) {
      formData.append("audio", audioBlob, "recorded_audio.webm");
      setAudioUrl(URL.createObjectURL(audioBlob));
    } else if (file) {
      formData.append("audio", file);
      setAudioUrl(URL.createObjectURL(file));
    } else {
      alert("Please record or upload an audio file!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://ielts-speaking-backend.onrender.com/analyze-speech",
        { method: "POST", body: formData }
      );

      const data = await response.json();
      setResult(data.analysis || "No analysis result.");
    } catch (error) {
      console.error("Upload error:", error);
      setResult("❌ Serverda xatolik. Backendni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        uploadAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      alert("Mikrofonga ruxsat berilmagan yoki mikrofon mavjud emas.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const lines = result.split("\n");
  const displayLines = showFullResult ? lines : lines.slice(0, 3);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-2">
            🎤 IELTS Speaking AI
          </h1>
          <p className="text-gray-500 text-sm">AI bilan nutqingizni darhol tahlil qiling</p>
        </div>

        {/* File Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <label
            htmlFor="audio-upload"
            className="flex-1 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-center text-gray-600 text-sm transition-all duration-200 cursor-pointer hover:border-purple-400 hover:shadow-md"
          >
            📂 Audio yuklang
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const selectedFile = e.target.files[0];
                setFile(selectedFile);
                if (selectedFile) {
                  const url = URL.createObjectURL(selectedFile);
                  setAudioUrl(url);
                  uploadAudio(selectedFile); // darhol tahlil
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-6">
            <audio controls src={audioUrl} className="w-full rounded-lg" />
          </div>
        )}

        {/* Yangi audio tugmasi */}
        {(audioUrl || result) && (
          <button
            onClick={resetAudio}
            className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition"
          >
            🔄 Yangi audio
          </button>
        )}

        {/* Record / Analyze Button */}
        <div className="flex justify-center mb-6">
          {!recording ? (
            <button
              onClick={() => {
                if (file) {
                  // Fayl yuklangan bo'lsa, darhol tahlil qil
                  uploadAudio(file);
                } else {
                  // Fayl yo'q bo'lsa, normal recording start
                  startRecording();
                }
              }}
              className="group flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-7 py-4 rounded-full shadow-xl hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-200 font-semibold text-sm"
            >
              <span className="animate-pulse">🔴</span>
              <span>Boshlash</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="group flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-7 py-4 rounded-full shadow-xl hover:from-green-600 hover:to-green-700 active:scale-95 transition-all duration-200 font-semibold text-sm animate-pulse"
            >
              <span>⏹</span>
              <span>To'xtatish</span>
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-3"></div>
            <p className="text-purple-600 font-semibold text-sm">AI nutqingizni tahlil qilyapti...</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 shadow-inner">
            <h3 className="text-sm font-bold text-gray-700 mb-2">📊 Natija:</h3>
            <div className="text-gray-800 text-sm leading-relaxed font-sans">
              {displayLines.map((line, i) => {
                const lower = line.toLowerCase();
                if (lower.includes("band")) {
                  return (
                    <div key={i} className="font-bold text-black">
                      {i + 1}. {line}
                    </div>
                  );
                } else {
                  return <div key={i}>{line}</div>;
                }
              })}
            </div>
            {lines.length > 3 && !showFullResult && (
              <button
                onClick={() => setShowFullResult(true)}
                className="text-purple-600 text-sm mt-2 underline"
              >
                ...more
              </button>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 hover:text-gray-600 transition">
            🔐 Barcha ma'lumotlar maxfiy. Faqat nutq tahlil qilinadi.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
