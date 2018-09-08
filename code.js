var columns = 4, rows = 10;
var pointsToWin = 30;

const emptyAllowed = false;
const debugMode = false;
const GameState = {
	NotStarted: 'NotStarted',
	MakeCode: 'MakeCode',
	Solve: 'Solve',
	Solved: 'Solved'
};

var gameMode;
var gameCounter = 0;
var namePlayer1;
var namePlayer2;
var pointsPlayer1 = 0;
var pointsPlayer2 = 0;
var codeMakerName;
var codeBreakerName;
var gameState = GameState.NotStarted;
var code, guesses, guess;

function changeGameState(state)
{
	gameState = state;
}

function unsetColors(pattern)
{
	var column, unsetCount = 0;
	for (column = 0; column < columns; column++) {
		if (!pattern[column])
			unsetCount++;
	}
	return unsetCount;
}

function setCode(column, color)
{
	if (gameState !== GameState.MakeCode)
		throw new Error('Cannot set code now');
	code[column] = color;
	drawBoard();
	okButton.disabled = (unsetColors(code) !== 0);
}

function setGuess(column, color)
{
	if (gameState !== GameState.Solve)
		throw new Error('Cannot make guess now');
	guesses[guess][column] = color;
	drawBoard();
	okButton.disabled = (unsetColors(guesses[guess]) !== 0);
}

function getGuess(row, column)
{
	return guesses[row][column];
}

function makeCode()
{
	var message = codeMakerName + ' will now make the code.  ' + codeBreakerName + ' must now look away.  Press OK when you are ready to make the code.';
	return showPrompt(message).then(function() {
		changeGameState(GameState.MakeCode);
		okButton.disabled = true; // false if blanks are allowed
		animateActiveRow(true);
		return showPrompt(codeMakerName + ', make the code by dragging colors.  Press OK when the code is ready.');
	});
}

function checkGuess(row)
{
	var reds = 0, whites = 0, index, incorrectCodes = [], incorrectGuesses = [], guessColor;
	if (row === undefined)
		row = guess;
	for (column = 0; column < columns; column++) {
		guessColor = guesses[row][column];
		if (guessColor === undefined && !emptyAllowed)
			continue;
		if (guessColor === code[column]) {
			reds++;
		}
		else {
			incorrectCodes.push(code[column]);
			incorrectGuesses.push(guessColor);
		}
	}
	for (column = 0; column < incorrectGuesses.length; column++) {
		index = incorrectCodes.indexOf(incorrectGuesses[column]);
		if (index !== -1) {
			whites++;
			incorrectCodes.splice(index, 1);
		}
	}
	return {red: reds, white: whites};
}

function promptForGuess()
{
	okButton.disabled = true; // false if blanks are allowed
	animateActiveRow(true);
	showPrompt(codeBreakerName + ', make a guess by dragging colors.  Press OK when guess is ready.').then(function () {
		animateActiveRow(false);
		animateGuessCheck().then(function () {
			var result = checkGuess();
			guess++;
			if (result.red === columns || rows === guess) {
				changeGameState(GameState.Solved);
				drawBoard();
				showPrompt(result.red === columns ? 
					(codeBreakerName + ', you cracked the code in ' + guess + (guess === 1 ? ' try!!!' : ' tries!')) :
					(codeBreakerName + ', you did not crack the code.')).then(function () {
					var points = guess,
					    gameOver;
					if (gameCounter % 2 === 0)
						pointsPlayer1 += points;
					else
						pointsPlayer2 += points;
					drawBoard();
					if (gameCounter % 2 === 1) {
						if (pointsPlayer1 >= pointsToWin) {
							if (pointsPlayer1 === pointsPlayer2)
								showMessage(namePlayer1 + ' and ' + namePlayer2 + ' have tied and rejoice in their shared victory!!!');
							else
								showMessage(namePlayer1 + ' has won!!');
							gameOver = true;
						}
						else if (pointsPlayer2 >= pointsToWin) {
							showMessage(namePlayer2 + ' has won!!');
							gameOver = true;
						}
					}
					if (!gameOver) {
						gameCounter++;
						startGame();
					}
				});
			}
			else {
				drawBoard();
				promptForGuess();
			}
		});
	});
}

function startGame()
{
	var column, row;
	codeMakerName = (gameCounter % 2 === 0 ? namePlayer1 : namePlayer2);
	codeBreakerName = (gameCounter % 2 === 0 ? namePlayer2 : namePlayer1);
	guesses = [];
	for (row = 0; row < rows; row++) {
		guesses[row] = [];
		for (column = 0; column < columns; column++)
			guesses[row][column] = undefined;
	}
	code = [];
	for (column = 0; column < columns; column++)
		code[column] = undefined;
	guess = 0;
	loadBlankBoard();
	makeCode().then(function () {
		changeGameState(GameState.Solve);
		animateActiveRow(false);
		promptForGuess();
	});
}
