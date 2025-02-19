const { numberTurnByPass } = require('../../config/config');


function nextTurn(players, currentTurn, turnNumber) {
	if (currentTurn == players.length - 1) {
		turnNumber++;
		return { currentTurn: 0, turnNumber };
	}
	return { currentTurn: currentTurn + 1, turnNumber };
};


function precTurn(players, currentTurn, turnNumber) {
	if (currentTurn == 0) {
		turnNumber--;
		return { currentTurn: players.length - 1, turnNumber };
	}
	return { currentTurn: currentTurn - 1, turnNumber };
};


function passTurn(players, currentTurn, turnNumber) {
	players[currentTurn].passTurnFlag = true;
	players[currentTurn].passTurnNumber = turnNumber;
	return nextTurn(players, currentTurn, turnNumber);
};

async function calculateTurnOrder(players, currentTurn, turnNumber, refresh) {
	const refreshedPlayers = await Promise.all(players.map(player => {
		if (!player.isPNJ && refresh) {
			console.log(`Refreshing player data for ${player.name}`);
			player.setPlayerData();
			return player;
		}
		return player;
	}));

	// Sort players by initiative
	refreshedPlayers.sort((a, b) => b.initiative - a.initiative);
	// Generate turn order data
	return refreshedPlayers.map((player, index) => {
		if (index === currentTurn) {
			if (player.passTurnFlag && player.passTurnNumber + numberTurnByPass === turnNumber) {
				player.passTurnFlag = false;
			}
			return { ...player, isCurrentTurn: true };
		}

		return { ...player, isCurrentTurn: false };
	});

};


module.exports = {
	nextTurn,
	precTurn,
	passTurn,
	calculateTurnOrder,
};