// Application State
const AppState = {
    currentUser: null,
    currentScreen: 'auth',
    currentRoom: null,
    rooms: [],
    messages: [],
    participants: [],
    isHost: false,
    syncInterval: null,
    chatInterval: null,
    settings: {
        theme: 'dark',
        soundNotifications: true,
        chatNotifications: true
    },
    videoData: {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        isSeeking: false
    },
    sampleVideos: [
        {
            title: "Big Buck Bunny",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: "9:56",
            thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
        },
        {
            title: "Elephant Dream",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            duration: "10:53",
            thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg"
        }
    ]
};

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateAvatar(name) {
    const colors = ['6366f1', 'ec4899', '10b981', 'f59e0b', 'ef4444', '8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff`;
}

// Toast Notifications
export function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${title}</span>
            <button class="toast-close">&times;</button>
        </div>
        <p class="toast-message">${message}</p>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Loading Overlay and Toast Functions - exported for use in other modules
export function showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = text;
    overlay.classList.remove('hidden');
}

export function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
}

export function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(`${screenId}-screen`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        AppState.currentScreen = screenId;
    }
}

// Authentication
function initializeAuth() {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            tab.classList.add('active');
            const targetForm = document.getElementById(`${targetTab}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });

    // Login form submission
    const loginBtn = document.getElementById('login-btn');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');

    async function handleLogin() {
        const email = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();
        
        if (email && password) {
            showLoading('Logging in...');
            try {
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                loginUser(user.email);
                showToast('Success', 'Login successful!', 'success');
            } catch (error) {
                console.error('Login error:', error);
                showToast('Error', error.message, 'error');
            } finally {
                hideLoading();
            }
        } else {
            showToast('Error', 'Please enter email and password', 'error');
        }
    }

    loginBtn.addEventListener('click', handleLogin);
    
    // Handle Enter key in login form
    loginUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    loginPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Sign Up form submission
    const signupBtn = document.getElementById('signup-btn');
    const signupUsernameInput = document.getElementById('signup-username');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');

    async function handleSignup() {
        const username = signupUsernameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value.trim();
        
        if (username && email && password) {
            showLoading('Creating account...');
            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Update the user's display name
                await user.updateProfile({
                    displayName: username
                });
                
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    createdAt: new Date().toISOString()
                });

                showToast('Success', 'Account created successfully!', 'success');
                loginUser(email);
            } catch (error) {
                console.error('Signup error:', error);
                showToast('Error', error.message, 'error');
            } finally {
                hideLoading();
            }
        } else {
            showToast('Error', 'Please fill in all fields', 'error');
        }
    }

    signupBtn.addEventListener('click', handleSignup);
    
    // Handle Enter key in signup form
    [signupUsernameInput, signupEmailInput, signupPasswordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSignup();
        });
    });

    // Guest form submission
    const guestBtn = document.getElementById('guest-btn');
    const guestUsernameInput = document.getElementById('guest-username');

    async function handleGuest() {
        const username = guestUsernameInput.value.trim();
        
        if (username) {
            showLoading('Joining as guest...');
            try {
                const userCredential = await firebase.auth().signInAnonymously();
                const user = userCredential.user;
                
                // Update the anonymous user's display name
                await user.updateProfile({
                    displayName: username
                });
                
                showToast('Success', 'Joined as guest!', 'success');
                loginUser(username);
            } catch (error) {
                console.error('Guest login error:', error);
                showToast('Error', error.message, 'error');
            } finally {
                hideLoading();
            }
        } else {
            showToast('Error', 'Please enter a display name', 'error');
        }
    }

    guestBtn.addEventListener('click', handleGuest);
    
    // Handle Enter key in guest form
    guestUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGuest();
    });

    // Google Sign-In (Firebase)
    const googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
        // Prefer redirect-based sign-in to avoid Cross-Origin-Opener-Policy popup closing warnings.
        googleBtn.addEventListener('click', async () => {
            if (!window.FirebaseClient || (!window.FirebaseClient.googleSignInRedirect && !window.FirebaseClient.googleSignIn)) {
                showToast('Error', 'Firebase not configured in this app', 'error');
                return;
            }

            // Try redirect flow first
            if (window.FirebaseClient.googleSignInRedirect) {
                try {
                    await window.FirebaseClient.googleSignInRedirect();
                    // The browser will navigate away; no further code here.
                } catch (err) {
                    console.warn('Redirect sign-in failed, falling back to popup', err);
                    // Fallback to popup sign-in
                    try {
                        showLoading('Signing in with Google...');
                        const user = await window.FirebaseClient.googleSignIn();
                        const idToken = await user.getIdToken();
                        const res = await fetch('/auth/firebase-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idToken })
                        });
                        const data = await res.json();
                        if (res.ok && data.token) {
                            window.AppConfig.serverJwt = data.token;
                            showToast('Success', `Signed in as ${user.displayName}`, 'success');
                            loginUser(user.displayName || user.email);
                        } else {
                            showToast('Error', data.error || 'Failed to exchange token', 'error');
                        }
                    } catch (err2) {
                        console.error('Popup fallback sign-in error', err2);
                        showToast('Error', 'Google sign-in failed', 'error');
                    } finally {
                        hideLoading();
                    }
                }
            } else {
                // No redirect helper available, use popup
                try {
                    showLoading('Signing in with Google...');
                    const user = await window.FirebaseClient.googleSignIn();
                    const idToken = await user.getIdToken();
                    const res = await fetch('/auth/firebase-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken })
                    });
                    const data = await res.json();
                    if (res.ok && data.token) {
                        window.AppConfig.serverJwt = data.token;
                        showToast('Success', `Signed in as ${user.displayName}`, 'success');
                        loginUser(user.displayName || user.email);
                    } else {
                        showToast('Error', data.error || 'Failed to exchange token', 'error');
                    }
                } catch (err) {
                    console.error('Google sign-in error', err);
                    showToast('Error', 'Google sign-in failed', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }
}

// Handle redirect result when the app loads (complete sign-in after redirect)
async function handleFirebaseRedirectResult() {
    if (!window.FirebaseClient || !window.FirebaseClient.getRedirectUser) return;
    try {
        const user = await window.FirebaseClient.getRedirectUser();
        if (user) {
            showLoading('Finishing sign-in...');
            const idToken = await user.getIdToken();
            const res = await fetch('/auth/firebase-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                window.AppConfig.serverJwt = data.token;
                showToast('Success', `Signed in as ${user.displayName}`, 'success');
                loginUser(user.displayName || user.email);
            } else {
                showToast('Error', data.error || 'Failed to exchange token', 'error');
            }
        }
    } catch (e) {
        console.warn('Redirect result handling failed', e && e.message);
    } finally {
        try { hideLoading(); } catch (e) {}
    }
}

// Run redirect result handler early
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    handleFirebaseRedirectResult();
} else {
    window.addEventListener('DOMContentLoaded', handleFirebaseRedirectResult);
}

function loginUser(username) {
    AppState.currentUser = {
        id: generateId(),
        username: username,
        avatar: generateAvatar(username),
        status: 'online',
        role: 'user',
        isGuest: false
    };
    
    showToast('Success', `Welcome back, ${username}!`, 'success');
    initializeDashboard();
    showScreen('dashboard');
}

function createUser(username, email) {
    AppState.currentUser = {
        id: generateId(),
        username: username,
        email: email,
        avatar: generateAvatar(username),
        status: 'online',
        role: 'user',
        isGuest: false
    };
    
    showToast('Success', `Account created! Welcome, ${username}!`, 'success');
    initializeDashboard();
    showScreen('dashboard');
}

function loginAsGuest(username) {
    AppState.currentUser = {
        id: generateId(),
        username: username,
        avatar: generateAvatar(username),
        status: 'online',
        role: 'guest',
        isGuest: true
    };
    
    showToast('Success', `Joined as guest: ${username}`, 'success');
    initializeDashboard();
    showScreen('dashboard');
}

// Dashboard
function initializeDashboard() {
    updateUserInfo();
    loadRooms();
    
    // Set up dashboard event listeners
    const logoutBtn = document.getElementById('logout-btn');
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const browsePublicBtn = document.getElementById('browse-public-btn');

    // Remove existing listeners to avoid duplicates
    logoutBtn.replaceWith(logoutBtn.cloneNode(true));
    createRoomBtn.replaceWith(createRoomBtn.cloneNode(true));
    joinRoomBtn.replaceWith(joinRoomBtn.cloneNode(true));
    browsePublicBtn.replaceWith(browsePublicBtn.cloneNode(true));

    // Add fresh listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('create-room-btn').addEventListener('click', showCreateRoomModal);
    document.getElementById('join-room-btn').addEventListener('click', showJoinRoomModal);
    document.getElementById('browse-public-btn').addEventListener('click', browsePubblicRooms);

    // Initialize streaming service buttons
    const serviceButtons = document.querySelectorAll('.service-btn');
    serviceButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });
    
    document.querySelectorAll('.service-btn').forEach(button => {
        button.addEventListener('click', () => {
            const service = button.dataset.service;
            if (service) {
                createRoomForService(service);
            }
        });
    });
}

function updateUserInfo() {
    const user = AppState.currentUser;
    document.getElementById('user-avatar').src = user.avatar;
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-status').className = `user-status ${user.status}`;
}

function createRoomForService(service) {
    const serviceUrls = {
        netflix: 'https://www.netflix.com',
        prime: 'https://www.primevideo.com',
        hotstar: 'https://www.hotstar.com',
        netmirror: 'https://netmirror.org',
        youtube: 'https://www.youtube.com'
    };

    const serviceNames = {
        netflix: 'Netflix',
        prime: 'Prime Video',
        hotstar: 'Hotstar',
        netmirror: 'NetMirror',
        youtube: 'YouTube'
    };

    if (!serviceNames[service]) {
        showToast('Error', 'Invalid streaming service', 'error');
        return;
    }

    showLoading(`Creating ${serviceNames[service]} room...`);
    
    // Generate room ID
    const roomId = generateRandomRoomId();
    const currentUser = AppState.currentUser;

    if (!currentUser) {
        hideLoading();
        showToast('Error', 'You must be logged in to create a room', 'error');
        return;
    }

    // Create room in Firestore
    const roomData = {
        id: roomId,
        name: `${serviceNames[service]} Watch Party`,
        description: `Watch ${serviceNames[service]} together with friends`,
        hostId: currentUser.id,
        hostName: currentUser.username,
        service: service,
        serviceUrl: serviceUrls[service],
        isPublic: false,
        password: '',
        maxParticipants: 10,
        currentParticipants: 1,
        participants: [currentUser.id],
        videoUrl: '',
        videoTitle: 'No video selected',
        videoType: service,
        isPlaying: false,
        currentTime: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true
    };

    firebase.firestore().collection('rooms').doc(roomId)
        .set(roomData)
        .then(() => {
            // Update AppState
            AppState.currentRoom = roomData;
            AppState.isHost = true;
            showToast('Success', `${serviceNames[service]} room created!`, 'success');
            initializeWatchRoom();
            showScreen('watch');
        })
        .catch(error => {
            console.error('Error creating room:', error);
            showToast('Error', 'Failed to create room: ' + error.message, 'error');
        })
        .finally(() => {
            hideLoading();
        });
}

function generateRandomRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function loadRooms() {
    try {
        showLoading('Loading rooms...');
        
        const roomsSnapshot = await firebase.firestore()
            .collection('rooms')
            .where('isActive', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        AppState.rooms = roomsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayActiveRooms();
        displayRecentRooms();
    } catch (error) {
        console.error('Error loading rooms:', error);
        showToast('Error', 'Failed to load rooms: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayActiveRooms() {
    const container = document.getElementById('active-rooms');
    if (!container) return;

    const currentUser = AppState.currentUser;
    if (!currentUser) return;

    const activeRooms = AppState.rooms.filter(room => 
        (room.participants && room.participants.includes(currentUser.id)) || 
        room.isPublic
    );
    
    if (activeRooms.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No active rooms. Create one to get started!</p>
                <div class="empty-state-actions">
                    <button class="btn btn-primary" onclick="showCreateRoomModal()">Create Room</button>
                    <button class="btn btn-secondary" onclick="showJoinRoomModal()">Join Room</button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = activeRooms.map(room => `
        <div class="room-card">
            <div class="room-card-header">
                <h3 class="room-name">${room.name || 'Untitled Room'}</h3>
                <span class="room-status ${room.isActive ? 'active' : 'inactive'}">${room.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <p class="room-description">${room.description || 'No description'}</p>
            <div class="room-meta">
                <span class="room-participants">👥 ${room.currentParticipants || 0}/${room.maxParticipants || 10}</span>
                <span class="room-service">🎬 ${room.service || 'No service'}</span>
            </div>
            <div class="room-footer">
                <button class="btn btn-primary" onclick="joinRoom('${room.id}')">Join Room</button>
                ${room.hostId === currentUser.id ? `
                    <button class="btn btn-secondary" onclick="showInvite('${room.id}')">Invite</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function displayRecentRooms() {
    const container = document.getElementById('recent-rooms');
    if (!container) return;

    const currentUser = AppState.currentUser;
    if (!currentUser) return;

    const recentRooms = AppState.rooms
        .filter(room => room.isActive)
        .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
        .slice(0, 5);

    if (recentRooms.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No recent rooms available</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentRooms.map(room => `
        <div class="room-item">
            <div class="room-item-info">
                <h4>${room.name || 'Untitled Room'}</h4>
                <p>Created by ${room.hostName || 'Unknown'}</p>
                <p class="room-timestamp">${formatTimestamp(room.createdAt?.toDate?.() || new Date())}</p>
            </div>
            <div class="room-item-meta">
                <span class="room-service">${room.service || 'No service'}</span>
                <span class="room-participants">👥 ${room.currentParticipants || 0}</span>
                <button class="btn btn-sm btn-primary" onclick="joinRoom('${room.id}')">Join</button>
            </div>
        </div>
    `).join('');
}

function logout() {
    AppState.currentUser = null;
    AppState.currentRoom = null;
    clearIntervals();
    showScreen('auth');
    showToast('Info', 'Logged out successfully', 'info');
}

function browsePubblicRooms() {
    showToast('Info', 'Public rooms feature coming soon!', 'info');
}

// Room Management
function initializeRoomModals() {
    // Create Room Modal
    document.getElementById('close-room-modal').addEventListener('click', hideCreateRoomModal);
    document.getElementById('cancel-room-btn').addEventListener('click', hideCreateRoomModal);
    document.getElementById('create-room-confirm-btn').addEventListener('click', createRoom);

    // Join Room Modal
    document.getElementById('close-join-modal').addEventListener('click', hideJoinRoomModal);
    document.getElementById('cancel-join-btn').addEventListener('click', hideJoinRoomModal);
    document.getElementById('join-room-confirm-btn').addEventListener('click', joinRoomWithCode);
}

function showCreateRoomModal() {
    document.getElementById('room-modal').classList.remove('hidden');
}

function hideCreateRoomModal() {
    document.getElementById('room-modal').classList.add('hidden');
    clearRoomForm();
}

function showJoinRoomModal() {
    document.getElementById('join-modal').classList.remove('hidden');
}

function hideJoinRoomModal() {
    document.getElementById('join-modal').classList.add('hidden');
    document.getElementById('join-room-code').value = '';
    document.getElementById('join-room-password').value = '';
}

function clearRoomForm() {
    document.getElementById('room-name').value = '';
    document.getElementById('room-description').value = '';
    document.getElementById('room-privacy').value = 'private';
    document.getElementById('room-password').value = '';
    document.getElementById('room-max-participants').value = '10';
}

function createRoom() {
    const name = document.getElementById('room-name').value.trim();
    const description = document.getElementById('room-description').value.trim();
    const isPublic = document.getElementById('room-privacy').value === 'public';
    const password = document.getElementById('room-password').value.trim();
    const maxParticipants = parseInt(document.getElementById('room-max-participants').value);

    if (!name) {
        showToast('Error', 'Please enter a room name', 'error');
        return;
    }

    const room = {
        id: generateId(),
        name: name,
        description: description || 'Watch party room',
        hostId: AppState.currentUser.id,
        isPublic: isPublic,
        password: password,
        maxParticipants: maxParticipants,
        currentParticipants: 1,
        videoUrl: '',
        videoTitle: 'No video loaded',
        videoType: 'none',
        isPlaying: false,
        currentTime: 0,
        createdAt: new Date().toISOString(),
        participants: [AppState.currentUser.id]
    };

    AppState.rooms.push(room);
    AppState.currentRoom = room;
    AppState.isHost = true;

    hideCreateRoomModal();
    showLoading('Creating room...');
    
    setTimeout(() => {
        hideLoading();
        showToast('Success', `Room "${name}" created successfully!`, 'success');
        initializeWatchRoom();
        showScreen('watch');
    }, 1500);
}

async function joinRoom(roomId) {
    if (!AppState.currentUser) {
        showToast('Error', 'You must be logged in to join a room', 'error');
        return;
    }

    try {
        showLoading('Joining room...');
        
        // Get latest room data from Firestore
        const roomRef = firebase.firestore().collection('rooms').doc(roomId);
        const roomDoc = await roomRef.get();

        if (!roomDoc.exists) {
            throw new Error('Room not found');
        }

        const roomData = { id: roomDoc.id, ...roomDoc.data() };
        
        // Check if room is still active
        if (!roomData.isActive) {
            throw new Error('This room is no longer active');
        }

        // Check room capacity
        if (roomData.currentParticipants >= roomData.maxParticipants) {
            throw new Error('Room is full');
        }

        // Check if user is already in the room
        const isNewParticipant = !roomData.participants.includes(AppState.currentUser.id);
        
        if (isNewParticipant) {
            // Update participants array and count in Firestore
            await roomRef.update({
                participants: firebase.firestore.FieldValue.arrayUnion(AppState.currentUser.id),
                currentParticipants: firebase.firestore.FieldValue.increment(1)
            });

            // Update room data with new participant
            roomData.participants.push(AppState.currentUser.id);
            roomData.currentParticipants++;
        }

        // Update application state
        AppState.currentRoom = roomData;
        AppState.isHost = roomData.hostId === AppState.currentUser.id;
    } catch (error) {
        console.error('Error joining room:', error);
        showToast('Error', error.message || 'Failed to join room', 'error');
    } finally {
        hideLoading();
    }
}

function joinRoomWithCode() {
    const code = document.getElementById('join-room-code').value.trim();
    const password = document.getElementById('join-room-password').value.trim();

    if (!code) {
        showToast('Error', 'Please enter a room code', 'error');
        return;
    }

    // For demo, use the first room ID as a valid code
    const room = AppState.rooms[0];
    if (room) {
        hideJoinRoomModal();
        joinRoom(room.id);
    } else {
        showToast('Error', 'Invalid room code', 'error');
    }
}

// Watch Room
function initializeWatchRoom() {
    updateRoomInfo();
    loadMessages();
    updateParticipants();
    initializeVideoPlayer();
    initializeChatSystem();
    initializeRoomControls();
    startSyncTimer();
}

function updateRoomInfo() {
    const room = AppState.currentRoom;
    document.getElementById('room-title').textContent = room.name;
    document.getElementById('participant-count').textContent = room.currentParticipants;
}

function initializeVideoPlayer() {
    const video = document.getElementById('main-video');
    const room = AppState.currentRoom;

    if (room.videoUrl) {
        video.src = room.videoUrl;
        video.currentTime = room.currentTime;
        document.getElementById('video-title').textContent = room.videoTitle;
        updateVideoTime();
    }

    // Remove existing listeners
    video.removeEventListener('play', handleVideoPlay);
    video.removeEventListener('pause', handleVideoPause);
    video.removeEventListener('seeked', handleVideoSeek);
    video.removeEventListener('timeupdate', updateVideoTime);

    // Add fresh listeners
    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);
    video.addEventListener('seeked', handleVideoSeek);
    video.addEventListener('timeupdate', updateVideoTime);
}

function handleVideoPlay() {
    if (AppState.isHost) {
        AppState.currentRoom.isPlaying = true;
        broadcastVideoState();
    }
}

function handleVideoPause() {
    if (AppState.isHost) {
        AppState.currentRoom.isPlaying = false;
        broadcastVideoState();
    }
}

function handleVideoSeek() {
    if (AppState.isHost) {
        AppState.currentRoom.currentTime = document.getElementById('main-video').currentTime;
        broadcastVideoState();
    }
}

function updateVideoTime() {
    const video = document.getElementById('main-video');
    const timeDisplay = document.getElementById('video-time');
    
    if (video.duration) {
        const current = formatTime(video.currentTime);
        const total = formatTime(video.duration);
        timeDisplay.textContent = `${current} / ${total}`;
    }
}

function broadcastVideoState() {
    // Simulate broadcasting video state to other participants
    const room = AppState.currentRoom;
    console.log('Broadcasting video state:', {
        isPlaying: room.isPlaying,
        currentTime: room.currentTime
    });
}

function syncVideoState() {
    const video = document.getElementById('main-video');
    const room = AppState.currentRoom;
    
    if (!AppState.isHost && room.videoUrl) {
        // Sync with host's video state
        const timeDiff = Math.abs(video.currentTime - room.currentTime);
        
        if (timeDiff > 2) { // Sync if difference is more than 2 seconds
            video.currentTime = room.currentTime;
        }
        
        if (room.isPlaying && video.paused) {
            video.play().catch(console.error);
        } else if (!room.isPlaying && !video.paused) {
            video.pause();
        }
    }
}

function startSyncTimer() {
    if (AppState.syncInterval) {
        clearInterval(AppState.syncInterval);
    }
    
    AppState.syncInterval = setInterval(() => {
        syncVideoState();
        updateSyncStatus();
    }, 1000);
}

function updateSyncStatus() {
    const status = document.getElementById('sync-status');
    const isConnected = true; // Simulate connection status
    
    if (isConnected) {
        status.textContent = '🟢 Synchronized';
        status.className = 'sync-status connected';
    } else {
        status.textContent = '🔴 Connecting...';
        status.className = 'sync-status disconnected';
    }
}

// Chat System
function initializeChatSystem() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    // Remove existing listeners
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
    const newChatInput = chatInput.cloneNode(true);
    chatInput.parentNode.replaceChild(newChatInput, chatInput);

    // Add fresh listeners
    document.getElementById('chat-send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initialize sidebar tabs
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const sidebarPanels = document.querySelectorAll('.sidebar-panel');

    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPanel = tab.dataset.tab;
            
            sidebarTabs.forEach(t => t.classList.remove('active'));
            sidebarPanels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const panel = document.getElementById(`${targetPanel}-panel`);
            if (panel) {
                panel.classList.add('active');
            }
        });
    });

    startChatPolling();
}

function loadMessages() {
    AppState.messages = SampleData.messages.filter(msg => 
        msg.roomId === AppState.currentRoom.id
    );
    displayMessages();
}

function displayMessages() {
    const container = document.getElementById('chat-messages');
    
    container.innerHTML = AppState.messages.map(msg => `
        <div class="chat-message">
            <img class="message-avatar" src="${generateAvatar(msg.username)}" alt="${msg.username}">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${msg.username}</span>
                    <span class="message-time">${formatTimestamp(msg.timestamp)}</span>
                </div>
                <div class="message-text">${msg.message}</div>
            </div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    const newMessage = {
        id: generateId(),
        roomId: AppState.currentRoom.id,
        userId: AppState.currentUser.id,
        username: AppState.currentUser.username,
        message: message,
        timestamp: new Date().toISOString(),
        type: 'message'
    };

    AppState.messages.push(newMessage);
    input.value = '';
    displayMessages();

    // Simulate message broadcasting
    console.log('Message sent:', newMessage);
}

function startChatPolling() {
    if (AppState.chatInterval) {
        clearInterval(AppState.chatInterval);
    }
    
    AppState.chatInterval = setInterval(() => {
        // Simulate receiving new messages
        checkForNewMessages();
    }, 5000);
}

function checkForNewMessages() {
    // Simulate new message arrival
    const randomMessages = [
        "Great movie choice! 👍",
        "This scene is amazing!",
        "Anyone else getting popcorn? 🍿",
        "The cinematography is incredible",
        "Plot twist incoming! 😮"
    ];

    if (Math.random() < 0.1 && AppState.messages.length < 10) { // 10% chance
        const randomUser = SampleData.users[Math.floor(Math.random() * SampleData.users.length)];
        const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        
        const newMessage = {
            id: generateId(),
            roomId: AppState.currentRoom.id,
            userId: randomUser.id,
            username: randomUser.username,
            message: randomMessage,
            timestamp: new Date().toISOString(),
            type: 'message'
        };

        if (randomUser.id !== AppState.currentUser.id) {
            AppState.messages.push(newMessage);
            displayMessages();
            
            if (AppState.settings.chatNotifications) {
                showToast('New Message', `${randomUser.username}: ${randomMessage}`, 'info');
            }
        }
    }
}

// Participants Management
function updateParticipants() {
    AppState.participants = SampleData.users.filter(user => 
        AppState.currentRoom.participants.includes(user.id)
    );
    displayParticipants();
}

function displayParticipants() {
    const container = document.getElementById('participants-list');
    
    container.innerHTML = AppState.participants.map(participant => `
        <div class="participant-item">
            <img class="participant-avatar" src="${participant.avatar}" alt="${participant.username}">
            <div class="participant-info">
                <div class="participant-name">${participant.username}</div>
                <div class="participant-role ${participant.role}">${participant.role}</div>
            </div>
            <div class="participant-status ${participant.status}"></div>
        </div>
    `).join('');
}

// Room Controls
function initializeRoomControls() {
    // Remove existing listeners by cloning elements
    const controls = ['add-video-btn', 'queue-btn', 'invite-btn', 'settings-btn', 'leave-room-btn'];
    controls.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
        }
    });

    // Add fresh listeners
    document.getElementById('add-video-btn').addEventListener('click', showVideoModal);
    document.getElementById('queue-btn').addEventListener('click', showQueue);
    document.getElementById('invite-btn').addEventListener('click', showInvite);
    document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
    document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);
}

function showQueue() {
    showToast('Info', 'Queue feature coming soon!', 'info');
}

function showInvite() {
    const roomCode = AppState.currentRoom.id;
    navigator.clipboard.writeText(`Room Code: ${roomCode}`).then(() => {
        showToast('Success', 'Room code copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Info', `Room Code: ${roomCode}`, 'info');
    });
}

function leaveRoom() {
    const room = AppState.currentRoom;
    room.participants = room.participants.filter(id => id !== AppState.currentUser.id);
    room.currentParticipants--;

    clearIntervals();
    AppState.currentRoom = null;
    AppState.isHost = false;

    showToast('Info', `Left "${room.name}"`, 'info');
    loadRooms(); // Refresh room list
    showScreen('dashboard');
}

// Video Management
function initializeVideoModal() {
    document.getElementById('close-video-modal').addEventListener('click', hideVideoModal);
    document.getElementById('cancel-video-btn').addEventListener('click', hideVideoModal);
    document.getElementById('add-video-confirm-btn').addEventListener('click', addVideo);

    // Video source tabs
    const videoTabs = document.querySelectorAll('.video-tab');
    const videoPanels = document.querySelectorAll('.video-source-panel');

    videoTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSource = tab.dataset.source;
            
            videoTabs.forEach(t => t.classList.remove('active'));
            videoPanels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const panel = document.getElementById(`${targetSource}-panel`);
            if (panel) {
                panel.classList.add('active');
            }
        });
    });

    // Load sample videos
    loadSampleVideos();
}

function showVideoModal() {
    document.getElementById('video-modal').classList.remove('hidden');
}

function hideVideoModal() {
    document.getElementById('video-modal').classList.add('hidden');
    clearVideoForm();
}

function clearVideoForm() {
    document.getElementById('youtube-url').value = '';
    document.getElementById('direct-url').value = '';
    document.querySelectorAll('.sample-video').forEach(v => v.classList.remove('selected'));
    window.selectedSampleVideo = null;
}

function loadSampleVideos() {
    const container = document.getElementById('sample-videos');
    
    container.innerHTML = SampleData.sampleVideos.map(video => `
        <div class="sample-video" onclick="selectSampleVideo('${video.url}', '${video.title}')">
            <img class="sample-thumbnail" src="${video.thumbnail}" alt="${video.title}" onerror="this.style.display='none'">
            <div class="sample-info">
                <h4>${video.title}</h4>
                <p>Duration: ${video.duration}</p>
            </div>
        </div>
    `).join('');
}

function selectSampleVideo(url, title) {
    document.querySelectorAll('.sample-video').forEach(v => v.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    window.selectedSampleVideo = { url, title };
}

function addVideo() {
    let videoUrl = '';
    let videoTitle = '';
    let videoType = 'direct';

    const activeTab = document.querySelector('.video-tab.active').dataset.source;

    switch (activeTab) {
        case 'youtube':
            videoUrl = document.getElementById('youtube-url').value.trim();
            videoTitle = 'YouTube Video';
            videoType = 'youtube';
            break;
        case 'direct':
            videoUrl = document.getElementById('direct-url').value.trim();
            videoTitle = 'Direct Video';
            videoType = 'direct';
            break;
        case 'samples':
            if (window.selectedSampleVideo) {
                videoUrl = window.selectedSampleVideo.url;
                videoTitle = window.selectedSampleVideo.title;
                videoType = 'direct';
            }
            break;
    }

    if (!videoUrl) {
        showToast('Error', 'Please provide a video URL', 'error');
        return;
    }

    // Update room video
    AppState.currentRoom.videoUrl = videoUrl;
    AppState.currentRoom.videoTitle = videoTitle;
    AppState.currentRoom.videoType = videoType;
    AppState.currentRoom.isPlaying = false;
    AppState.currentRoom.currentTime = 0;

    // Update video player
    const video = document.getElementById('main-video');
    video.src = videoUrl;
    video.currentTime = 0;
    document.getElementById('video-title').textContent = videoTitle;

    hideVideoModal();
    showToast('Success', `Video "${videoTitle}" loaded successfully!`, 'success');
    
    // Broadcast video change
    broadcastVideoState();
}

// Settings
function initializeSettingsModal() {
    document.getElementById('close-settings-modal').addEventListener('click', hideSettingsModal);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);

    // Theme selection
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            themeOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            AppState.settings.theme = option.dataset.theme;
        });
    });

    loadSettings();
}

function showSettingsModal() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function hideSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function loadSettings() {
    // Load theme setting
    const themeOption = document.querySelector(`[data-theme="${AppState.settings.theme}"]`);
    if (themeOption) {
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        themeOption.classList.add('active');
    }

    // Load notification settings
    const soundCheckbox = document.getElementById('sound-notifications');
    const chatCheckbox = document.getElementById('chat-notifications');
    
    if (soundCheckbox) soundCheckbox.checked = AppState.settings.soundNotifications;
    if (chatCheckbox) chatCheckbox.checked = AppState.settings.chatNotifications;
}

function saveSettings() {
    const soundCheckbox = document.getElementById('sound-notifications');
    const chatCheckbox = document.getElementById('chat-notifications');
    
    if (soundCheckbox) AppState.settings.soundNotifications = soundCheckbox.checked;
    if (chatCheckbox) AppState.settings.chatNotifications = chatCheckbox.checked;
    
    hideSettingsModal();
    showToast('Success', 'Settings saved successfully!', 'success');
    applyTheme(AppState.settings.theme);
}

function applyTheme(theme) {
    document.body.setAttribute('data-color-scheme', theme);
}

// Utility Functions
function clearIntervals() {
    if (AppState.syncInterval) {
        clearInterval(AppState.syncInterval);
        AppState.syncInterval = null;
    }
    
    if (AppState.chatInterval) {
        clearInterval(AppState.chatInterval);
        AppState.chatInterval = null;
    }
}

// Modal Management
function initializeModals() {
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}

// Application Initialization
function initializeApp() {
    console.log('🎬 Initializing WatchTogether...');
    
    initializeAuth();
    initializeRoomModals();
    initializeVideoModal();
    initializeSettingsModal();
    initializeModals();
    
    // Apply default theme
    applyTheme(AppState.settings.theme);
    
    // Show initial screen
    showScreen('auth');
    
    console.log('✅ WatchTogether initialized successfully!');
    
    // Show welcome message
    setTimeout(() => {
        showToast('Welcome', 'Welcome to WatchTogether! Create an account or join as a guest to get started.', 'info');
    }, 1000);
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes for better UX
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, reduce polling frequency
        console.log('Page hidden, reducing activity');
    } else {
        // Page is visible, resume normal activity
        console.log('Page visible, resuming normal activity');
    }
});

// Handle beforeunload for cleanup
window.addEventListener('beforeunload', () => {
    clearIntervals();
});

// Assistant: modal wiring and API call
document.addEventListener('DOMContentLoaded', () => {
    const assistantBtn = document.getElementById('assistant-btn');
    const assistantModal = document.getElementById('assistant-modal');
    const assistantClose = document.getElementById('assistant-close');
    const assistantCancel = document.getElementById('assistant-cancel');
    const assistantSend = document.getElementById('assistant-send');
    const assistantPrompt = document.getElementById('assistant-prompt');
    const assistantResponse = document.getElementById('assistant-response');

    if (!assistantBtn) return;

    function openAssistant() {
        assistantModal.classList.remove('hidden');
        assistantPrompt.value = '';
        assistantResponse.textContent = '';
    }

    function closeAssistant() {
        assistantModal.classList.add('hidden');
    }

    assistantBtn.addEventListener('click', openAssistant);
    assistantClose.addEventListener('click', closeAssistant);
    assistantCancel.addEventListener('click', closeAssistant);

    assistantSend.addEventListener('click', async () => {
        const prompt = assistantPrompt.value.trim();
        if (!prompt) return;
        assistantResponse.textContent = '';

        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (window.AppConfig && window.AppConfig.clientKey) headers['x-client-key'] = window.AppConfig.clientKey;
            if (window.AppConfig && window.AppConfig.serverJwt) headers['Authorization'] = `Bearer ${window.AppConfig.serverJwt}`;

            const apiBase = (window.AppConfig && window.AppConfig.apiBase) ? window.AppConfig.apiBase.replace(/\/$/, '') : '';
            const endpoint = apiBase ? `${apiBase}/api/ai` : '/api/ai';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ model: getDefaultModel(), input: prompt, stream: true })
            });

            if (!res.ok) {
                const err = await res.json();
                assistantResponse.textContent = 'Error: ' + (err.error || res.statusText);
                return;
            }

            // Stream the response progressively
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let full = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                full += chunk;
                assistantResponse.textContent = full;
            }

        } catch (err) {
            assistantResponse.textContent = 'Error: ' + err.message;
        }
    });
})();

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);