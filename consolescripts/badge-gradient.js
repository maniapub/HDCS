(async function() {
    // 1. Define the anchor hex points for your left-to-right color spectrum
    const startColor = { r: 0,   g: 240, b: 255 }; // Electric Cyan (#00f0ff)
    const endColor   = { r: 242, g: 125, b: 179 }; // Vibrant Rose (#f27db3)

    // Helper: Interpolates colors smoothly step-by-step
    function lerpColor(c1, c2, factor) {
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    console.log("%c[Gradient Engine] Fetching your current account profile state...", "color: #00f0ff;");

    // 2. Fetch the live dashboard data array to get your precise ordered badge list
    const profileResponse = await fetch('/api/dashboard/profile');
    if (!profileResponse.ok) {
        console.error("%c[Error] Could not read dashboard profile data.", "color: #ff4757;");
        return;
    }
    
    const profileData = await profileResponse.json();
    // Filter to ensure we only style badges that are actively enabled on your card
    const activeBadges = profileData.badges ? profileData.badges.filter(b => b.enabled) : [];
    const total = activeBadges.length;

    if (total === 0) {
        console.warn("%c[Warning] No active badges found to style! Turn them on in your settings first.", "color: #eccc68;");
        return;
    }

    console.log(`%c[Gradient Engine] Sequencing ${total} active badges into the color line...`, "color: #2ed573;");

    // 3. Iteratively dispatch PATCH updates to map each badge color onto the server database
    for (let i = 0; i < total; i++) {
        const targetBadge = activeBadges[i];
        // Calculate the relative weight step from 0.0 (left) to 1.0 (right)
        const factor = total > 1 ? (i / (total - 1)) : 0.5;
        const calculatedHex = lerpColor(startColor, endColor, factor);

        console.log(` -> Painting badge "${targetBadge.name || targetBadge.badgeId}" [Position ${i + 1}/${total}] -> ${calculatedHex}`);

        // Construct the network dispatch to the persistent badge asset endpoint
        const updateRequest = await fetch(`/api/dashboard/profile/badges/${targetBadge.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color: calculatedHex }) // Overrides the static color mapping securely
        });

        if (!updateRequest.ok) {
            console.error(`Failed updating asset target slot: ${targetBadge.id}`);
        }
        
        // Minor 150ms delay block to stay fully compliant with API speed rules
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log("%c[Success] The gradient has been completely synchronized to the database! Refresh your public bio page to see it live for all users.", "color: #00f0ff; font-weight: bold;");
    location.reload();
})();
