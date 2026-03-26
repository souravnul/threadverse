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

        // Render Header
        headerContainer.innerHTML = `
            <div class="community-header">
                <div class="community-info">
                    <h1>t/${community.slug}</h1>
                    <p style="font-size: 0.9rem; margin-bottom: 1rem; color: var(--accent-color)">${community.name}</p>
                    <p>${community.description}</p>
                </div>
                <div class="community-actions">
                    <span style="color: var(--text-secondary)">Created by ${community.creator}</span>
                    <a href="/create-post.html?community_id=${community.id}" class="btn" style="text-align: center;">Create Post</a>
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
                    Posted by <a href="/profile.html?u=${post.author}">${post.author}</a> on ${new Date(post.created_at).toLocaleDateString()}
                </div>
                <h3 class="post-title"><a href="/post.html?id=${post.id}">${post.title}</a></h3>
                <div class="post-actions">
                    <span style="display: flex; gap: 0.5rem;">
                        <span style="font-weight: bold; color: var(--text-primary);">Votes: ${post.upvotes - post.downvotes}</span>
                    </span>
                    <a href="/post.html?id=${post.id}" style="color: inherit;">💬 Comments</a>
                </div>
            </article>
        `).join('');

    } catch (err) {
        headerContainer.innerHTML = `<div class="alert alert-error">Community load error: ${err.message}</div>`;
        postsContainer.innerHTML = '';
    }
}
