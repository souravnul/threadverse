document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        document.getElementById('community-header-container').innerHTML = `<div class="alert alert-error">Community not found.</div>`;
        document.getElementById('posts-container').innerHTML = '';
        return;
    }

    await loadCommunityDetails(slug);
});

async function loadCommunityDetails(slug) {
    const headerContainer = document.getElementById('community-header-container');
    const postsContainer = document.getElementById('posts-container');

    try {
        const data = await apiFetch(`/api/communities/${slug}`);
        const { community, posts } = data; // the backend returns { community: {}, posts: [] }

        headerContainer.innerHTML = `
            <div class="community-header" style="background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 2.5rem; border-radius: 1.5rem; backdrop-filter: blur(12px);">
                <div class="community-info">
                    <p style="text-transform: uppercase; font-size: 0.75rem; font-weight: 800; letter-spacing: 2px; color: var(--accent-color); margin-bottom: 0.5rem;">t/${community.slug}</p>
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -1px;">${community.name}</h1>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); max-width: 600px;">${community.description}</p>
                </div>
                <div class="community-actions" style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1.5rem; justify-content: flex-start;">
                    <a href="/create-post.html?community_id=${community.id}" class="btn" style="width: auto; padding: 0.75rem 1.5rem;">New Post</a>
                    <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Created by <a href="/profile.html?u=${community.creator}" style="color: var(--text-primary); font-weight: 600;">${community.creator}</a></span>
                </div>
            </div>
        `;

        // Render Posts
        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = '<p class="loading">No posts in this community yet.</p>';
            return;
        }

        postsContainer.innerHTML = posts.map(post => `
            <article class="post-card">
                <div class="post-meta">
                    Posted by <a href="/profile.html?u=${post.author}">${post.author}</a> 
                    <span class="dot"></span>
                    ${new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <h3 class="post-title"><a href="/post.html?id=${post.id}">${post.title}</a></h3>
                <p class="post-excerpt">${post.body || ''}</p>
                <div class="post-actions">
                    <div class="vote-group">
                        <button class="vote-btn" onclick="votePost(${post.id}, 1)">▲</button>
                        <span style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">${Number(post.upvotes || 0) - Number(post.downvotes || 0)}</span>
                        <button class="vote-btn" onclick="votePost(${post.id}, -1)">▼</button>
                    </div>
                </div>
            </article>
        `).join('');

    } catch (err) {
        headerContainer.innerHTML = `<div class="alert alert-error">Community load error: ${err.message}</div>`;
        postsContainer.innerHTML = '';
    }
}
