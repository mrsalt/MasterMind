function playVsAI()
{
	gameMode = 'ai';
	document.body.innerHTML =
	'<div id="setup">'+
	'<h2>Mastermind</h2>'+
	'<h3>Player vs. AI</h3>'+
	'<input type="text" id="player-name-1" placeholder="Player 1 Name"><br>'+
	'<button id="ok">OK</button>'+
	'<button id="start-over">Start Over</button>'+
	'</div>';
	
	document.getElementById('ok').addEventListener('click', checkGameReady);
	document.getElementById('start-over').addEventListener('click', setupGame);	
}

function playVsPerson()
{
	gameMode = 'person';
	document.body.innerHTML =
	'<div id="setup">'+
	'<h2>Mastermind</h2>'+
	'<h3>Player vs. Player</h3>'+
	'<input type="text" id="player-name-1" placeholder="Player 1 Name" value=""><br>'+
	'<input type="text" id="player-name-2" placeholder="Player 2 Name" value=""><br>'+
	'Pegs (2=Easy, 6=Hard)<input type="number" id="pegs" min="2" max="6" value="4" step="1"><br>'+
	'Max Guesses <input type="number" id="max-guesses" min="5" max="20" value="10" step="1"><br>'+
	'Points to Win <input type="number" id="points-to-win" min="5" max="100" value="30" step="1"><br>'+
	'<button id="ok">OK</button>'+
	'<button id="start-over">Start Over</button>'+
	'</div>';
	
	document.getElementById('ok').addEventListener('click', checkGameReady);
	document.getElementById('start-over').addEventListener('click', setupGame);
}

function checkGameReady()
{
	var playerName1 = document.getElementById('player-name-1');
	var playerName2 = document.getElementById('player-name-2');
	
	if (!playerName1.value)
	{
		playerName1.focus();
		alert('Enter Player 1 Name');
		return;
	}
	namePlayer1 = playerName1.value;
	
	if (gameMode === 'person')
	{
		if (!playerName2.value)
		{
			playerName2.focus();
			alert('Enter Player 2 Name');
			return;
		}
		namePlayer2 = playerName2.value;		
	}
	else
	{
		namePlayer2 = 'Mr Roboto';
	}
	
	columns = parseInt(document.getElementById('pegs').value);
	rows = parseInt(document.getElementById('max-guesses').value);
	pointsToWin = parseInt(document.getElementById('points-to-win').value);
	
	startGame();
}

function setupGame()
{
	document.body.innerHTML =
	'<div id="setup">'+
	'<h2>Mastermind</h2>'+
	//'<button id="play-vs-ai">Player vs. AI</button>'+
	'<button id="play-vs-person">Player vs. Player</button>'+
	'</div>';
	
	//document.getElementById('play-vs-ai').addEventListener('click', playVsAI);
	document.getElementById('play-vs-person').addEventListener('click', playVsPerson);
	
}