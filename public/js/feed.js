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
                    <a href="/community.html?slug=${post.community_slug}">t/${post.community_slug}</a> • 
                    Posted by <a href="/profile.html?u=${post.author}">${post.author}</a> on ${new Date(post.created_at).toLocaleDateString()}
                </div>
                <h3 class="post-title"><a href="/post.html?id=${post.id}">${post.title}</a></h3>
                <div class="post-actions">
                    <span style="display: flex; gap: 0.5rem;">
                        <button class="vote-btn upvote" onclick="votePost(${post.id}, 1)">▲</button>
                        <span style="font-weight: bold; color: var(--text-primary);">${post.upvotes - post.downvotes}</span>
                        <button class="vote-btn downvote" onclick="votePost(${post.id}, -1)">▼</button>
                    </span>
                    <a href="/post.html?id=${post.id}" style="color: inherit;">💬 ${post.comment_count || 0} Comments</a>
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
