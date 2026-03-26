document.addEventListener('DOMContentLoaded', async () => {
    loadPosts();
    loadCommunities();
});

async function loadPosts() {
    const container = document.getElementById('posts-container');
    try {
        const posts = await apiFetch('/api/posts'); // We will create this API route soon
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p class="loading">No posts found. Create the first one!</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <article class="post-card">
                <div class="post-meta">
                    <a href="/community.html?slug=${post.community_slug}" class="community-link">t/${post.community_slug}</a>
                    <span class="dot"></span>
                    <span>Posted by <a href="/profile.html?u=${post.author}">${post.author}</a> on ${new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <h3 class="post-title"><a href="/post.html?id=${post.id}">${post.title}</a></h3>
                <p class="post-excerpt">${post.body || ''}</p>
                <div class="post-actions">
                    <div class="vote-group">
                        <button class="vote-btn" onclick="votePost(${post.id}, 1)">▲</button>
                        <span style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">${Number(post.upvotes || 0) - Number(post.downvotes || 0)}</span>
                        <button class="vote-btn" onclick="votePost(${post.id}, -1)">▼</button>
                    </div>
                    <a href="/post.html?id=${post.id}" style="color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L22 4l-1.5 6.5z"/></svg>
                        ${post.comment_count || 0} Comments
                    </a>
                </div>
            </article>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">Failed to load posts: ${err.message}</div>`;
    }
}

async function loadCommunities() {
    const list = document.getElementById('communities-list');
    try {
        const communities = await apiFetch('/api/communities'); // API route to build
        if (!communities || communities.length === 0) {
            list.innerHTML = '<li style="color: var(--text-secondary);">No communities yet.</li>';
            return;
        }

        list.innerHTML = communities.slice(0, 5).map(c => `
            <li><a href="/community.html?slug=${c.slug}">t/${c.slug}</a></li>
        `).join('');
    } catch (err) {
        list.innerHTML = `<li style="color: var(--danger-color);">Failed to load</li>`;
    }
}

async function votePost(postId, voteValue) {
    if (!getToken()) {
        window.location.href = '/login.html';
        return;
    }
    try {
        await apiFetch('/api/posts/vote', {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, vote: voteValue })
        });
        loadPosts(); // reload visually (could be optimized)
    } catch (err) {
        alert(err.message);
    }
}
