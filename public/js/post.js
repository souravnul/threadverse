document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        document.getElementById('post-container').innerHTML = `<div class="alert alert-error">Post not found.</div>`;
        document.getElementById('comments-container').innerHTML = '';
        return;
    }

    await loadPost(postId);
    await loadComments(postId);
    setupCommentArea(postId);
});

async function loadPost(postId) {
    const container = document.getElementById('post-container');
    try {
        const post = await apiFetch(`/api/posts/${postId}`);
        container.innerHTML = `
            <article class="post-detail">
                <div class="post-meta" style="margin-bottom: 1rem; font-size: 0.95rem;">
                    <a href="/community.html?slug=${post.community_slug}">t/${post.community_slug}</a> • 
                    Posted by <a href="/profile.html?u=${post.author}">${post.author}</a> on ${new Date(post.created_at).toLocaleDateString()}
                </div>
                <h1>${post.title}</h1>
                <div style="margin-bottom: 2rem;">${post.body}</div>
                
                <div class="post-actions" style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    <button class="vote-btn upvote" onclick="voteOnPost(${post.id}, 1)">▲</button>
                    <span style="font-weight: bold; color: var(--text-primary); font-size: 1.1rem;">${post.upvotes - post.downvotes}</span>
                    <button class="vote-btn downvote" onclick="voteOnPost(${post.id}, -1)">▼</button>
                </div>
            </article>
        `;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">Failed to load post: ${err.message}</div>`;
    }
}

async function voteOnPost(postId, voteType) {
    if (!getToken()) return window.location.href = '/login.html';
    try {
        await apiFetch('/api/posts/vote', {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, vote: voteType })
        });
        loadPost(postId);
    } catch (err) { alert(err.message); }
}

async function voteOnComment(commentId, voteType) {
    if (!getToken()) return window.location.href = '/login.html';
    try {
        await apiFetch('/api/comments/vote', {
            method: 'POST',
            body: JSON.stringify({ comment_id: commentId, vote: voteType })
        });
        const params = new URLSearchParams(window.location.search);
        loadComments(params.get('id'));
    } catch (err) { alert(err.message); }
}

function renderCommentTree(comments, parentId = null, depth = 0) {
    const children = comments.filter(c => c.parent_id == parentId);
    if (children.length === 0) return '';
    
    // limit indent depth visually so it doesn't break mobile
    const visualDepth = depth > 5 ? 5 : depth;

    return children.map(c => `
        <div class="comment-card comment-level-${visualDepth}" id="comment-${c.id}">
            <div class="comment-meta">
                <a href="/profile.html?u=${c.author}">${c.author}</a> 
                • ${new Date(c.created_at).toLocaleDateString()}
                • <span style="color: ${c.upvotes - c.downvotes > 0 ? 'var(--success-color)' : (c.upvotes - c.downvotes < 0 ? 'var(--danger-color)' : 'inherit')}">Votes: ${c.upvotes - c.downvotes}</span>
            </div>
            <div style="margin-bottom: 0.5rem; white-space: pre-wrap;">${c.body}</div>
            
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button class="vote-btn upvote" onclick="voteOnComment(${c.id}, 1)" style="font-size: 0.8rem;">▲</button>
                <button class="vote-btn downvote" onclick="voteOnComment(${c.id}, -1)" style="font-size: 0.8rem;">▼</button>
                <button class="reply-btn" onclick="toggleReplyBox(${c.id})">Reply</button>
            </div>

            <div class="reply-box" id="reply-box-${c.id}">
                <textarea id="reply-body-${c.id}" placeholder="What are your thoughts?" style="min-height: 80px; margin-bottom: 0.5rem;"></textarea>
                <button class="btn" onclick="submitReply(${c.id})" style="padding: 0.4rem 1rem; width: auto;">Post Reply</button>
            </div>

            ${renderCommentTree(comments, c.id, depth + 1)}
        </div>
    `).join('');
}

async function loadComments(postId) {
    const container = document.getElementById('comments-container');
    try {
        const comments = await apiFetch(`/api/comments/${postId}`);
        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="loading" style="text-align: left;">No comments yet. Be the first to start the discussion!</p>';
            return;
        }
        container.innerHTML = renderCommentTree(comments, null, 0);
    } catch(err) {
        container.innerHTML = `<div class="alert alert-error">Failed to load comments: ${err.message}</div>`;
    }
}

function setupCommentArea(postId) {
    const area = document.getElementById('auth-comment-area');
    if (!getToken()) {
        area.innerHTML = `
            <div class="comment-input-area" style="text-align: center;">
                <p>Log in or sign up to leave a comment.</p>
                <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                    <a href="/login.html" class="btn" style="width: auto;">Log In</a>
                    <a href="/register.html" class="btn" style="width: auto; background-color: var(--surface-hover);">Sign Up</a>
                </div>
            </div>
        `;
        return;
    }

    area.innerHTML = `
        <div class="comment-input-area" style="margin-bottom: 1.5rem;">
            <p style="margin-bottom: 0.5rem; font-weight: 500;">Add a comment as ${getUsername()}</p>
            <textarea id="main-comment-body" placeholder="What are your thoughts?" style="min-height: 120px; margin-bottom: 1rem;"></textarea>
            <button class="btn" id="submit-main-comment" style="width: auto;">Comment</button>
        </div>
    `;

    document.getElementById('submit-main-comment').addEventListener('click', async () => {
        const body = document.getElementById('main-comment-body').value.trim();
        if(!body) return alert("Comment cannot be empty.");
        
        try {
            await apiFetch('/api/comments/create', {
                method: 'POST',
                body: JSON.stringify({ post_id: postId, body, parent_id: null })
            });
            document.getElementById('main-comment-body').value = '';
            loadComments(postId);
        } catch(err) { alert(err.message); }
    });
}

function toggleReplyBox(commentId) {
    const box = document.getElementById(`reply-box-${commentId}`);
    if (box) box.classList.toggle('active');
}

async function submitReply(parentId) {
    if (!getToken()) return window.location.href = '/login.html';
    
    const bodyInput = document.getElementById(`reply-body-${parentId}`);
    const body = bodyInput.value.trim();
    if(!body) return alert("Reply cannot be empty.");

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    try {
        await apiFetch('/api/comments/create', {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, body, parent_id: parentId })
        });
        bodyInput.value = '';
        loadComments(postId);
    } catch(err) { alert(err.message); }
}
