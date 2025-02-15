const { google } = require('googleapis');

/*
* Peut être déplacer l'instance sheets hors function
* pour rapidité d'exec
*/

async function getGoogleAuth() {
	const auth = new google.auth.GoogleAuth({
		keyFile: 'project-it-credentials.json',
		scopes: 'https://www.googleapis.com/auth/spreadsheets',
	});
	return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function getPlayerData(spreadsheetId, range) {
	try {
		const sheets = await getGoogleAuth();
		const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
		return response.data.values;
	} catch (error) {
		console.error(`Error fetching data from ${spreadsheetId}:`, error);
		return null;
	}
}

module.exports = { getGoogleAuth, getPlayerData };
