/*
* peut être déplacer les functions hors module
* pour lisibilité
*/

module.exports = {
	nextTurn(players, currentTurn, turnNumber) {
		if (currentTurn == players.length - 1) {
			turnNumber++;
			return { currentTurn: 0, turnNumber };
		}
		return { currentTurn: currentTurn + 1, turnNumber };
	},


	precTurn(players, currentTurn, turnNumber) {
		if (currentTurn == 0) {
			turnNumber--;
			return { currentTurn: players.length - 1, turnNumber };
		}
		return { currentTurn: currentTurn - 1, turnNumber };
	},


	passTurn(players, currentTurn, turnNumber) {
		players[currentTurn].passTurnFlag = true;
		players[currentTurn].passTurnNumber = turnNumber;
		return this.nextTurn(players, currentTurn, turnNumber);
	},
};