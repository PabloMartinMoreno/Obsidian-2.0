async function extractIP() {
    try {
        const text = await navigator.clipboard.readText();
        const match = text.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/);
        return match ? match[0] : "";
    } catch (e) {
        return "";
    }
}
module.exports = extractIP;
