async function promptKind(tp) {
    const kinds = [
        "CheatSheet", "SubCheatSheet",
        "Tool", "Technique", "Concept",
        "Command", "Sub-Command", "Sub-Note",
        "Vulnerability", "Writeup",
        "Playbook", "Payload", "TTP",
        "Primary Category", "Secondary Category", "Tertiary Category"
    ];
    const choice = await tp.system.suggester(kinds, kinds);
    return choice || "Concept";
}
module.exports = promptKind;
