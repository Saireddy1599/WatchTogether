// Quick Actions - Service room creation
export function initializeQuickActions() {
    const serviceButtons = document.querySelectorAll('.service-btn');
    if (serviceButtons) {
        serviceButtons.forEach(button => {
            button.addEventListener('click', () => {
                const service = button.dataset.service;
                if (service) {
                    createRoomForService(service);
                }
            });
        });
    }
}
    });

    async function createRoomForService(service) {
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

        try {
            // Show loading overlay
            const overlay = document.getElementById('loading-overlay');
            const loadingText = overlay.querySelector('.loading-text');
            loadingText.textContent = `Creating ${serviceNames[service]} room...`;
            overlay.classList.remove('hidden');

            // Generate room ID
            const roomId = generateRandomRoomId();
            
            // Get current user
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                throw new Error('Please login first');
            }

            // Create room data
            const roomData = {
                id: roomId,
                name: `${serviceNames[service]} Watch Party`,
                description: `Watch ${serviceNames[service]} together with friends`,
                hostId: currentUser.uid,
                isPublic: false,
                maxParticipants: 10,
                currentParticipants: 1,
                service: service,
                serviceUrl: serviceUrls[service],
                participants: [currentUser.uid],
                createdAt: new Date().toISOString(),
                isActive: true
            };

            // Save to Firebase Firestore
            await firebase.firestore().collection('rooms').doc(roomId).set(roomData);
            // Show success message
            showToast('Success', `${serviceNames[service]} room created!`, 'success');

            // Join the room
            joinRoom(roomId);

        } catch (error) {
            console.error('Error creating room:', error);
            showToast('Error', error.message || 'Failed to create room', 'error');
        } finally {
            // Hide loading overlay
            document.getElementById('loading-overlay').classList.add('hidden');
        }
    }

    function generateRandomRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function joinRoom(roomId) {
        const hash = `#/room/${roomId}`;
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        }
        showScreen('watch');
        initializeWatchRoom(roomId);
    }

    function showToast(title, message, type) {
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
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);

        // Add click handler for close button
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(`${screenId}-screen`).classList.remove('hidden');
    }

    async function initializeWatchRoom(roomId) {
        try {
            const roomDoc = await firebase.firestore().collection('rooms').doc(roomId).get();
            const roomData = roomDoc.data();
            
            if (!roomData) {
                throw new Error('Room not found');
            }

            // Set up room UI
            document.getElementById('room-title').textContent = roomData.name;
            document.getElementById('participant-count').textContent = roomData.currentParticipants;
            
            // Load video if URL is available
            const video = document.getElementById('main-video');
            if (roomData.videoUrl) {
                video.src = roomData.videoUrl;
            }

            // Update room info
            const updatedData = {
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                currentParticipants: firebase.firestore.FieldValue.increment(1)
            };
            await firebase.firestore().collection('rooms').doc(roomId).update(updatedData);
            
        } catch (error) {
            console.error('Error initializing watch room:', error);
            showToast('Error', error.message, 'error');
        } finally {
            hideLoading();
        }
    }
})();
