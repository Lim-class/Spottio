// shared/js/spottio-gdpr-export.js
window.SpottioExport = (function() {

    const triggerDownload = (content, filename, contentType) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const fetchAllUserData = async (uid) => {
        const db = window.db || firebase.firestore();
        const exportPackage = {
            exportDate: new Date().toISOString(),
            uid: uid,
            profile: {},
            relations: {},
            posts: [],
            likedPosts: [],
            commentsLeft: []
        };

        // 1. Profilo principale e relazioni
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
            const uData = userDoc.data();
            exportPackage.profile = {
                username: uData.username || '',
                email: uData.email || '',
                bio: uData.bio || '',
                birthDate: uData.birthDate || null,
                isPrivate: uData.isPrivate || false,
                isVerified: uData.isVerified || false,
                preferences: uData.preferences || {},
                lastIp: uData.last_ip || null
            };
            exportPackage.relations = {
                followersCount: (uData.followers || []).length,
                followers: uData.followers || [],
                followingCount: (uData.following || []).length,
                following: uData.following || [],
                pendingRequests: uData.pending_follows || []
            };
        }

        // 2. Post & Flashspot creati
        const postsSnap = await db.collection("posts").where("user", "==", uid).get();
        postsSnap.forEach(doc => {
            const d = doc.data();
            exportPackage.posts.push({
                id: doc.id,
                text: d.text || '',
                type: d.type || 'standard',
                categories: d.categories || (d.category ? [d.category] : []),
                mediaList: d.mediaList || [],
                likesCount: (d.likes || []).length,
                commentsCount: (d.comments || []).length,
                timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : null
            });
        });

        // 3. Post Piaciuti (sotto-raccolta liked_posts)
        try {
            const likedSnap = await db.collection("users").doc(uid).collection("liked_posts").get();
            likedSnap.forEach(d => {
                exportPackage.likedPosts.push({
                    postId: d.id,
                    likedAt: d.data().likedAt?.toDate ? d.data().likedAt.toDate().toISOString() : null
                });
            });
        } catch (e) {
            console.warn("Errore recupero post piaciuti:", e);
        }

        // 4. Commenti lasciati (sotto-raccolta commented_posts)
        try {
            const commentedSnap = await db.collection("users").doc(uid).collection("commented_posts").get();
            for (const cDoc of commentedSnap.docs) {
                const postId = cDoc.id;
                const pSnap = await db.collection("posts").doc(postId).get();
                if (pSnap.exists) {
                    const postComments = pSnap.data().comments || [];
                    postComments.filter(c => c.user === uid).forEach(c => {
                        exportPackage.commentsLeft.push({
                            postId: postId,
                            postAuthor: pSnap.data().user || '',
                            commentText: c.text,
                            timestamp: c.timestamp?.toDate ? c.timestamp.toDate().toISOString() : null
                        });
                    });
                }
            }
        } catch (e) {
            console.warn("Errore recupero commenti:", e);
        }

        return exportPackage;
    };

    const downloadAsJson = async (uid, username) => {
        const data = await fetchAllUserData(uid);
        const jsonStr = JSON.stringify(data, null, 2);
        const fileName = `spottio_dati_${username || uid}_${new Date().toISOString().slice(0, 10)}.json`;
        triggerDownload(jsonStr, fileName, 'application/json');
    };

    const downloadAsHtml = async (uid, username) => {
        const data = await fetchAllUserData(uid);
        const safeName = username || uid;

        const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Archivio Personale Spottio - @${safeName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 2rem; max-width: 900px; margin: 0 auto; line-height: 1.5; }
        h1, h2, h3 { color: #0f172a; }
        .card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .meta { color: #64748b; font-size: 0.85rem; }
        ul { list-style: none; padding: 0; margin: 0; }
        li { padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        li:last-child { border-bottom: none; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; }
    </style>
</head>
<body>
    <h1>📦 Archivio Personale Dati Spottio</h1>
    <p class="meta">Esportazione generata il ${new Date().toLocaleString()} per l'utente <strong>@${safeName}</strong> (UID: ${uid})</p>

    <div class="card">
        <h2>👤 Informazioni Profilo</h2>
        <p><strong>Username:</strong> @${data.profile.username}</p>
        <p><strong>Email:</strong> ${data.profile.email || 'Non specificata'}</p>
        <p><strong>Bio:</strong> ${data.profile.bio || 'Nessuna biografia'}</p>
        <p><strong>Data di Nascita:</strong> ${data.profile.birthDate || 'Non impostata'}</p>
        <p><strong>Seguiti:</strong> ${data.relations.followingCount} | <strong>Follower:</strong> ${data.relations.followersCount}</p>
    </div>

    <div class="card">
        <h2>📝 I tuoi Spot Pubblicati (${data.posts.length})</h2>
        ${data.posts.length === 0 ? '<p class="meta">Nessun post pubblicato.</p>' : ''}
        <ul>
            ${data.posts.map(p => `
                <li>
                    <p style="margin: 0 0 0.25rem 0; font-weight: 500;">${p.text || '[Media]'}</p>
                    <span class="meta">${p.timestamp || ''} • Like: ${p.likesCount} • Commenti: ${p.commentsCount}</span>
                </li>
            `).join('')}
        </ul>
    </div>

    <div class="card">
        <h2>💬 Commenti Lasciati (${data.commentsLeft.length})</h2>
        ${data.commentsLeft.length === 0 ? '<p class="meta">Nessun commento registrato.</p>' : ''}
        <ul>
            ${data.commentsLeft.map(c => `
                <li>
                    <p style="margin: 0 0 0.25rem 0;">"${c.commentText}"</p>
                    <span class="meta">Sul post ID: ${c.postId} • Data: ${c.timestamp || ''}</span>
                </li>
            `).join('')}
        </ul>
    </div>
</body>
</html>`;

        const fileName = `spottio_archivio_${safeName}_${new Date().toISOString().slice(0, 10)}.html`;
        triggerDownload(htmlContent, fileName, 'text/html');
    };

    return { downloadAsJson, downloadAsHtml };
})();