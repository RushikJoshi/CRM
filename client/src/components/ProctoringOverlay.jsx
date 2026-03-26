import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { FiCamera, FiMic, FiAlertTriangle, FiMaximize, FiMinimize } from "react-icons/fi";
import API from "../services/api";

const ProctoringOverlay = ({ token, stream, isStarted, proctoringStatus, onViolationsUpdate }) => {
    const videoRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [camActive, setCamActive] = useState(false);
    const [micActive, setMicActive] = useState(false);
    const [violations, setViolations] = useState({
        noFace: 0,
        multipleFaces: 0,
        tabSwitch: 0,
        noise: 0,
        fullscreenExit: 0
    });
    const [lastWarning, setLastWarning] = useState("");
    const [lastWarningTime, setLastWarningTime] = useState(0);

    const violationsRef = useRef(violations);
    const statusRef = useRef(proctoringStatus);

    useEffect(() => {
        violationsRef.current = violations;
    }, [violations]);

    useEffect(() => {
        statusRef.current = proctoringStatus;
    }, [proctoringStatus]);

    // Toast logic (max once per 5 sec)
    const showWarning = (msg) => {
        const now = Date.now();
        if (now - lastWarningTime > 5000) {
            setLastWarning(msg);
            setLastWarningTime(now);
            setTimeout(() => setLastWarning(""), 3000);
        }
    };

    // Load Models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights";
            // Use hosted weights to avoid local asset issues
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                // faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL) // Optional
            ]);
            setModelsLoaded(true);
        };
        loadModels();
    }, []);

    // Media Assignment
    useEffect(() => {
        if (stream && videoRef.current) {
            console.log("ProctoringOverlay: Attaching stream to video element.");
            videoRef.current.srcObject = stream;
            setCamActive(true);
            setMicActive(true);
            setupAudioAnalysis(stream);
        }
    }, [stream]);

    // Audio Analysis
    const setupAudioAnalysis = (stream) => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 512;
            source.connect(analyzer);
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);

            const checkAudio = () => {
                analyzer.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                if (average > 40) { // Threshold for "noise"
                    setViolations(prev => ({ ...prev, noise: prev.noise + 1 }));
                    showWarning("Background noise detected!");
                }
            };
            const interval = setInterval(checkAudio, 4000); // Check every 4s
            return () => {
                clearInterval(interval);
                audioCtx.close();
            };
        } catch (e) { console.warn("Audio analysis blocked."); }
    };

    // Face Detection Loop
    useEffect(() => {
        if (!isStarted || !modelsLoaded || !camActive) return;

        const detect = async () => {
            if (!videoRef.current) return;
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
            
            if (detections.length === 0) {
                setViolations(prev => ({ ...prev, noFace: prev.noFace + 1 }));
                showWarning("Face not detected! Please stay in front of the camera.");
            } else if (detections.length > 1) {
                setViolations(prev => ({ ...prev, multipleFaces: prev.multipleFaces + 1 }));
                showWarning("Multiple faces detected! Individual assessment required.");
            }
        };

        const interval = setInterval(detect, 3000); // Every 3 seconds
        return () => clearInterval(interval);
    }, [modelsLoaded, camActive, lastWarningTime]);

    // Browser activity Tracking
    useEffect(() => {
        if (!isStarted) return;
        const handleVisibility = () => {
            if (document.hidden) {
                setViolations(prev => ({ ...prev, tabSwitch: prev.tabSwitch + 1 }));
                showWarning("Tab switch detected! This will affect your score.");
            }
        };
        const handleBlur = () => {
            setViolations(prev => ({ ...prev, tabSwitch: prev.tabSwitch + 1 }));
            showWarning("Window focus lost!");
        };
        const handleFullscreen = () => {
            if (!document.fullscreenElement) {
                setViolations(prev => ({ ...prev, fullscreenExit: prev.fullscreenExit + 1 }));
                showWarning("Please stay in fullscreen mode!");
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("fullscreenchange", handleFullscreen);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("fullscreenchange", handleFullscreen);
        };
    }, []);

    // Periodic Backend Sync
    useEffect(() => {
        if (!isStarted) return;
        const syncLogs = async () => {
            try {
                await API.post("/test/public/proctoring/log", {
                    token,
                    violations: violationsRef.current,
                    proctoringStatus: statusRef.current
                });
            } catch (err) { console.error("Proctoring sync fail."); }
        };
        const syncInterval = setInterval(syncLogs, 12000); // Every 12 seconds
        return () => clearInterval(syncInterval);
    }, [token, isStarted]);

    if (!isStarted) return null;

    return (
        <>
            {/* Top Right Preview & Status */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-3 pointer-events-none">
                <div className="relative w-32 h-24 bg-black rounded-2xl overflow-hidden border-2 border-white shadow-2xl ring-4 ring-indigo-500/10">
                    <video 
                        ref={videoRef} 
                        id="proctor-video"
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover mirror transform -scale-x-100"
                    />
                    {!camActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                            <FiCamera className="text-white animate-pulse" size={20} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${camActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${micActive ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-slate-500'}`}></div>
                    </div>
                </div>

                {/* Status Pills */}
                <div className="flex gap-2">
                    {violations.tabSwitch > 0 && (
                        <div className="bg-rose-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                            <FiAlertTriangle size={10} /> Tab Switches: {violations.tabSwitch}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Toast Message */}
            <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ${lastWarning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                 <div className="bg-rose-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-rose-500/50 backdrop-blur-xl">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                        <FiAlertTriangle size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Violation Warning</p>
                        <p className="text-sm font-extrabold">{lastWarning}</p>
                    </div>
                 </div>
            </div>
        </>
    );
};

export default ProctoringOverlay;
