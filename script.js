// Roblox API endpoints (all public, no authentication needed)
const ROBLOX_API = {
    getUserByUsername: 'https://users.roblox.com/v1/usernames/users',
    getUserInfo: 'https://users.roblox.com/v1/users/',
    getUserAvatar: 'https://thumbnails.roblox.com/v1/users/avatar-headshot',
    getUserBadges: 'https://badges.roblox.com/v1/users/',
    getUserGroups: 'https://groups.roblox.com/v2/users/',
    getUserFriends: 'https://friends.roblox.com/v1/users/',
    getUserFollowers: 'https://friends.roblox.com/v1/users/'
};

// Search for user by username
async function searchUser() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        showError('Please enter a username');
        return;
    }
    
    // Show loading, hide previous results
    document.getElementById('loading').style.display = 'block';
    document.getElementById('profile').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    try {
        // Step 1: Get user ID from username
        const userResponse = await fetch(ROBLOX_API.getUserByUsername, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: false
            })
        });
        
        const userData = await userResponse.json();
        
        if (!userData.data || userData.data.length === 0) {
            throw new Error('User not found');
        }
        
        const userId = userData.data[0].id;
        const userInfo = userData.data[0];
        
        // Step 2: Get detailed user info
        const detailResponse = await fetch(ROBLOX_API.getUserInfo + userId);
        const userDetails = await detailResponse.json();
        
        // Step 3: Get avatar image
        const avatarResponse = await fetch(`${ROBLOX_API.getUserAvatar}?userIds=${userId}&size=420x420&format=Png`);
        const avatarData = await avatarResponse.json();
        const avatarUrl = avatarData.data?.[0]?.imageUrl || 'https://www.roblox.com/avatar-thumbnail/image?userId=' + userId;
        
        // Step 4: Get badges (limited to first 6)
        const badgesResponse = await fetch(`${ROBLOX_API.getUserBadges}${userId}/badges?limit=10`);
        const badgesData = await badgesResponse.json();
        
        // Step 5: Get groups (limited to first 6)
        const groupsResponse = await fetch(`${ROBLOX_API.getUserGroups}${userId}/groups/roles`);
        const groupsData = await groupsResponse.json();
        
        // Step 6: Get friend count
        const friendsResponse = await fetch(`${ROBLOX_API.getUserFriends}${userId}/friends/count`);
        const friendsCount = await friendsResponse.json();
        
        // Step 7: Get followers count
        const followersResponse = await fetch(`${ROBLOX_API.getUserFollowers}${userId}/followers/count`);
        const followersCount = await followersResponse.json();
        
        // Display all the information
        displayUserProfile(userInfo, userDetails, avatarUrl, badgesData, groupsData, friendsCount, followersCount);
        
    } catch (error) {
        showError(error.message);
        console.error('Error:', error);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Display user profile
function displayUserProfile(userInfo, userDetails, avatarUrl, badgesData, groupsData, friendsCount, followersCount) {
    // Basic info
    document.getElementById('avatar-img').src = avatarUrl;
    document.getElementById('display-name').textContent = userDetails.displayName || userInfo.name;
    document.getElementById('username-display').innerHTML = `<strong>Username:</strong> @${userInfo.name}`;
    document.getElementById('user-id').innerHTML = `<strong>User ID:</strong> ${userInfo.id}`;
    
    // Format creation date
    const createdDate = new Date(userDetails.created);
    const formattedDate = createdDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('created-date').innerHTML = `<strong>Member since:</strong> ${formattedDate}`;
    document.getElementById('friends-count').innerHTML = `<strong>Friends:</strong> ${friendsCount.count || 0}`;
    document.getElementById('followers-count').innerHTML = `<strong>Followers:</strong> ${followersCount.count || 0}`;
    
    // Store user ID for buttons
    window.currentUserId = userInfo.id;
    window.currentUsername = userInfo.name;
    
    // Display badges
    const badgesContainer = document.getElementById('badges');
    if (badgesData.data && badgesData.data.length > 0) {
        badgesContainer.innerHTML = badgesData.data.slice(0, 12).map(badge => `
            <div class="badge-item">
                <img src="${badge.imageUrl}" alt="${badge.name}" loading="lazy">
                <p>${badge.name}</p>
            </div>
        `).join('');
    } else {
        badgesContainer.innerHTML = '<p>No badges found</p>';
    }
    
    // Display groups
    const groupsContainer = document.getElementById('groups');
    if (groupsData.data && groupsData.data.length > 0) {
        groupsContainer.innerHTML = groupsData.data.slice(0, 6).map(group => `
            <div class="group-item">
                <img src="https://www.roblox.com/group-thumbnail/image?groupId=${group.group.id}&size=50x50" alt="${group.group.name}" loading="lazy">
                <div>
                    <h4>${group.group.name}</h4>
                    <p>${group.role.name}</p>
                </div>
            </div>
        `).join('');
    } else {
        groupsContainer.innerHTML = '<p>No groups found</p>';
    }
    
    // Show profile
    document.getElementById('profile').style.display = 'block';
    
    // Save to local storage for recent searches
    saveRecentSearch(userInfo.name);
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('profile').style.display = 'none';
}

// Open Roblox profile in new tab
function openRobloxProfile() {
    if (window.currentUserId) {
        window.open(`https://www.roblox.com/users/${window.currentUserId}/profile`, '_blank');
    }
}

// Copy user ID to clipboard
async function copyUserId() {
    if (window.currentUserId) {
        try {
            await navigator.clipboard.writeText(window.currentUserId.toString());
            alert('User ID copied to clipboard!');
        } catch (err) {
            alert('Failed to copy');
        }
    }
}

// Save recent searches
function saveRecentSearch(username) {
    let searches = JSON.parse(localStorage.getItem('recentRobloxSearches') || '[]');
    searches = searches.filter(s => s !== username);
    searches.unshift(username);
    searches = searches.slice(0, 5);
    localStorage.setItem('recentRobloxSearches', JSON.stringify(searches));
}

// Load recent searches (optional)
function loadRecentSearches() {
    const searches = JSON.parse(localStorage.getItem('recentRobloxSearches') || '[]');
    if (searches.length > 0) {
        const input = document.getElementById('username');
        input.setAttribute('placeholder', `Recent: ${searches.join(', ')}`);
    }
}

// Allow Enter key to search
document.getElementById('username').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchUser();
    }
});

// Load recent searches on page load
loadRecentSearches();