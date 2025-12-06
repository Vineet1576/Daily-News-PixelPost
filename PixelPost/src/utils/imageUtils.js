// Utility function to get a secure, proxied image URL or fallback
export const getSecureImageUrl = (url) => {
    if (!url) return null;
    
    // List of allowed direct image domains
    const allowedDomains = [
        'localhost',
        'flashfeed.com',
        'images.unsplash.com'
    ];

    try {
        const urlObj = new URL(url);
        if (allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
            return url;
        }

        // Use imgproxy service for external images
        // You can replace this with any image proxy service you prefer
        return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=placeholder`;
    } catch (e) {
        return null;
    }
};

// Generate placeholder image with initials
export const generatePlaceholderImage = (text = 'No Image', bgColor = '6474FF') => {
    const svg = `
        <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#${bgColor}"/>
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#FFFFFF" text-anchor="middle" dy=".3em">
                ${text}
            </text>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};