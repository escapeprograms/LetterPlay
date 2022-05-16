//word list: http://www.mieliestronk.com/corncob_lowercase.txt
const Discord = require("discord.js");
const _ = require("lodash");
const game = require("./game.js");
var fs = require("fs");
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]});

var botPrefix = "l!";
var games = [];

//get word list
var rawdata = fs.readFileSync('./words_alpha.txt', {encoding:'utf8', flag:'r'});
var allWords = rawdata.split(/\r?\n/);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//easter egg
client.on('message', message => {
    if (message.content.toLowerCase().search("think")!=-1){
    message.react('🤔')
            .catch(console.error);}
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
      case "start"://starts a new game
        //check if player is already playing
        if (checkInGame(sender) == false){
          //check if there is already a game running
          if (g == -1) {
            message.channel.send("New game started!  Type `"+botPrefix+"join` to join!")
            games.push(_.cloneDeep(new game.Game(channel)));
            games[games.length-1].addPlayer(sender);
          }
          else {
            message.channel.send("There is already a game running in this channel.");
          }
        }
        else {
          message.channel.send("You are already playing!");
        }
        break;
      case "join":
        if (checkInGame(sender) == false){
          if (g !== -1) {
            message.channel.send("You joined the game with "+ g.getPlayers())
            g.addPlayer(sender);
          }
          else {
            message.channel.send("There is no game to join here.");
          }
        }
        else {
          message.channel.send("You are already playing!");
        }
        break;
      case "add":
        addLetter(message, sender, channel);
        break;
      case "stop":
        g.nextRound();
        break;
      case "lives":
        if (g == -1) break; //return if there is no game
        var response = "Player lives:\n";
        g.players.forEach((p)=>{
          response += p.username + ": " + p.lives + " lives\n"
        });
        message.channel.send(response);
        break;
      case "challenge":
        if (g == -1) break; //return if there is no game
        var response = g.challenge(sender);
        message.channel.send(response);
        break;
      case "respond":
        respondChallenge(message, sender, channel);
        break;
      case "embed":
        var Embed = new Discord.MessageEmbed()
        .setTitle("YO")
        .setDescription("``TEXT GOES HERE``");
        message.channel.send({embeds:[Embed]});
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
});

//utilities
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
  var response = g.addLetter(sender, letter);
  message.channel.send(response);
  var isWord = g.checkWord(allWords);
  if (isWord) {
    message.channel.send(`Round Over!  \`${g.letters}\` is a word.  ${g.lastPlayer.username} loses a life.  ${g.getPlayers()[g.turn]} gets to start the next round.`);
    g.nextRound(g.lastPlayer);
  }
}

function respondChallenge(message, sender, channel) {
  var msg = message.content;
  var guess = msg.substring(msg.indexOf(" ")+1);
  var g = getGame(channel);
  if (g == -1) return; //return if there is no game
  var isWord = g.checkGuess(allWords, guess);
  if (isWord) { //challenge success
    message.channel.send(`Round Over!  \`${guess}\` is a correct response to ${g.getPlayers()[g.turn]}'s challenge.  ${g.getPlayers()[g.turn]} loses a life, but gets to start the next round.`);
    g.nextRound(g.players[g.turn]);
  } else { //challenge failure
    message.channel.send(`Round Over!  \`${guess}\` is not a correct response to ${g.getPlayers()[g.turn]}'s challenge. ${g.lastPlayer.username} loses a life, and ${g.getPlayers()[g.turn]} gets to start the next round.`);
    g.nextRound(g.lastPlayer);
  }
}

client.login('OTc0NzgyNjAxODkyMDgxNjg0.GRsoCE.Psj7Kyi_xcURKhGd1e74_tbZbcRZDqiwnyt1ps');