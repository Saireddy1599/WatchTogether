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

    showLoading(`Creating ${serviceNames[service]} room...`);
    
    const roomId = generateRoomId();
    const currentUser = auth.currentUser;
    
    createRoom(roomId, currentUser, null, service)
        .then(() => {
            showToast('Success', `${serviceNames[service]} room created!`, 'success');
            window.location.href = `/room/${roomId}?service=${service}`;
        })
        .catch(error => {
            console.error('Error creating room:', error);
            showToast('Error', 'Failed to create room', 'error');
        })
        .finally(() => {
            hideLoading();
        });
}
