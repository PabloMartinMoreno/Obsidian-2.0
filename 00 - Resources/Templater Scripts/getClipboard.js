async function getClipboard() {
    try {
        return await navigator.clipboard.readText();
    } catch (e) {
        return "";
    }
}
module.exports = getClipboard;
