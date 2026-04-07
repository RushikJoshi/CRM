import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { FiCamera, FiMic, FiAlertTriangle, FiMaximize, FiMinimize, FiActivity } from "react-icons/fi";
import API from "../services/api";

const ProctoringOverlay = ({ token, stream, isStarted, proctoringStatus, onViolationsUpdate, onLimitReached }) => {
    const videoRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [camActive, setCamActive] = useState(false);
    const [micActive, setMicActive] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
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
        if (onViolationsUpdate) onViolationsUpdate(violations);
    }, [violations]);

    useEffect(() => {
        statusRef.current = proctoringStatus;
    }, [proctoringStatus]);

    const dismissWarning = () => setLastWarning("");

    // Toast logic (max once per 5 sec)
    const showWarning = (msg) => {
        const now = Date.now();
        if (now - lastWarningTime > 5000) {
            setLastWarning(msg);
            setLastWarningTime(now);
            
            setWarningCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 3) {
                    if (onLimitReached) onLimitReached();
                }
                return newCount;
            });
            
            setTimeout(() => setLastWarning(""), 4000);
        }
    };

    // Load Models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights";
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (e) {
                console.warn("Face-api models failed to load. Monitoring limited.");
            }
        };
        loadModels();
    }, []);

    // Media Assignment
    useEffect(() => {
        if (stream && videoRef.current) {
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
            const interval = setInterval(checkAudio, 6000); 
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
            try {
                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
                
                if (detections.length === 0) {
                    setViolations(prev => ({ ...prev, noFace: prev.noFace + 1 }));
                    showWarning("Face not detected! Please stay in front of the camera.");
                } else if (detections.length > 1) {
                    setViolations(prev => ({ ...prev, multipleFaces: prev.multipleFaces + 1 }));
                    showWarning("Multiple faces detected! Individual assessment required.");
                }
            } catch (e) { /* silent capture fail */ }
        };

        const interval = setInterval(detect, 4000); 
        return () => clearInterval(interval);
    }, [modelsLoaded, camActive, isStarted, lastWarningTime]);

    // Browser activity Tracking
    useEffect(() => {
        if (!isStarted) return;
        const handleVisibility = () => {
            if (document.hidden) {
                setViolations(prev => ({ ...prev, tabSwitch: prev.tabSwitch + 1 }));
                showWarning("Tab switch detected! This has been recorded.");
            }
        };
        const handleBlur = () => {
            // Only warn if they actually leave the focus, not just clicking a button inside
            setViolations(prev => ({ ...prev, tabSwitch: prev.tabSwitch + 1 }));
            showWarning("Security Protocol: Window Focus Lost.");
        };
        const handleFullscreen = () => {
            if (!document.fullscreenElement) {
                setViolations(prev => ({ ...prev, fullscreenExit: prev.fullscreenExit + 1 }));
                showWarning("Protocol Error: Please stay in Full-screen mode.");
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
    }, [isStarted, lastWarningTime]);

    // Periodic Backend Sync
    useEffect(() => {
        if (!isStarted) return;
        const syncLogs = async () => {
            try {
                await API.post("/test/public/proctoring/log", {
                    token,
                    violations: violationsRef.current,
                    proctoringStatus: statusRef.current,
                    warningCount
                });
            } catch (err) { console.error("Proctoring sync fail."); }
        };
        const syncInterval = setInterval(syncLogs, 15000);
        return () => clearInterval(syncInterval);
    }, [token, isStarted, warningCount]);

    if (!isStarted) return null;

    return (
        <>
            {/* Top Right Preview & Status */}
            <div className="fixed top-6 right-6 z-[200] flex flex-col items-end gap-3 pointer-events-none">
                <div className="relative w-44 h-32 bg-[#1a202c] rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-4xl backdrop-blur-xl">
                    <video 
                        ref={videoRef} 
                        id="proctor-video"
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover mirror transform -scale-x-100 opacity-80"
                    />
                    {!camActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                            <FiCamera className="text-white animate-pulse" size={24} />
                        </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${camActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${micActive ? 'bg-[#9b1c1c] shadow-[0_0_12px_rgba(155,28,28,0.8)]' : 'bg-slate-500'}`}></div>
                    </div>
                    
                    {/* Activity Indicator */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-[1rem] flex items-center gap-2 border border-white/5">
                        <FiActivity size={10} className="text-emerald-400 animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Secured Feed</span>
                    </div>
                </div>

                {/* Status Pills & Strike Counter */}
                <div className="flex flex-col items-end gap-2">
                    <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all duration-300 border border-white/10 ${warningCount >= 2 ? 'bg-[#9b1c1c] text-white animate-pulse' : 'bg-white text-[#1a202c]'}`}>
                        <FiAlertTriangle size={14} strokeWidth={3} className={warningCount >= 2 ? 'text-white' : 'text-[#9b1c1c]'} /> 
                        Strikes: {warningCount} / 3
                    </div>
                    {violations.tabSwitch > 0 && (
                        <div className="bg-[#2c336b] text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-[#2c336b]/10 border border-white/10">
                            <FiMaximize size={14} strokeWidth={3} /> Tab Switches: {violations.tabSwitch}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Toast Message */}
            <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] transition-all duration-700 ${lastWarning ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
                 <div className="bg-[#9b1c1c] text-white px-10 py-6 rounded-[3rem] shadow-4xl flex items-center gap-6 border-2 border-white/20 backdrop-blur-3xl ring-[12px] ring-[#9b1c1c]/10 max-w-[min(92vw,980px)]">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-white/10 flex items-center justify-center shadow-inner shrink-0">
                        <FiAlertTriangle size={32} className="text-white animate-bounce" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-1">Critical Violation Protocol</p>
                        <p className="text-xl font-black tracking-tight italic uppercase leading-none">{lastWarning}</p>
                    </div>
                    <button
                        type="button"
                        onClick={dismissWarning}
                        className="shrink-0 rounded-full bg-white text-[#9b1c1c] px-6 py-3 text-[10px] font-black uppercase tracking-[0.25em] shadow-xl hover:bg-slate-100 transition-colors"
                    >
                        Action
                    </button>
                 </div>
            </div>
        </>
    );
};

export default ProctoringOverlay;
