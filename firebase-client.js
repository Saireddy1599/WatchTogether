// Firebase client using CDN compat SDK. Exposes window.FirebaseClient with helpers.
;(function () {
  const config = window.FIREBASE_CONFIG;
  if (!config) {
    console.warn('No FIREBASE_CONFIG found - Firebase client disabled');
    window.FirebaseClient = null;
    return;
  }

  if (typeof firebase === 'undefined') {
    console.warn('Firebase compat SDK not loaded. Include CDN scripts in index.html');
    window.FirebaseClient = null;
    return;
  }

  firebase.initializeApp(config);
  const auth = firebase.auth();
  const db = firebase.firestore();

  async function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    return result.user; // Firebase User
  }

  // Redirect-based sign-in (avoids popup/COOP issues)
  async function googleSignInRedirect() {
    const provider = new firebase.auth.GoogleAuthProvider();
    // This will redirect the browser to the provider and return to the app
    await auth.signInWithRedirect(provider);
    return null; // caller should handle redirect flow via getRedirectResult
  }

  // Helper to read redirect result after returning to the app
  async function getRedirectUser() {
    try {
      const result = await auth.getRedirectResult();
      return result && result.user ? result.user : null;
    } catch (e) {
      console.warn('getRedirectUser error', e && e.message);
      return null;
    }
  }

  async function createRoom(roomId, user) {
    await db.collection('rooms').doc(roomId).set({
      host: user.uid,
      videoUrl: 'https://example.com/video.mp4',
      participants: [user.uid],
      currentTime: 0
    });
  }

  async function joinRoom(roomId, user) {
    const docRef = db.collection('rooms').doc(roomId);
    const snap = await docRef.get();
    if (snap.exists) return snap.data();
    return null;
  }

  function syncPlayback(roomId, videoElement) {
    db.collection('rooms').doc(roomId).onSnapshot((snap) => {
      const data = snap.data();
      if (data?.currentTime !== undefined) {
        videoElement.currentTime = data.currentTime;
      }
    });

    videoElement.ontimeupdate = () => {
      db.collection('rooms').doc(roomId).set({ currentTime: videoElement.currentTime }, { merge: true });
    };
  }

  window.FirebaseClient = {
  googleSignIn,
  googleSignInRedirect,
  getRedirectUser,
    createRoom,
    joinRoom,
    syncPlayback,
    auth,
    db
  };
})();
