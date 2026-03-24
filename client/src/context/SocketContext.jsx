import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { readSession } from './AuthContext';
import { useToast } from './ToastContext';
import { useNavigate } from 'react-router-dom';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const roles = ["super_admin", "company_admin", "branch_manager", "sales"];
    let session = null;
    for (const r of roles) {
      const s = readSession(r);
      if (s?.token) {
        session = s;
        break;
      }
    }

    if (!session?.token) {
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const newSocket = io(apiUrl, {
      auth: { token: session.token },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    newSocket.on('FOLLOW_UP_REMINDER', (data) => {
      console.log('🔔 Reminder received:', data);
      
      const role = session.user.role;
      const prefix = role === "super_admin" ? "/superadmin" : 
                    role === "company_admin" ? "/company" :
                    role === "branch_manager" ? "/branch" : "/sales";

      toast.info(
        <div className="cursor-pointer" onClick={() => navigate(`${prefix}/leads/${data.leadId}`)}>
           <div className="font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2">
             <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
             Follow-up Due
           </div>
           <div className="text-sm font-bold text-gray-900">{data.leadName}</div>
           <div className="text-xs text-gray-500 mt-1 line-clamp-1">{data.note}</div>
           <div className="mt-2 text-[9px] font-bold text-indigo-600 uppercase">Click to view lead</div>
        </div>,
        { autoClose: 10000 }
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [toast, navigate]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
