import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function createRoom(roomId, user, videoUrl) {
  await setDoc(doc(db, "rooms", roomId), {
    host: user.uid,
    videoUrl: videoUrl || "",
    participants: [user.uid],
    currentTime: 0,
    service: videoUrl ? getServiceFromUrl(videoUrl) : null
  });
}

function getServiceFromUrl(url) {
  if (url.includes('netflix.com')) return 'Netflix';
  if (url.includes('primevideo.com')) return 'Prime Video';
  if (url.includes('hotstar.com')) return 'Hotstar';
  return 'Unknown';
}

export async function joinRoom(roomId, user) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (roomSnap.exists()) {
    console.log("Room data:", roomSnap.data());
  }
}
