//word list: http://www.mieliestronk.com/corncob_lowercase.txt
const Discord = require("discord.js");
const _ = require("lodash");
const game = require("./game.js");
var fs = require("fs");
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]});

var botPrefix = "L!";

//array of current games
var games = [];

//get word list
var rawdata = fs.readFileSync('./words_alpha.txt', {encoding:'utf8', flag:'r'});
var allWords = rawdata.split(/\r?\n/);

//turn length
var turnLength = 30; //in seconds
var challengeLength = 10;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(botPrefix + "help"); 
});


client.on('message', message => {
  //command prefix
  var msg = message.content;
  var sender = message.author;
  var channel = message.channelId;
  var g = getGame(channel);
  var isCommand = false;

  //commands
  if (msg.substring(0,botPrefix.length) == botPrefix) {
    var isCommand = true;
    var command;
    if (msg.indexOf(" ") == -1) command = msg.substring(botPrefix.length);
    else command = msg.substring(botPrefix.length, msg.indexOf(" "));

    //commands
    switch (command) {
      case "help"://help message
        var Embed = new Discord.MessageEmbed()
          .setColor("#87de90")
          .setTitle("Help")
          .setDescription("LetterPlay is a game all about letters!  Players each start with 3 lives and take turns.  Each turn, a player has two options: add a letter to a communal word or challenge the last move.  Each player must make their turn within "+turnLength+" seconds, or else they'll lose a life.  You're out once all your lives are gone, and the last player standing wins!")
          .addField("Starting the game", "Start a new game with `" +botPrefix+ "start`, or join an existing game with `" + botPrefix + "join`.  You can only join a game before a player has lost a life.  Only one game can be played per channel!")
          .addField("Adding a letter", "Just type a letter while it is your turn or use `" + botPrefix + "add <letter>`.  If the player makes a complete word when adding a letter, they lose a life and the word is reset.", true)
          .addField("Challenging", "If a player can't think of a word with the given letters during their turn, they can challenge instead with `" + botPrefix + "challenge`.  In a challenge, the last player to make a move must respond complete the communal word to form a real word.  If a real word is made, the challenger loses a life, but if the challenged player cannot, they lose a life instead.", true)
          .addField("Responding to a Challenge", "Just type a completed word once you are challenged or use `" + botPrefix + "respond <guess>`.  You gotta be quick, because you only get " + challengeLength + " seconds to respond to a challenge", true)
          .addField("Other","Use `"+botPrefix+"lives` to view everyone's remaining lives.  This game uses a British English word list, so its colour not color!")
        message.channel.send({embeds:[Embed]});
        break;
      case "start"://starts a new game
        //check if player is already playing
        if (checkInGame(sender) == false){
          //check if there is already a game running
          if (g == -1) {
            msgBox(message, ":arrow_forward: New game started!", "Type `"+botPrefix+"join` to join!")
            games.push(_.cloneDeep(new game.Game(channel)));
            games[games.length-1].addPlayer(sender);
          }
          else {
            message.channel.send("There is already a game running in this channel.");
          }
        }
        else {
          message.channel.send("You are already in a game!");
        }
        break;
      case "join":
        if (checkInGame(sender) == false){
          if (g !== -1) {
            //check first if anyone lost a life
            var started = false;
            for (var i = 0; i < g.players.length; i++) {
              if (g.players[i].lives < 3) {
                message.channel.send("Sorry!  This game has already started.  (A player has lost a life)");
                started = true;
                break;
              }
            }
            //add player
            if (!started) {
              msgBox(message, ":arrow_forward: You joined the game!", "Playing with " + g.getPlayers().join(", "))
            g.addPlayer(sender);
            }
          }
          else {
            message.channel.send("There is no game to join in this channel.  Use `" + botPrefix + "start` to start one!");
          }
        }
        else {
          message.channel.send("You are already in a game!");
        }
        break;
      case "add":
        addLetter(message, sender, channel);
        break;
      case "lives":
        if (g == -1) break; //return if there is no game
        var response = "Player lives:\n";
        g.players.forEach((p)=>{
          response += p.username + ": " + p.lives + " lives\n"
        });
        msgBox(message, "Lives left:", response);
        break;
      case "challenge":
        if (g == -1) break; //return if there is no game
        if (!checkMove(message, sender, channel)) return; //return if invalid move
        var response = g.challenge(sender);
        msgBox(message, ":bangbang: Challenge!", response);
        //set timer for the challenged player
        turnTimer(message, g.lastPlayer, channel, challengeLength);
        break;
      case "respond":
        respondChallenge(message, sender, channel);
        break;
      case "party":
        message.channel.send(":tada: AYAYAYAYAYA :tada:").then((m) => {
          m.react("🎉");
        });
        break;
      default:
        message.channel.send(command + " is not a valid command");
        break;
    }
  }

  //non-command responses
  if (g !== -1 && !isCommand) {
    if (g.players[g.turn].id == sender.id) {
      //console.log(sender.username +" responding to type "+g.turnType);
      if (g.turnType == 0) addLetter(message, sender, channel);
      if (g.turnType == 1) respondChallenge(message, sender, channel);
    }
  }

  //owo whats this
  if (message.content.toLowerCase().search("think") != -1) message.react("🤔");
});

//utilities and functions
function checkInGame(player) {
  for (var i = 0; i < games.length; i++) {
    if (games[i].checkInGame(player)) {
      return true;
    }
  }
  return false;
}

function getGame(channelId) {
  for (var i = 0; i < games.length; i++) {
    if (channelId == games[i].channel) return games[i];
  }
  return -1;
}

function addLetter(message, sender, channel) {
  var msg = message.content;
  var letter = msg.substring(msg.indexOf(" ")+1);
  var g = getGame(channel);
  if (g == -1) return; //return if there is no game
  if (!checkMove(message, sender, channel)) return; //return if invalid move
  var response = g.addLetter(sender, letter);
  msgBox(message, response);
  var isWord = g.checkWord(allWords);
  if (isWord) {
    msgBox(message, ":octagonal_sign: Round Over - Word completed!", `\`${g.letters}\` is a word.  ${g.lastPlayer.username} loses a life.  ${g.getPlayers()[g.turn]} gets to start the next round.`);
    g.nextRound(g.lastPlayer);
    removeDeadPlayers(message, channel);
  }
  //start timer for next player's turn
  turnTimer(message, g.players[g.turn], channel, turnLength);
}

function respondChallenge(message, sender, channel) {
  var msg = message.content;
  var guess = msg.substring(msg.indexOf(" ")+1);
  var g = getGame(channel);
  if (g == -1) return; //return if there is no game
  if (!checkMove(message, sender, channel)) return; //return if invalid move
  var isWord = g.checkGuess(allWords, guess);
  if (isWord) { //challenge success
    g.nextTurn();
    msgBox(message, ":octagonal_sign: Round Over - Challenge failed!", `\`${guess}\` is a correct response to ${g.getPlayers()[g.turn]}'s challenge.  ${g.getPlayers()[g.turn]} loses a life and gets to start the next round.`);
    g.nextRound(g.players[g.turn]);
    removeDeadPlayers(message, channel);
  } else { //challenge failure
    g.nextTurn();
    msgBox(message, ":octagonal_sign: Round Over - Challenge succeeded!", `\`${guess}\` is not a correct response to ${g.getPlayers()[g.turn]}'s challenge. ${g.lastPlayer.username} loses a life, and ${g.getPlayers()[g.turn]} gets to start the next round.`);
    g.nextRound(g.lastPlayer);
    removeDeadPlayers(message, channel);
  }
}

function turnTimer(message, player, channel, time) {
  //end turn
  var g = getGame(channel);
  var turn = g.turn;
  var totalTurns = g.totalTurns;
  setTimeout(() => {
    if (getGame(channel) !== -1){//make sure game didn't end
      if (g.totalTurns == totalTurns && g.turn == turn) {
        g.nextTurn();
        g.nextRound(g.lastPlayer);
        removeDeadPlayers(message, channel);
        msgBox(message, ":octagonal_sign: Round Over - Time limit!", `${g.lastPlayer.username} loses a life because they didn't take a turn in time.  ${g.getPlayers()[g.turn]} gets to start the next round.`);
      }
    }
  },1000*time);
  //warning message
  setTimeout(() => {
    if (getGame(channel) !== -1){//make sure game didn't end
      if (g.totalTurns == totalTurns && g.turn == turn) {
        message.channel.send(`Only ${time/2} seconds left in your turn, <@${player.id}>`)
      }
    }
  },1000*time/2);
}

function checkMove(message, sender, channel) {
  var g = getGame(channel);
  if (!g.checkInGame(sender)) {
    message.channel.send("You aren't playing in this game.  Type `"+botPrefix+"join` to join!"); //check if not in game
    return false;
  }
  else if (g.getPlayerIds()[g.turn] !== sender.id) {
    message.channel.send("It is " + g.getPlayers()[g.turn]+"'s turn now."); //check if player's turn
    return false;
  }
  else if (g.players.length < 2) {
    message.channel.send("You can't play by yourself!  Find someone to type `"+botPrefix+"join` to join!"); //check if only player
    return false;
  }
  return true;
}

function removeDeadPlayers(message, channel) {
  var g = getGame(channel);
  var deadPlayers = g.removeDeadPlayers();
  var emojis = ["🥇","🥈","🥉"];//medal reactions to top finishers
  for (var i = 0; i < deadPlayers.length; i++) {
    msgBox(message, ":skull: Player out!", deadPlayers[i].username + " ran out of lives!").then((m) => {
      var playersLeft = g.players.length;
      if (emojis[playersLeft]) m.react(emojis[playersLeft]);
    });
  }
  //end game
  if (g.players.length == 1) {
    endGame(message, channel, g.players[0]);
  }
}

function endGame(message, channel, winner) {
  var g = getGame(channel);
  msgBox(message, ":trophy: VICTORY! :trophy:", `<@${winner.id}> won with ${winner.lives} lives left!`).then((m) => {
    m.react("🎉");
  });
  //delete the game instance
  for (var i = 0; i < games.length; i++) {
    if (g.channel == games[i].channel) {
      games = games.slice(0,i).concat(games.slice(i+1));
      break;
    }
  }
}

function msgBox(message, title, text) {
  if (!title) title = "";
  if (!text) text = "";
  var Embed = new Discord.MessageEmbed()
        .setColor("#87de90")
        .setTitle(title)
        .setDescription(text);
  return message.channel.send({embeds:[Embed]});
}

client.login("OTc0NzgyNjAxODkyMDgxNjg0.GRsoCE.Psj7Kyi_xcURKhGd1e74_tbZbcRZDqiwnyt1ps");