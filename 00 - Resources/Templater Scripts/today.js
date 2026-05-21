function today() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}
module.exports = today;
