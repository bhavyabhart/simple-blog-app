// Client-side version for GitHub Pages - uses localStorage
const STORAGE_KEY = 'blog_posts';
let currentPage = 1;
let totalPages = 1;
let contentEditor = null;
let editContentEditor = null;
let allPosts = []; // Store all posts for searching
let isSearching = false;
let searchQuery = '';

// Initialize Quill editors
function initializeEditors() {
    const quillOptions = {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                ],
                handlers: {
                    'image': imageHandler
                }
            }
        },
        placeholder: 'Start writing your blog post...'
    };

    contentEditor = new Quill('#contentEditor', quillOptions);
    editContentEditor = new Quill('#editContentEditor', quillOptions);
}

// Image handler - converts to base64
function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('Image size must be less than 5MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        const activeEditor = document.getElementById('createForm').style.display !== 'none' 
            ? contentEditor 
            : editContentEditor;

        const range = activeEditor.getSelection(true);
        activeEditor.insertText(range.index, 'Uploading image...', 'user');
        const loadingIndex = range.index;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            activeEditor.deleteText(loadingIndex, 19);
            activeEditor.insertEmbed(range.index, 'image', base64Image, 'user');
            activeEditor.setSelection(range.index + 1);
        };
        reader.onerror = () => {
            activeEditor.deleteText(loadingIndex, 19);
            showError('Failed to load image');
        };
        reader.readAsDataURL(file);
    };
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeEditors();
    loadAllPosts();
    loadPosts();
    setupEventListeners();
});

// Setup form event listeners
function setupEventListeners() {
    document.getElementById('createPostForm').addEventListener('submit', handleCreatePost);
    document.getElementById('editPostForm').addEventListener('submit', handleUpdatePost);
}

// Load all posts from localStorage
function loadAllPosts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        allPosts = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading posts:', error);
        allPosts = [];
    }
}

// Save posts to localStorage
function savePosts(posts) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        allPosts = posts;
    } catch (error) {
        console.error('Error saving posts:', error);
        showError('Failed to save posts. Storage may be full.');
    }
}

// Load posts with pagination
function loadPosts(page = 1) {
    loadAllPosts();
    currentPage = page;
    const limit = 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedPosts = allPosts.slice(startIndex, endIndex);
    totalPages = Math.ceil(allPosts.length / limit);
    
    displayPosts(paginatedPosts);
    updatePagination({
        currentPage: page,
        totalPages: totalPages,
        totalPosts: allPosts.length,
        limit: limit,
        hasNext: endIndex < allPosts.length,
        hasPrev: page > 1
    });
}

// Display posts
function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    
    if (posts.length === 0 && !isSearching) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No posts yet</h3>
                <p>Create your first blog post to get started!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card">
            <h3>${escapeHtml(post.title)}</h3>
            <div class="post-meta">
                👤 ${escapeHtml(post.author || 'Anonymous')} | 
                📅 ${formatDate(post.date)} | 
                ${post.updatedAt !== post.createdAt ? '✏️ Updated: ' + formatDate(post.updatedAt) : ''}
            </div>
            <div class="post-content">${stripHtmlTags(post.content)}</div>
            <div class="post-actions">
                <button class="btn btn-success" onclick="viewPost(${post.id})">View</button>
                <button class="btn btn-primary" onclick="editPost(${post.id})">Edit</button>
                <button class="btn btn-danger" onclick="deletePost(${post.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update pagination controls
function updatePagination(pagination) {
    document.getElementById('pageInfo').textContent = 
        `Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalPosts} total posts)`;
    
    document.getElementById('prevBtn').disabled = !pagination.hasPrev;
    document.getElementById('nextBtn').disabled = !pagination.hasNext;
}

// Change page
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        loadPosts(newPage);
    }
}

// Show create form
function showCreateForm() {
    document.getElementById('createForm').style.display = 'block';
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('postDetails').style.display = 'none';
    document.getElementById('postsList').style.display = 'block';
    document.getElementById('createPostForm').reset();
    if (contentEditor) {
        contentEditor.setContents([]);
    }
    document.getElementById('author').value = '';
}

// Hide create form
function hideCreateForm() {
    document.getElementById('createForm').style.display = 'none';
}

// Show edit form
function showEditForm() {
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('createForm').style.display = 'none';
    document.getElementById('postDetails').style.display = 'none';
    document.getElementById('postsList').style.display = 'block';
}

// Hide edit form
function hideEditForm() {
    document.getElementById('editForm').style.display = 'none';
}

// Handle create post
function handleCreatePost(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const content = contentEditor ? contentEditor.root.innerHTML : '';
    
    if (!title || !content || content === '<p><br></p>') {
        showError('Title and content are required');
        return;
    }
    
    loadAllPosts();
    const newPost = {
        id: allPosts.length > 0 ? Math.max(...allPosts.map(p => p.id)) + 1 : 1,
        title: title,
        author: author || 'Anonymous',
        content: content,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    allPosts.unshift(newPost); // Add to beginning
    savePosts(allPosts);
    hideCreateForm();
    loadPosts(1);
    showSuccess('Post created successfully!');
}

// View post details
function viewPost(id) {
    loadAllPosts();
    const post = allPosts.find(p => p.id === id);
    
    if (!post) {
        showError('Post not found');
        return;
    }
    
    document.getElementById('postContent').innerHTML = `
        <h2>${escapeHtml(post.title)}</h2>
        <div class="post-meta">
            👤 ${escapeHtml(post.author || 'Anonymous')} | 
            📅 Created: ${formatDate(post.date)} | 
            ${post.updatedAt !== post.createdAt ? '✏️ Updated: ' + formatDate(post.updatedAt) : ''}
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions" style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="editPost(${post.id})">Edit</button>
            <button class="btn btn-danger" onclick="deletePost(${post.id})">Delete</button>
        </div>
    `;
    
    document.getElementById('postDetails').style.display = 'block';
    document.getElementById('postsList').style.display = 'none';
    document.getElementById('createForm').style.display = 'none';
    document.getElementById('editForm').style.display = 'none';
}

// Hide post details
function hidePostDetails() {
    document.getElementById('postDetails').style.display = 'none';
    document.getElementById('postsList').style.display = 'block';
}

// Edit post
function editPost(id) {
    loadAllPosts();
    const post = allPosts.find(p => p.id === id);
    
    if (!post) {
        showError('Post not found');
        return;
    }
    
    document.getElementById('editId').value = post.id;
    document.getElementById('editTitle').value = post.title;
    document.getElementById('editAuthor').value = post.author || '';
    
    if (editContentEditor) {
        editContentEditor.root.innerHTML = post.content || '';
    }
    
    showEditForm();
}

// Handle update post
function handleUpdatePost(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();
    const content = editContentEditor ? editContentEditor.root.innerHTML : '';
    
    if (!title || !content || content === '<p><br></p>') {
        showError('Title and content are required');
        return;
    }
    
    loadAllPosts();
    const postIndex = allPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
        showError('Post not found');
        return;
    }
    
    allPosts[postIndex] = {
        ...allPosts[postIndex],
        title: title,
        author: author || 'Anonymous',
        content: content,
        updatedAt: new Date().toISOString()
    };
    
    savePosts(allPosts);
    hideEditForm();
    loadPosts(currentPage);
    showSuccess('Post updated successfully!');
}

// Delete post
function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    loadAllPosts();
    const postIndex = allPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
        showError('Post not found');
        return;
    }
    
    allPosts.splice(postIndex, 1);
    savePosts(allPosts);
    loadPosts(currentPage);
    hidePostDetails();
    showSuccess('Post deleted successfully!');
}

// Search functionality
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    searchQuery = query;
    
    if (query === '') {
        clearSearch();
        return;
    }
    
    isSearching = true;
    loadAllPosts();
    const clearBtn = document.getElementById('clearSearchBtn');
    const resultsInfo = document.getElementById('searchResultsInfo');
    
    const filteredPosts = allPosts.filter(post => {
        const title = (post.title || '').toLowerCase();
        const content = stripHtmlTags(post.content || '').toLowerCase();
        const author = (post.author || 'Anonymous').toLowerCase();
        
        return title.includes(query) || content.includes(query) || author.includes(query);
    });
    
    if (filteredPosts.length > 0) {
        displayPosts(filteredPosts);
        resultsInfo.innerHTML = `<p class="search-results-text">Found ${filteredPosts.length} post(s) matching "${escapeHtml(query)}"</p>`;
        resultsInfo.style.display = 'block';
        clearBtn.style.display = 'inline-block';
        document.querySelector('.pagination-controls').style.display = 'none';
    } else {
        document.getElementById('postsContainer').innerHTML = `
            <div class="empty-state">
                <h3>No results found</h3>
                <p>No posts match your search for "${escapeHtml(query)}"</p>
            </div>
        `;
        resultsInfo.innerHTML = `<p class="search-results-text">No posts found matching "${escapeHtml(query)}"</p>`;
        resultsInfo.style.display = 'block';
        clearBtn.style.display = 'inline-block';
        document.querySelector('.pagination-controls').style.display = 'none';
    }
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    isSearching = false;
    document.getElementById('clearSearchBtn').style.display = 'none';
    document.getElementById('searchResultsInfo').style.display = 'none';
    document.querySelector('.pagination-controls').style.display = 'flex';
    loadPosts(1);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function stripHtmlTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function showError(message) {
    showNotification('Error: ' + message, 'error');
}

function showSuccess(message) {
    showNotification('Success: ' + message, 'success');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    messageEl.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.style.display = 'flex';
    
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
}

