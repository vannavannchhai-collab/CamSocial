"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff, Users
} from "lucide-react";
import type { Profile } from "@/types/database";

type Peer = {
  userId: string;
  profile?: Profile;
  pc: RTCPeerConnection;
  stream?: MediaStream;
};

export default function GroupCallRoom({
  callId,
  currentUserId,
  groupName,
  initialParticipants,
}: {
  callId: string;
  currentUserId: string;
  groupName?: string | null;
  initialParticipants: { user_id: string; profiles?: Profile }[];
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  const [peers, setPeers] = useState<{ userId: string; profile?: Profile; stream?: MediaStream }[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [status, setStatus] = useState("connecting");
  const router = useRouter();
  const supabase = createClient();

  const servers: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Join as participant
        await supabase.from("call_participants").upsert({
          call_id: callId,
          user_id: currentUserId,
        });

        const channel = supabase.channel(`group-call:${callId}`, {
          config: { broadcast: { self: false } },
        });

        channel
          .on("broadcast", { event: "signal" }, async ({ payload }) => {
            const { type, from, sdp, candidate, target } = payload;
            if (from === currentUserId) return;
            if (target && target !== currentUserId) return;

            let peer = peersRef.current.get(from);

            if (type === "join") {
              // New peer joined → create offer
              peer = await createPeer(from, true);
            }

            if (type === "offer" && sdp) {
              if (!peer) peer = await createPeer(from, false);
              await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
              const answer = await peer.pc.createAnswer();
              await peer.pc.setLocalDescription(answer);
              channel.send({
                type: "broadcast",
                event: "signal",
                payload: { type: "answer", sdp: answer, from: currentUserId, target: from },
              });
            }

            if (type === "answer" && sdp && peer) {
              await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }

            if (type === "ice-candidate" && candidate && peer) {
              try {
                await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch {}
            }

            if (type === "leave") {
              removePeer(from);
            }
          })
          .subscribe(async (subStatus) => {
            if (subStatus === "SUBSCRIBED") {
              // Announce join
              channel.send({
                type: "broadcast",
                event: "signal",
                payload: { type: "join", from: currentUserId },
              });
              setStatus("connected");
            }
          });

        channelRef.current = channel;

        // Create peers for existing participants
        for (const p of initialParticipants) {
          if (p.user_id !== currentUserId) {
            await createPeer(p.user_id, true, p.profiles);
          }
        }
      } catch (err: any) {
        console.error(err);
      }
    };

    const createPeer = async (userId: string, initiator: boolean, profile?: Profile): Promise<Peer> => {
      if (peersRef.current.has(userId)) return peersRef.current.get(userId)!;

      const pc = new RTCPeerConnection(servers);
      localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

      const peer: Peer = { userId, profile, pc };
      peersRef.current.set(userId, peer);

      pc.ontrack = (event) => {
        peer.stream = event.streams[0];
        updatePeersState();
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
              target: userId,
            },
          });
        }
      };

      if (initiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channelRef.current?.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "offer", sdp: offer, from: currentUserId, target: userId },
        });
      }

      updatePeersState();
      return peer;
    };

    const removePeer = (userId: string) => {
      const peer = peersRef.current.get(userId);
      if (peer) {
        peer.pc.close();
        peersRef.current.delete(userId);
        updatePeersState();
      }
    };

    const updatePeersState = () => {
      setPeers(
        Array.from(peersRef.current.values()).map((p) => ({
          userId: p.userId,
          profile: p.profile,
          stream: p.stream,
        }))
      );
    };

    init();

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((p) => p.pc.close());
      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: { type: "leave", from: currentUserId },
      });
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [callId]);

  const endCall = async () => {
    await supabase
      .from("video_calls")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", callId);

    await supabase
      .from("call_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("call_id", callId)
      .eq("user_id", currentUserId);

    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { type: "leave", from: currentUserId },
    });

    router.push("/messages");
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((v) => !v);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      peersRef.current.forEach(async (peer) => {
        const sender = peer.pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) await sender.replaceTrack(videoTrack);
      });
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        peersRef.current.forEach(async (peer) => {
          const sender = peer.pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(screenTrack);
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => toggleScreenShare();
        setScreenSharing(true);
      } catch {}
    }
  };

  const totalVideos = peers.length + 1;
  const gridClass =
    totalVideos <= 1 ? "grid-cols-1" :
    totalVideos <= 4 ? "grid-cols-2" :
    "grid-cols-3";

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <Users size={18} />
          <span className="font-medium">{groupName || "Group Call"}</span>
          <span className="text-sm text-white/60">({peers.length + 1})</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`flex-1 grid ${gridClass} gap-1 p-1`}>
        {/* Local */}
        <div className="relative bg-slate-900 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: screenSharing ? "none" : "scaleX(-1)" }}
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
            អ្នក {screenSharing ? "(Screen)" : ""}
          </div>
        </div>

        {/* Remote peers */}
        {peers.map((peer) => (
          <PeerVideo key={peer.userId} peer={peer} />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
        <button onClick={toggleMic} className={`w-14 h-14 rounded-full flex items-center justify-center ${micOn ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>
          {micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button onClick={toggleCam} className={`w-14 h-14 rounded-full flex items-center justify-center ${camOn ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>
          {camOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        <button onClick={toggleScreenShare} className={`w-14 h-14 rounded-full flex items-center justify-center ${screenSharing ? "bg-green-600 text-white" : "bg-white/20 text-white"}`}>
          {screenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
        </button>
        <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700">
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}

function PeerVideo({ peer }: { peer: { userId: string; profile?: Profile; stream?: MediaStream } }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && peer.stream) {
      ref.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
        {peer.profile?.full_name || peer.profile?.username || "User"}
      </div>
    </div>
  );
}
