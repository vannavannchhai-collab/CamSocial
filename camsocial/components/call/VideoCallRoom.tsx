"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff
} from "lucide-react";
import type { Profile } from "@/types/database";

type SignalMessage = {
  type: "offer" | "answer" | "ice-candidate" | "hangup";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  from: string;
};

export default function VideoCallRoom({
  callId,
  currentUserId,
  isCaller,
  otherUser,
  callType = "video",
}: {
  callId: string;
  currentUserId: string;
  isCaller: boolean;
  otherUser?: Profile | null;
  callType?: "video" | "voice";
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  const [status, setStatus] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const isVoiceOnly = callType === "voice";

  const servers: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    const init = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: isVoiceOnly ? false : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        if (localVideoRef.current && !isVoiceOnly) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(servers);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setStatus("connected");
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "signal",
              payload: {
                type: "ice-candidate",
                candidate: event.candidate.toJSON(),
                from: currentUserId,
              } as SignalMessage,
            });
          }
        };

        const channel = supabase.channel(`call:${callId}`, {
          config: { broadcast: { self: false } },
        });

        channel
          .on("broadcast", { event: "signal" }, async ({ payload }) => {
            const msg = payload as SignalMessage;
            if (msg.from === currentUserId) return;

            if (msg.type === "offer" && msg.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.send({
                type: "broadcast",
                event: "signal",
                payload: { type: "answer", sdp: answer, from: currentUserId } as SignalMessage,
              });
              setStatus("connected");
            }

            if (msg.type === "answer" && msg.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              setStatus("connected");
            }

            if (msg.type === "ice-candidate" && msg.candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
              } catch (e) {
                console.error("ICE error", e);
              }
            }

            if (msg.type === "hangup") {
              endCall(false);
            }
          })
          .subscribe(async (subStatus) => {
            if (subStatus === "SUBSCRIBED") {
              if (isCaller) {
                setStatus("ringing");
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({
                  type: "broadcast",
                  event: "signal",
                  payload: { type: "offer", sdp: offer, from: currentUserId } as SignalMessage,
                });
              } else {
                setStatus("ringing");
              }
            }
          });

        channelRef.current = channel;

        supabase
          .channel(`call-status:${callId}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "video_calls", filter: `id=eq.${callId}` },
            (payload) => {
              const newStatus = payload.new.status;
              if (["rejected", "ended", "missed"].includes(newStatus)) {
                endCall(false);
              }
              if (newStatus === "accepted") setStatus("connected");
            }
          )
          .subscribe();

        if (!isCaller) {
          await supabase
            .from("video_calls")
            .update({ status: "accepted", started_at: new Date().toISOString() })
            .eq("id", callId);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "មិនអាចចូលប្រើកាមេរ៉ា/មីក្រូហ្វូនបាន");
      }
    };

    init();
    return () => cleanup();
  }, [callId]);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  };

  const endCall = async (updateDb = true) => {
    if (updateDb) {
      await supabase
        .from("video_calls")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", callId);

      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: { type: "hangup", from: currentUserId } as SignalMessage,
      });
    }
    cleanup();
    setStatus("ended");
    setTimeout(() => router.push("/messages"), 1500);
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    if (isVoiceOnly) return;
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOn((v) => !v);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen share → back to camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;

      const camStream = localStreamRef.current;
      if (camStream && pcRef.current) {
        const videoTrack = camStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = camStream;
        }
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setScreenSharing(true);
      } catch (err) {
        console.error("Screen share error", err);
      }
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-50">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-red-600 rounded-xl">
            ត្រឡប់ក្រោយ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Main view */}
      <div className="flex-1 relative">
        {isVoiceOnly ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black text-white">
            <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-5xl font-bold mb-6 animate-pulse">
              {otherUser?.full_name?.[0] || "?"}
            </div>
            <p className="text-2xl font-semibold">{otherUser?.full_name || "អ្នកប្រើ"}</p>
            <p className="text-slate-400 mt-2">
              {status === "ringing" ? "កំពុងហៅសម្លេង..." : status === "connected" ? "កំពុងនិយាយ" : status === "connecting" ? "កំពុងភ្ជាប់..." : "បានបញ្ចប់"}
            </p>
          </div>
        ) : (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {status !== "connected" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold mb-4">
                  {otherUser?.full_name?.[0] || "?"}
                </div>
                <p className="text-xl font-semibold">{otherUser?.full_name || "អ្នកប្រើ"}</p>
                <p className="text-slate-300 mt-2">
                  {status === "ringing" ? "កំពុងហៅ..." : status === "connecting" ? "កំពុងភ្ជាប់..." : "បានបញ្ចប់"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Local PiP (only for video) */}
      {!isVoiceOnly && (
        <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: screenSharing ? "none" : "scaleX(-1)" }} />
          {screenSharing && (
            <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
              Screen
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${micOn ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}
        >
          {micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {!isVoiceOnly && (
          <button
            onClick={toggleCam}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${camOn ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}
          >
            {camOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        )}

        {!isVoiceOnly && (
          <button
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${screenSharing ? "bg-green-600 text-white" : "bg-white/20 text-white"}`}
            title="Screen Share"
          >
            {screenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
          </button>
        )}

        <button
          onClick={() => endCall(true)}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
