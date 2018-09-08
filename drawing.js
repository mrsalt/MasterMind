const markerColors = {
	red: 'red',
	green: 'green',
	orange: 'orange',
	yellow: 'yellow',
	purple: 'purple',
	blue: 'blue'
}, markerCount = Object.keys(markerColors).length,
markerRadius = 1 / 5,
textHeight = 32,
textPadding = 10,
textFamily = 'Consolas';

var canvas, boardImage, animateStartTime, animatingId;
var boardX, boardY, boardWidth, boardHeight, cellSize, markerSizeY;
var messages, messageDiv, okButton, onOKHandler;
var pointerDown, dragging, pointerPosition;

function drawRoundedRectangle(ctx, x, y, width, height, radius)
{
	ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
	ctx.arcTo(x + width, y, x + width, y + radius, radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
	ctx.lineTo(x + radius, y + height);
	ctx.arcTo(x, y + height, x, y + height - radius, radius);
	ctx.lineTo(x, y + radius);
	ctx.arcTo(x, y, x + radius, y, radius);
	
	ctx.closePath();
	ctx.strokeStyle = 'white';
	ctx.stroke();
}

function calcSpacing(count)
{
	if (count === 1)
		return {inset: 1/2, spacing: 0};
	if (count === 2)
		return {inset: 3/8, spacing: 1/4};
	if (count === 3)
		return {inset: 1/4, spacing: 1/4};
}

function calcRowsAndColumns(pegs)
{
	if (pegs === 2)
		return {rows: 1, columns: 2};
	if (pegs === 3 || pegs === 4)
		return {rows: 2, columns: 2};
	if (pegs === 5 || pegs === 6)
		return {rows: 2, columns: 3};
	if (pegs > 6)
		return {rows: 3, columns: 3};
}

function drawRow(ctx, pattern, x, y, guessIndex, markerOutline)
{
	var peg = 0, row, col, spacingX, spacingY, rowsAndCols, result, pegColors = [], i, size = cellSize, inset = size * 3 / 8, smallRadius = size / 16, markerSize = markerRadius * size;
	
	if (guessIndex !== undefined) {
		if (guess > guessIndex) {
			result = checkGuess(guessIndex);
			for (i = 0; i < result.red; i++)
				pegColors.push('red');
			for (i = 0; i < result.white; i++)
				pegColors.push('white');
		}
		
		rowsAndCols = calcRowsAndColumns(columns);
		spacingX = calcSpacing(rowsAndCols.columns);
		spacingY = calcSpacing(rowsAndCols.rows);
		
		for (row = 0; row < rowsAndCols.rows; row++) {
			for (col = 0; col < rowsAndCols.columns; col++) {
				
				ctx.beginPath();
				ctx.arc(x + (spacingX.inset + spacingX.spacing * col) * cellSize,
				        y + (spacingY.inset + spacingY.spacing * row) * cellSize,
						smallRadius, 0, Math.PI * 2);
				ctx.strokeStyle = 'white';
				ctx.closePath();
				if (pegColors[peg]) {
					ctx.fillStyle = pegColors[peg];
					ctx.fill();
				}
				ctx.stroke();
				peg++;
				if (peg === columns)
					break;
			}
		}
	}

	for (g = 0; g < columns; g++) {
		ctx.beginPath();
		ctx.arc(x + (1 + g) * size + size / 2, y + size / 2, markerSize, 0, Math.PI * 2);
		ctx.strokeStyle = markerOutline || 'white';
		ctx.closePath();
		ctx.stroke();
		if (pattern && pattern[g]) {
			ctx.fillStyle = markerColors[pattern[g]];
			ctx.fill();
		}
		else if (markerOutline) {
			ctx.fillStyle = markerOutline;
			ctx.fill();
		}
	}
}

function getMarkerPosition(color, delta)
{
	var x = boardX - cellSize / 2;
	var y = boardY + cellSize / 2;
	var colorCell = Object.keys(markerColors).indexOf(color);
	y += (1 + colorCell) * markerSizeY;
	if (delta) {
		x += delta.x;
		y += delta.y;
	}
	return {x: x, y: y};
}

function getGuessPosition(row, column, delta)
{
	var p = {x: boardX + (1 + column) * cellSize + cellSize / 2, y: boardY + (rows - row) * cellSize + cellSize / 2};
	if (delta) {
		p.x += delta.x;
		p.y += delta.y;
	}
	return p;
}

function drawMarker(ctx, color, markerOutline, p)
{
	var markerSize = markerRadius * cellSize;
	if (!markerOutline) markerOutline = 'white';
	ctx.beginPath();
	ctx.arc(p.x, p.y, markerSize, 0, Math.PI * 2);
	ctx.strokeStyle = markerOutline;
	ctx.fillStyle = markerColors[color];
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

function drawMarkerTray(ctx, markerOutline)
{
	for (var color in markerColors) {
		drawMarker(ctx, color, markerOutline, getMarkerPosition(color));
	}
}

function drawText(ctx, row, text)
{
	ctx.fillStyle = 'white';
	ctx.font = textHeight + 'px ' + textFamily;
	ctx.fillText(text, textPadding, textPadding * 3 + (textPadding + textHeight) * row);
}

function drawGameText(ctx)
{
	drawText(ctx, 0, 'Game: ' + (gameCounter + 1));
	drawText(ctx, 1, 'Code Maker: ' + codeMakerName);
	drawText(ctx, 2, 'Code Breaker: ' + codeBreakerName);
	
	drawText(ctx, 4, 'Score:');
	drawText(ctx, 5, namePlayer1 + ': ' + pointsPlayer1);
	drawText(ctx, 6, namePlayer2 + ': ' + pointsPlayer2);
}

function drawBoard()
{
	var i, row;
	
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	boardHeight = canvas.height * 0.80;
	cellSize = boardHeight / (rows + 1);
	boardWidth = cellSize * (columns + 1);
	if (boardWidth + cellSize > canvas.width) {
		cellSize = canvas.width / (columns + 3);
		boardHeight = cellSize * (rows + 1);
		boardWidth = cellSize * (columns + 1);
	}
	markerSizeY = cellSize;
	if (markerCount * cellSize > boardHeight)
		markerSizeY = boardHeight / markerCount;
	boardX = (canvas.width - boardWidth + cellSize) / 2;
	boardY = canvas.height * 0.10;
	
	drawGameText(ctx);
	
	drawRoundedRectangle(ctx, boardX, boardY, boardWidth, boardHeight, boardWidth / 16);
	ctx.fillStyle = 'rgb(50,50,50)';
	ctx.fill();
	
	for (row = 0; row < rows; row++)
		drawRow(ctx, guesses[row], boardX, boardY + (rows - row) * cellSize, row);
	drawRow(ctx, (gameState === GameState.MakeCode || gameState === GameState.Solved || debugMode) ? code : undefined, boardX, boardY);
	
	ctx.beginPath();
    ctx.moveTo(boardX, boardY + cellSize);
    ctx.lineTo(boardX + boardWidth, boardY + cellSize);
	ctx.strokeStyle = 'white';
	ctx.closePath();
	ctx.stroke();
	
	drawMarkerTray(ctx);
	
	boardImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function loadBlankBoard()
{
	messageDiv = document.createElement('div');
	okButton = document.createElement('button');
	okButton.addEventListener('click', function() {
		okButton.style.display = 'none';
		onOKHandler();
	});
	
	document.body.innerHTML = '';

	messages = document.createElement('div');
	messages.className = 'messages';
	messages.appendChild(messageDiv);
	messages.appendChild(okButton);

	okButton.innerText = 'OK';
	okButton.style.display = 'none';
	
	canvas = document.createElement('canvas');
	canvas.className = 'board';
	canvas.addEventListener('pointerdown', pointerDownHandler);
	canvas.addEventListener('pointerup', pointerUpHandler);
	canvas.addEventListener('pointermove', pointerMoveHandler);
	
	document.body.appendChild(messages);
	document.body.appendChild(canvas);
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;	
	
	drawBoard();
}

function showPrompt(text)
{
	messageDiv.innerText = text;
	okButton.style.display = '';
	return new Promise((resolve, reject) => {
		onOKHandler = resolve;
	});
}

function showMessage(text)
{
	messageDiv.innerText = text;
	okButton.style.display = 'none';
}

function blendColor(color1, color2, scale)
{
	var rP = color1[0] - color2[0];
	var gP = color1[1] - color2[1];
	var bP = color1[2] - color2[2];
	return [
		color2[0] + rP * scale,
		color2[1] + gP * scale,
		color2[2] + bP * scale];
}

function animateBoard(timestamp)
{
	const blueStart = [100, 100, 240];
	const blueEnd = [50, 50, 120];
	const cycleTime = 2000; // ms
	var t, s, color, outline;

	if (!animateStartTime) animateStartTime = timestamp;

	var ctx = canvas.getContext('2d');
	ctx.putImageData(boardImage, 0, 0);
	
	t = timestamp - animateStartTime;
	s = Math.cos(t / cycleTime * 2 * Math.PI) / 2 + 1 / 2;
	color = blendColor(blueStart, blueEnd, s);
	outline = 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
	if (gameState === GameState.MakeCode)
		drawRow(ctx, code, boardX, boardY, undefined, outline);
	else
		drawRow(ctx, guesses[guess], boardX, boardY + (rows - guess) * cellSize, undefined, outline);
	//drawMarkerTray(ctx, outline);
	if (dragging && pointerPosition) {
		delta = {x: pointerPosition.x - pointerDown.x, y: pointerPosition.y - pointerDown.y};
		if (dragging.area === 'markerTray') {
			drawMarker(ctx, dragging.color, undefined, getMarkerPosition(dragging.color, delta));
		}
		else if (dragging.area === 'guesses') {
			drawMarker(ctx, dragging.color, undefined, getGuessPosition(dragging.row, dragging.column, delta));
		}
	}
	
	if (animatingId)
		window.requestAnimationFrame(animateBoard);
}

function animateActiveRow(animating)
{
	animateStartTime = null;
	//console.debug('animateActiveRow(animating='+animating+')');
	if (animating) {
		animatingId = window.requestAnimationFrame(animateBoard);
	}
	else {
		window.cancelAnimationFrame(animatingId);
		animatingId = 0;
		drawBoard();
	}
}

function animateGuessCheck()
{
	var whenComplete, guessCheckCounter = 0, timerId, updateCheckMessage = function () {
		var i, message = 'Checking guess';
		for (i = 1; i < guessCheckCounter + 1; i++)
			message += '.';
		showMessage(message);
		if (guessCheckCounter === 3) {
			clearInterval(timerId);
			whenComplete();
		}
		guessCheckCounter++;
	};
	updateCheckMessage();
	timerId = setInterval(updateCheckMessage, 500);

	return new Promise((resolve, reject) => {
		whenComplete = resolve;
	});
}

function eventToPoint(event)
{
	return {x: event.offsetX, y: event.offsetY};
}

function hitTest(point)
{
	var color, column, row, x = point.x, y = point.y;
	if (x > boardX - cellSize && x < boardX) {
		if (y > boardY + cellSize && y < boardY + cellSize + markerCount * markerSizeY) {
			color = Math.floor((y - boardY - cellSize) / markerSizeY);
			return {area: 'markerTray', color: Object.keys(markerColors)[color]};
		}
	}
	else if (x > boardX + cellSize && x < boardX + (columns + 1) * cellSize) {
		column = Math.floor((x - boardX - cellSize) / cellSize);
		row = Math.floor((y - boardY) / cellSize);
		if (row === 0) {
			return {area: 'code', column: column};
		}
		else {
			return {area: 'guesses', row: rows - row, column: column, color: getGuess(rows - row, column)};
		}
	}
}

function pointerDownHandler(event)
{
	var point = eventToPoint(event),
		hit = hitTest(point);
	if (gameState !== GameState.MakeCode &&
	    gameState !== GameState.Solve)
		return;
	if (hit) {
		pointerDown = point;
		if (hit.area === 'markerTray') {
			dragging = hit;
		}
		else if (hit.area === 'guesses') {
			dragging = hit;
		}
	}
}

function pointerUpHandler(event)
{
	var point = eventToPoint(event),
		hit = hitTest(point),
		tmp;
	if (hit && dragging) {
		if (dragging.area === 'markerTray') {
			if (hit.area === 'code' && gameState === GameState.MakeCode)
				setCode(hit.column, dragging.color);
			else if (hit.area === 'guesses' && gameState == GameState.Solve)
				setGuess(hit.column, dragging.color);
		}
		else if (dragging.area === 'guesses') {
			if (dragging.color) {
				if (dragging.row === guess) { // swap
					tmp = getGuess(guess, hit.column);
					setGuess(hit.column, dragging.color);
					setGuess(dragging.column, tmp);
				}
				else {
					setGuess(hit.column, dragging.color);
				}
			}
		}
	}
	pointerDown = false;
	pointerPosition = false;
	dragging = false;
}

function pointerMoveHandler(event)
{
	if (pointerDown) {
		pointerPosition = eventToPoint(event);
	}
}
