# LetterPlay
My discord bot for the game LetterPlay!
LetterPlay is a game all about letters!  Players each start with 3 lives and take turns.
Each turn, a player has two options: add a letter to a communal word or challenge the last move.  
Each player must make their turn within 30 seconds, or else they'll lose a life.
You're out once all your lives are gone, and the last player standing wins!

#Adding the Bot
Invite LetterPlay to your server!
https://discord.com/api/oauth2/authorize?client_id=974782601892081684&permissions=10304&scope=bot

Run the bot server via Replit
https://replit.com/@ArchimedesLi/LetterPlay-Discord-Bot

#Commands and rules
L!start starts a new game.  Only one game can be played per discord channel.
L!join joins an existing game.  You can only join a game before a player has lost a life.
L!add <letter> adds a letter to the word.  If the player makes a complete word when adding a letter, they lose a life and the word is reset.  During you're turn, you can send your letter without typing the command.
L!challenge challenges the last player's move.  In a challenge, the last player to make a move must respond by completing the communal word to form a real word.  If a real word is made, the challenge fails and the challenger loses a life, but if a real word is not made, then the challenge succeeds and the challenged player loses a life instead.
L!respond is used to respond to a player's challenge.  Once challenged, you can just type your word without the command.
