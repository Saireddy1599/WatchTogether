import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export function syncPlayback(roomId, videoElement) {
  // Listen for updates
  onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
    const data = docSnap.data();
    if (data?.currentTime !== undefined) {
      videoElement.currentTime = data.currentTime;
    }
  });

  // Update playback time
  videoElement.ontimeupdate = () => {
    setDoc(doc(db, "rooms", roomId), {
      currentTime: videoElement.currentTime
    }, { merge: true });
  };
}
