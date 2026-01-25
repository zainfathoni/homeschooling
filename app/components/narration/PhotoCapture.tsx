import { useFetcher } from "react-router";
import { useEffect, useRef, useState, useCallback } from "react";

export interface PhotoCaptureProps {
  subjectId: string;
  date: string;
  subjectName?: string;
  onSaved?: () => void;
}

type CaptureMode = "idle" | "camera" | "preview";

export function PhotoCapture({
  subjectId,
  date,
  subjectName,
  onSaved,
}: PhotoCaptureProps) {
  const fetcher = useFetcher();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captureMode, setCaptureMode] = useState<CaptureMode>("idle");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(true);

  const isSubmitting = fetcher.state !== "idle";
  const isSuccess = fetcher.data?.success;

  useEffect(() => {
    if (isSuccess && onSaved) {
      onSaved();
    }
  }, [isSuccess, onSaved]);

  useEffect(() => {
    const hasCamera =
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";
    setIsCameraSupported(hasCamera);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCaptureMode("camera");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not access camera. Please allow camera access."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setPhotoData(dataUrl);
      setCaptureMode("preview");
      stopCamera();
    }
  }, [stopCamera]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError("Image is too large. Please select an image under 10MB.");
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result as string);
        setCaptureMode("preview");
      };
      reader.onerror = () => {
        setError("Failed to read the image file.");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const discardPhoto = useCallback(() => {
    setPhotoData(null);
    setCaptureMode("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const cancelCamera = useCallback(() => {
    stopCamera();
    setCaptureMode("idle");
  }, [stopCamera]);

  const handleSubmit = useCallback(() => {
    if (!photoData) return;

    const formData = new FormData();
    formData.append("subjectId", subjectId);
    formData.append("date", date);
    formData.append("type", "PHOTO");
    formData.append("content", photoData);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/save-narration",
    });
  }, [photoData, subjectId, date, fetcher]);

  return (
    <div className="space-y-4">
      {subjectName && (
        <div className="text-sm text-gray-500">
          Photo narration for{" "}
          <span className="font-medium text-gray-700">{subjectName}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload photo"
      />

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200 min-h-[300px]">
        {captureMode === "idle" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              {isCameraSupported && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-20 h-20 rounded-full bg-coral text-white flex items-center justify-center hover:bg-coral/90 transition-colors focus:outline-none focus:ring-2 focus:ring-coral/50"
                  aria-label="Take photo with camera"
                >
                  <CameraIcon className="w-8 h-8" />
                </button>
              )}
              <button
                type="button"
                onClick={triggerFileUpload}
                className="w-20 h-20 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Upload photo from device"
              >
                <UploadIcon className="w-8 h-8" />
              </button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              {isCameraSupported
                ? "Take a photo or upload from your device"
                : "Upload a photo from your device"}
            </p>
          </div>
        )}

        {captureMode === "camera" && (
          <div className="w-full flex flex-col items-center gap-4">
            <video
              ref={videoRef}
              className="w-full max-w-md rounded-lg bg-black"
              playsInline
              muted
            />
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-coral text-white flex items-center justify-center hover:bg-coral/90 transition-colors focus:outline-none focus:ring-2 focus:ring-coral/50"
                aria-label="Capture photo"
              >
                <div className="w-10 h-10 rounded-full border-4 border-white" />
              </button>
              <button
                type="button"
                onClick={cancelCamera}
                className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Cancel camera"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {captureMode === "preview" && photoData && (
          <div className="w-full flex flex-col items-center gap-4">
            <img
              src={photoData}
              alt="Captured photo preview"
              className="w-full max-w-md rounded-lg object-contain max-h-64"
            />
            <button
              type="button"
              onClick={discardPhoto}
              className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Discard and retake photo"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {captureMode === "preview" && photoData && (
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

function CameraIcon({ className }: { className?: string }) {
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
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
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
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
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
