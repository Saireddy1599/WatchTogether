import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function createRoom(roomId, user) {
  await setDoc(doc(db, "rooms", roomId), {
    host: user.uid,
    videoUrl: "https://example.com/video.mp4",
    participants: [user.uid],
    currentTime: 0
  });
}

export async function joinRoom(roomId, user) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (roomSnap.exists()) {
    console.log("Room data:", roomSnap.data());
  }
}
