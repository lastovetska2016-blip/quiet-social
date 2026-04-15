import { useState, useRef, useEffect } from "react";

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  resetKey,
}) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  }, [resetKey]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        onRecordingComplete(blob);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("Дозвольте доступ до мікрофона");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
  };

  const cancelRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioBlob(null);
      setAudioUrl(null);
      onCancel();
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      {!audioBlob && !recording && (
        <button
          type="button"
          onClick={startRecording}
          style={{
            background: "#f44336",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: 5,
          }}
        >
          🎤 Записати голосове
        </button>
      )}
      {recording && (
        <button
          type="button"
          onClick={stopRecording}
          style={{
            background: "#ff9800",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: 5,
          }}
        >
          ⏹️ Зупинити
        </button>
      )}
      {audioUrl && (
        <div style={{ marginTop: 5 }}>
          <audio src={audioUrl} controls style={{ width: "100%" }} />
          <button
            type="button"
            onClick={cancelRecording}
            style={{
              marginLeft: 10,
              background: "#ccc",
              border: "none",
              padding: "3px 8px",
              borderRadius: 5,
            }}
          >
            Скасувати
          </button>
        </div>
      )}
    </div>
  );
}
