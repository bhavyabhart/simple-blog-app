const API_BASE_URL = '/api/posts';
let currentPage = 1;
let totalPages = 1;
let contentEditor = null;
let editContentEditor = null;
let allPosts = []; // Store all posts for searching
let isSearching = false;
let searchQuery = '';

// Initialize Quill editors
function initializeEditors() {
    // Quill editor configuration
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

    // Initialize create form editor
    contentEditor = new Quill('#contentEditor', quillOptions);

    // Initialize edit form editor
    editContentEditor = new Quill('#editContentEditor', quillOptions);
}

// Image upload handler for Quill editor
function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
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

        const formData = new FormData();
        formData.append('image', file);

        // Get the active editor (create or edit)
        const activeEditor = document.getElementById('createForm').style.display !== 'none' 
            ? contentEditor 
            : editContentEditor;

        // Show loading indicator
        const range = activeEditor.getSelection(true);
        activeEditor.insertText(range.index, 'Uploading image...', 'user');
        const loadingIndex = range.index;

        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload image');
            }

            const data = await response.json();
            
            // Remove loading text and insert image
            activeEditor.deleteText(loadingIndex, 19);
            activeEditor.insertEmbed(range.index, 'image', data.url, 'user');
            
            // Move cursor after image
            activeEditor.setSelection(range.index + 1);
        } catch (error) {
            console.error('Error uploading image:', error);
            activeEditor.deleteText(loadingIndex, 19);
            showError(error.message || 'Failed to upload image');
        }
    };
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeEditors();
    loadAllPosts(); // Load all posts for searching
    loadPosts();
    setupEventListeners();
});

// Setup form event listeners
function setupEventListeners() {
    document.getElementById('createPostForm').addEventListener('submit', handleCreatePost);
    document.getElementById('editPostForm').addEventListener('submit', handleUpdatePost);
}

// Load all posts for searching
async function loadAllPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}?page=1&limit=10000`);
        const data = await response.json();
        allPosts = data.posts;
    } catch (error) {
        console.error('Error loading all posts:', error);
    }
}

// Load posts with pagination
async function loadPosts(page = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}?page=${page}&limit=10`);
        const data = await response.json();
        
        currentPage = data.pagination.currentPage;
        totalPages = data.pagination.totalPages;
        
        // Update allPosts if not searching
        if (!isSearching) {
            allPosts = data.posts;
        }
        
        displayPosts(data.posts);
        updatePagination(data.pagination);
    } catch (error) {
        console.error('Error loading posts:', error);
        showError('Failed to load posts');
    }
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
    const clearBtn = document.getElementById('clearSearchBtn');
    const resultsInfo = document.getElementById('searchResultsInfo');
    
    // Filter posts
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
        
        // Hide pagination when searching
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
    loadPosts(1); // Reload first page
    loadAllPosts(); // Reload all posts
}

// Display posts
function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    
    if (posts.length === 0) {
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
    // Clear editor content
    if (contentEditor) {
        contentEditor.setContents([]);
    }
    // Clear author field
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
async function handleCreatePost(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const content = contentEditor ? contentEditor.root.innerHTML : '';
    
    if (!title || !content || content === '<p><br></p>') {
        showError('Title and content are required');
        return;
    }
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, content })
        });
        
        if (response.ok) {
            const post = await response.json();
            hideCreateForm();
            loadAllPosts(); // Reload all posts for search
            loadPosts(1); // Reload first page
            showSuccess('Post created successfully!');
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showError('Failed to create post');
    }
}

// View post details
async function viewPost(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Post not found');
        }
        
        const post = await response.json();
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
    } catch (error) {
        console.error('Error viewing post:', error);
        showError('Failed to load post');
    }
}

// Hide post details
function hidePostDetails() {
    document.getElementById('postDetails').style.display = 'none';
    document.getElementById('postsList').style.display = 'block';
}

// Edit post
async function editPost(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Post not found');
        }
        
        const post = await response.json();
        document.getElementById('editId').value = post.id;
        document.getElementById('editTitle').value = post.title;
        document.getElementById('editAuthor').value = post.author || '';
        
        // Set editor content (handle both HTML and plain text)
        if (editContentEditor) {
            editContentEditor.root.innerHTML = post.content || '';
        }
        
        showEditForm();
    } catch (error) {
        console.error('Error loading post for edit:', error);
        showError('Failed to load post');
    }
}

// Handle update post
async function handleUpdatePost(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();
    const content = editContentEditor ? editContentEditor.root.innerHTML : '';
    
    if (!title || !content || content === '<p><br></p>') {
        showError('Title and content are required');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, content })
        });
        
        if (response.ok) {
            hideEditForm();
            loadAllPosts(); // Reload all posts for search
            loadPosts(currentPage);
            showSuccess('Post updated successfully!');
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to update post');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showError('Failed to update post');
    }
}

// Delete post
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadAllPosts(); // Reload all posts for search
            loadPosts(currentPage);
            hidePostDetails();
            showSuccess('Post deleted successfully!');
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to delete post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showError('Failed to delete post');
    }
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

// Strip HTML tags for preview (used in post list)
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

// Show custom notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    messageEl.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.style.display = 'flex';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

// Hide notification
function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
}

