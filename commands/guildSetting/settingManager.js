const fs = require('fs');
const { defaultSheetTtrpgType } = require('../../config/config');
const settingsFile = '../../config/guildSettings.json';

// Load settings from file
function loadSettings() {
	if (!fs.existsSync(settingsFile)) {
		fs.writeFileSync(settingsFile, JSON.stringify({}, null, 2));
	}
	return JSON.parse(fs.readFileSync(settingsFile));
}

// Save settings to file
function saveSettings(settings) {
	fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// Get settings for a guild
function getGuildSettings(guildId) {
	const settings = loadSettings();
	return settings[guildId] ?? { sheetTtrpgType: defaultSheetTtrpgType };
}

// Update settings for a guild
function updateGuildSettings(guildId, newSettings) {
	const settings = loadSettings();
	settings[guildId] = { ...getGuildSettings(guildId), ...newSettings };
	saveSettings(settings);
}

module.exports = { getGuildSettings, updateGuildSettings };
