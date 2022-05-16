
function Game(channelId) {
  this.channel = channelId;
  this.players = [];
  this.letters = "";
  this.turn = 0;//index of player of turn
  this.turnType = 0;//0: add letter or challenge, 1: response to challenge
  this.lastPlayer; //the last player to take a turn
}

Game.prototype.addLetter = function(player, letter) {
  if (!this.checkInGame(player)) {
    console.log(player.username + " is not in the game")
    return "You aren't playing in this game.  Type l!join to join!"; //check if not in game
  }
  if (this.getPlayerIds()[this.turn] !== player.id) {
    console.log("it is not "+player.username + " turn")
    return "It is " + this.getPlayers()[this.turn]+"'s turn now."; //check if player's turn
  }
  
  if (letter.length == 1) {
    this.nextTurn();
    this.letters += letter.toLowerCase(); //add the single letter
    return "The word is now `"+this.letters+"`";;//successful
  }
  else if (letter.substring(0,letter.length-1) == this.letters) {
    this.nextTurn();
    this.letters += letter.toLowerCase().substring(letter.length-1); //add the last letter of complete word
    return "The word is now `"+this.letters+"`";//successful
  }
  return "Please enter a letter.";//unsucecssful
}

Game.prototype.challenge = function(player) {
  if (!this.checkInGame(player)) {
    console.log(player.username + " is not in the game")
    return "You aren't playing in this game.  Type `l!join` to join!"; //check if not in game
  }
  if (this.getPlayerIds()[this.turn] !== player.id) {
    console.log("it is not "+player.username + " turn")
    return "It is " + player.username+"'s turn now."; //check if player's turn
  }
  if (this.letters.length < 1) {
    return "The word is empty smh"; //check if player's turn
  }
  //challenge
  this.turnType = 1;
  this.turn = this.getPlayerIds().indexOf(this.lastPlayer.id);
  return `${player.username} challenged ${this.lastPlayer.username}! They now have 5 seconds to send a word that starts with \`${this.letters}\`!`
}

Game.prototype.checkWord = function(allWords) {
  if (this.letters.length < 3) return false; //do nothing if less than 3 letters
  if (allWords.indexOf(this.letters) == -1) return false; //do nothing if its not a word
  return true;
}
Game.prototype.checkGuess = function(allWords, guess) {
  if (guess.toLowerCase().substring(0,this.letters.length) !== this.letters) return false; //do nothing if less than 3 letters
  if (allWords.indexOf(guess.toLowerCase()) == -1) return false; //do nothing if its not a word
  return true;
}

Game.prototype.getPlayerIds = function() {
  var idList = [];
  this.players.forEach((p) => {
    idList.push(p.id);
  });
  return idList;
}

Game.prototype.getPlayers = function() {
  var nameList = [];
  this.players.forEach((p) => {
    nameList.push(p.username);
  });
  return nameList;
}

Game.prototype.addPlayer = function(player) {
  this.players.push({
    id: player.id,
    username: player.username,
    lives: 5
  })
}

Game.prototype.checkInGame = function(player) {
  if (this.getPlayerIds().indexOf(player.id) !== -1) {
      return true;
  }
  return false;
}

Game.prototype.nextTurn = function() {
  this.lastPlayer = this.players[this.turn];
  this.turn++;
  if (this.turn >= this.players.length) this.turn = 0;
}

Game.prototype.nextRound = function(loser) {
  loser.lives--;
  this.letters = "";
  this.turnType = 0;
}

module.exports = {Game};