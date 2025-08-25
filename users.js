const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Simple file-backed user store for demo purposes
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const raw = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Failed to load users.json', e);
    }

    // Create a default user if file missing
    const defaultUsers = [
        // password: 'password'
        { username: 'alice', passwordHash: bcrypt.hashSync('password', 10) }
    ];

    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    } catch (e) {
        console.error('Failed to write default users.json', e);
    }

    return defaultUsers;
}

const users = loadUsers();

function findUser(username) {
    return users.find(u => u.username === username);
}

function verifyPassword(username, plain) {
    const user = findUser(username);
    if (!user) return false;
    try {
        return bcrypt.compareSync(plain, user.passwordHash);
    } catch (e) {
        return false;
    }
}

module.exports = { findUser, verifyPassword };
