import { useFetcher } from "react-router";
import { useEffect, useRef, useState, useCallback } from "react";

export interface VoiceRecorderProps {
  subjectId: string;
  date: string;
  subjectName?: string;
  onSaved?: () => void;
}

type RecordingState = "idle" | "recording" | "recorded" | "playing";

export function VoiceRecorder({
  subjectId,
  date,
  subjectName,
  onSaved,
}: VoiceRecorderProps) {
  const fetcher = useFetcher();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSubmitting = fetcher.state !== "idle";
  const isSuccess = fetcher.data?.success;

  useEffect(() => {
    if (isSuccess && onSaved) {
      onSaved();
    }
  }, [isSuccess, onSaved]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState("recorded");

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(100);
      setRecordingState("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not access microphone. Please allow microphone access."
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingState]);

  const playRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setRecordingState("playing");
    }
  }, [audioUrl]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setRecordingState("recorded");
    }
  }, []);

  const discardRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setRecordingState("idle");
  }, [audioUrl]);

  const handleSubmit = useCallback(async () => {
    if (!audioBlob) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const formData = new FormData();
      formData.append("subjectId", subjectId);
      formData.append("date", date);
      formData.append("type", "VOICE");
      formData.append("content", base64);

      fetcher.submit(formData, {
        method: "post",
        action: "/api/save-narration",
      });
    };
    reader.readAsDataURL(audioBlob);
  }, [audioBlob, subjectId, date, fetcher]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {subjectName && (
        <div className="text-sm text-gray-500">
          Voice narration for{" "}
          <span className="font-medium text-gray-700">{subjectName}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        {recordingState === "idle" && (
          <button
            type="button"
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-coral text-white flex items-center justify-center hover:bg-coral/90 transition-colors focus:outline-none focus:ring-2 focus:ring-coral/50"
            aria-label="Start recording"
          >
            <MicIcon className="w-8 h-8" />
          </button>
        )}

        {recordingState === "recording" && (
          <>
            <div className="text-2xl font-mono text-gray-700 mb-4">
              {formatDuration(duration)}
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors animate-pulse focus:outline-none focus:ring-2 focus:ring-red-500/50"
              aria-label="Stop recording"
            >
              <StopIcon className="w-8 h-8" />
            </button>
          </>
        )}

        {(recordingState === "recorded" || recordingState === "playing") && (
          <>
            <div className="text-2xl font-mono text-gray-700 mb-4">
              {formatDuration(duration)}
            </div>
            <div className="flex items-center gap-4">
              {recordingState === "recorded" ? (
                <button
                  type="button"
                  onClick={playRecording}
                  className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  aria-label="Play recording"
                >
                  <PlayIcon className="w-6 h-6" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopPlayback}
                  className="w-16 h-16 rounded-full bg-gray-500 text-white flex items-center justify-center hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  aria-label="Stop playback"
                >
                  <StopIcon className="w-6 h-6" />
                </button>
              )}
              <button
                type="button"
                onClick={discardRecording}
                className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Discard and re-record"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setRecordingState("recorded")}
          className="hidden"
        />
      )}

      {(recordingState === "recorded" || recordingState === "playing") && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
              isSubmitting
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-coral text-white hover:bg-coral/90"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save Narration"}
          </button>
        </div>
      )}
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
