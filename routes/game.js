var express = require('express');
var world = require("./map.js");
var io = require('../app');
var router = express.Router();
var maxGameID = 0;
var games = [];

//This creates a new game map with our gameid. No players are assigend to this map
//var map = new world.Map("1");
//You can give players control of a territory using it's ID
//Giving playerid 1 control of territory 2
//map.setPlayer(1, 2);
//Let's add some troops to his territory
//Giving territory 2, 6 troops
//map.addTroops(2, 6);
//We can determine if the territory is ajacent to another territory
//console.log(map.isAjacent(2, 1));
//And we can also count how many territories someone has
//console.log(map.territoriesOwned(1));

// Socket stuff
io.on('connection', function(socket) {
  io.emit('chat message', 'Welcome to the game!');
    socket.on('chat message', function(msg) {
      io.emit('chat message', msg);
    });
});


function createGame() {
  var game = {};
  game.id = maxGameID;
  game.territories = new world.Map(maxGameID);
  game.players = [];
  game.currentPlayer = 0;
  game.currentPhase = "setup";
  games[maxGameID] = game;
  maxGameID++
  return game;
}

function startGame(gameId) {
  var game = games[gameId];
  initTerritories(game);


  //return player to start turn or do that here
}

function addPlayer(gameId, player) {
	var game = games[gameId];
	//TODO: Need some validation on the player object
	game.players.push(player);
	if (game.players.length >= 4) {
		startGame(gameID);
	} 
	return true;
}

function removePlayer(gameId, player) {
  var game = games[gameId];
  var index = game.players.indexOf(player); //may not work because of object reference. But I think it should. not tested
  game.players.splice(index, 1);


  if (game.players.length < 1) {  //or when equal to one could declare winner.
    endGame(gameID);
  }
  return true; 
}

function startTurn(gameId, player) {
  
}

function draft(gameId, player) {
  
}

function endTurn(gameID, player) {
  var game = games[gameId];
  var playerIndex = game.players.indexOf(player);
  
  if(++playerIndex > 3)
    playerIndex = 0;

  game.currentPlayer = game.players[playerIndex].id;

  return true;
  
}

//Assumes player has no remaining territories 
function playerElimination(gameID, player) {
  return removePlayer(gameid,player);
}

function playerVictory(gameID, player) {
  //Do something with player
  return endGame(gameId);
}

function endGame(gameId) {
  delete games[gameId];
  return true;
}


function setTerritories(game) {
  //var game = games[gameId];

  var playerIndex = 0;
  var territoryIndex = 1;
  var totalTerritories = game.territories.territories.length;
  var totalTroops = 120;

  for (i = 0; i < totalTroops; i++) {
    game.territories.setPlayer(playerIndex, territoryIndex);
    game.territories.addTroops(territoryIndex, 1);
    
    playerIndex++;
    territoryIndex++;

    if (playerIndex > 3) playerIndex = 0;
    if (territoryIndex > totalTerritories)
      territoryIndex = 1;
  }
}

function attack(gameId, attackingTerritory, defendingTerrritory, attackingTroops, defendingTroops){
  //Assumes that territories are adjecent and not owned by same player
  var game = games[gameId];

  var result = simulate(attackingTroops, defendingTroops);
  //results = array containing num of remaining troops in territories 

  game.addTroops(attackingTerritory, attackingTroops - result[0]); //attackingTroops in result[0]
  game.addTroops(defendingTerrritory, defendingTroops - result[1]); //defendingTroops in result[1]

  //Check for territories 

  return true;

}

function simulate (attackingTroops, defendingTroops) {

  //Attacking Troops = 2
  if (attackingTroops == 2) {
    
    //Defending Troops = 1
    if (defendingTroops < 2)
      return attacking1v1(attackingTroops, defendingTroops);

    //Defending Troops > 1
    else
      return attacking1v2(attackingTroops, defendingTroops);
  }

  //Attacking Troop = 3
  else if (attackingTroops == 3) {

    //Defending Troops = 1
    if (defendingTroops < 2)
      return attacking2v1(attackingTroops, defendingTroops);

    //Defending Troops > 1
    else
      return attacking2v2(attackingTroops, defendingTroops);
  } 

  //Attacking Troop > 3
  else {

    //Defending Troops = 1
    if (defendingTroops < 2)
      return attacking3v1(attackingTroops, defendingTroops);

    //Defending Troops > 1
    else 
      return attacking3v2(attackingTroops, defendingTroops);
  }
}

function attacking1v1(attackingTroops, defendingTroops) {
  var result = [attackingTroops, defendingTroops];
  
  var attack = diceRoll();
  var defense = diceRoll();

  //Push Rolls to Socket

  //console.log('Attacking Die: '+attack.toString());
  //console.log('Defending Die: '+defense.toString());

  if (attack > defense) --result[1];  //Attacker wins
  
  else --result[0];  //Defender wins
      
  return result;
}

function attacking1v2(attackingTroops, defendingTroops) {
  var result = [attackingTroops, defendingTroops];
  
  var attack = diceRoll();
  var defense = [diceRoll(), diceRoll()];
      
  defense.sort(function(a, b){return b - a});

  //Push Rolls to Socket

  //console.log('Attacking Die: '+attack.toString());
  //console.log('Defending Dice: '+defense.toString());
      
  if (attack > defense[0]) --result[1];
  
  else --result[0];  

  return result;  
}

function attacking2v1(attackingTroops,defendingTroops) {
  var result = [attackingTroops, defendingTroops];

  var attack = [diceRoll(), diceRoll()];
  var defense = diceRoll();

  attack.sort(function(a, b){return b - a});

  //Push Rolls to Socket

  //console.log('Attacking Dice: '+attack.toString());
  //console.log('Defending Die: '+defense.toString());

  if (attack[0] > defense) --result[1];
  
  else --result[0];

  return result;
}

function attacking2v2(attackingTroops,defendingTroops) {
  var result = [attackingTroops, defendingTroops];

  var attack = [diceRoll(), diceRoll()];
  var defense = [diceRoll(), diceRoll()];
      
  attack.sort(function(a, b){return b - a});
  defense.sort(function(a, b){return b - a});

  //Push Rolls to Socket

  //console.log('Attacking Dice: '+attack.toString());
  //console.log('Defending Dice: '+defense.toString());
      
  //Compares highest die
  if (attack[0] > defense[0]) {
  
    --result[1];  //Highest attacker wins
    
    //Compares second highest die
    if (attack[1] > defense[1]) {
      --result[1];  //Second highest attacker wins
    } else { 
      --result[0];  //Second highest defender wins
    }

    return result;

  } else {
    --result[0]; //Highest defender wins

    //Compares second highest die
    if (attack[1] > defense[1]) --result[1]; 
    
    else --result[0];

    return result;
  }
}

function attacking3v1(attackingTroops,defendingTroops) {
  var result = [attackingTroops, defendingTroops];

  var attack = [diceRoll(), diceRoll(), diceRoll()];
  var defense = diceRoll();

  attack.sort(function(a, b){return b - a});

  //Push Rolls to Socket

  //console.log('Attacking Dice: '+attack.toString());
  //console.log('Defending Die: '+defense.toString());

  if (attack[0] > defense) --result[1];
  
  else --result[0];
      
  return result;
}

function attacking3v2(attackingTroops,defendingTroops) {
  var result = [attackingTroops, defendingTroops];

  var attack = [diceRoll(), diceRoll(), diceRoll()];
  var defense = [diceRoll(), diceRoll()];
      
  attack.sort(function(a, b){return b - a});
  defense.sort(function(a, b){return b - a});

  //Push Rolls to Socket

  //console.log('Attacking Dice: '+attack.toString());
  //console.log('Defending Dice: '+defense.toString());
      
  //Compares highest die
  if (attack[0] > defense[0]) {
    --result[1];

    //Compares second highest die
    if (attack[1] > defense[1]) {
      --result[1]; 
    } else {
      --result[0];
    }

    //return result;

  } else {
    --result[0];
        
    //Compares second highest die
    if (attack[1] > defense[1]) {
      --result[1]; 
    } else {
      --result[0];
    }
  }

  return result;
}


function diceRoll() {
  return Math.floor(Math.random() * 6) + 1;
}


/* This file will contain all of the backend game logic */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/:id/territories', function(req, res, next) {
  var currentGame = createGame();
  setTerritories(currentGame);
  res.send(currentGame);
});

router.get('/:id/state', function(req, res, next) {
    game = games[req.params.id];
    console.log(req.params);
    console.log(games);
    if (game != null) {
      res.send(game);
    } else {
      res.send(false);
    }
});

router.get('/:id', function(req, res, next) {
  game = games[req.params.id];
  res.render('game', { gameid: req.params.id });
  //Eventually the code will work like this
  /*
  game = games[req.params.id];
  if (game != null) {
    res.render('game', { gameState: game });
  } else {
    res.render('index', { title: 'Create a game!' });
  }
  */
});

router.post('/events', function(req, res, next) {
  console.log(req.body);
	switch (req.body.type){
    case "CreateGame":
      res.send(createGame());
      break;
    case "PlayerJoined": 
      res.send(addPlayer(req.body.gameid, req.body.player));
      break;
    case "PlayerLeft":
      res.send(removePlayer(res.body.event.gameid, res.body.event.player));
      break;
    case "TurnStart":
      res.send(startTurn(res.body.event.gameid, res.body.event.player));
      break;
    case "DraftMove":
      res.send(draft(res.body.event.gameid, res.body.event.player, res.body.event.territory, res.body.event.amount));
      break;
    case "Attack":
      //not implemented
      //res.send();
      break;
    case "BattleResult":
      //not implemented
      //res.send();
      break;
    case "BattleVictory":
      //not implemented
      //res.send();
      break;
    case "Fortify":
      //not implemented
      //res.send();
      break;
    case "TurnEnd":
      res.send(endTurn(res.body.event.gameid, res.body.event.player));
      break;
    case "PlayerEliminated":
      res.send(playerElimination(res.body.event.gameid, res.body.event.player));
      break;
    case "PlayerWon":
      res.send(playerVictory(res.body.event.gameid, res.body.event.player));
      break;
	   default: 
	       console.log("this shouldn't happen");
	}
});

module.exports = router;
