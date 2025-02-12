/*
* peut être déplacer les functions hors module
* pour lisibilité
*/

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

async function calculateTurnOrder(players, currentTurn, turnNumber, refresh = false, refreshPlayerData) {
	players.forEach(async player => {
		if (refresh && !player.isPNJ) await refreshPlayerData(player);
	});

	// Generate turn order data
	return players.map((player, index) => {
		if (index === currentTurn) {
			if (player.passTurnNumber + 1 === turnNumber && player.passTurnFlag) {
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