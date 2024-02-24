const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const ButtonListener = require('../models/buttonListener');
const Game = require('../models/game');

const SILENT_FLAG = 4096;

const shift = (table, i, num) => {
  let j = table[i].length - 1;

  do {
    const move = table[i][j].splice(table[i][j].length - num, num);

    if (j < table[i].length - 1) j++;
    else { j = 0; i++; }

    table[i][j].unshift(move);
  } while (table[i][j].length > 5);

  return table;
};

const groupGames = (games) => {
  let messages = [];
  let messageOfRows = [];
  let rowOfGames = [];

  for (const game of games.sort((a, b) => a.name > b.name)) {
    rowOfGames.push(game);

    if (rowOfGames.length === 5) {
      messageOfRows.push(rowOfGames);
      rowOfGames = [];

      if (messageOfRows.length === 5) {
        messages.push(messageOfRows);
        messageOfRows = [];
      }
    }
  }
  messageOfRows.push(rowOfGames);
  messages.push(messageOfRows);

  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].slice(-1).slice(-1).toLowerCase().charAt(0) === messages[i+1][0][0].toLowerCase().charAt(0)) {
      let count = 1;
      while (messages[i].slice(-1).slice(-1-count).toLowerCase().charAt(0) === messages[i+1][0][0].toLowerCase().charAt(0)) {
        count++;
      }
      messages = shift(messages, i, count);
    }
  }

  return messages;
};

module.exports = async (guild) => {
  const games = await Game.find().exec();
  const groupedGames = groupGames(games);

  const followGamesChannel = guild.channels.cache.get(process.env.FOLLOW_GAMES_CHANNEL);
  const messagesMap = await followGamesChannel.messages.fetch();
  const messages = Array.from(messagesMap, ([id, message]) => (message)).reverse();
  messages.splice(0, 1);

  const emojis = guild.emojis.cache;

  let messageNum = 0;
  for (const message of groupedGames) {
    const actionRows = [];
    for (const row of message) {
      const buttons = [];
      for (const game of row) {
        const emoji = emojis.get(game.emojiId);

        const button = new ButtonBuilder()
          .setCustomId(game._id.toString())
          .setLabel(`${game.name}・👤 ${game.subscribers}`)
          .setStyle(ButtonStyle.Success)
          .setEmoji(emoji? `<:${emoji.name}:${emoji.id}:>` : '💠');

        buttons.push(button);
      }
      const actionRow = new ActionRowBuilder().addComponents(buttons);
      actionRows.push(actionRow);
    }

    const firstLetter = message[0][0].name.toUpperCase().charAt(0);
    const lastLetter = message[message.length-1][message[message.length-1].length-1].name.toUpperCase().charAt(0);

    const embed = new EmbedBuilder()
      .setTitle(firstLetter === lastLetter ? `${firstLetter}` : `${firstLetter}-${lastLetter}`);

    let messageSent = null;

    if (messageNum >= messages.length) {
      messageSent = await followGamesChannel.send({
        content: '',
        embeds: [ embed ],
        components: actionRows,
        flags: [ SILENT_FLAG ],
      });
      messageNum++;
    } else {
      messageSent = await messages[messageNum].edit({
        content: '',
        embeds: [ embed ],
        components: actionRows,
        flags: [ SILENT_FLAG ],
      });
    }

    for (const row of message) {
      for (const game of row) {
        const savedButton = await ButtonListener.findOne({ id: game._id.toString() });

        if (!savedButton) await ButtonListener.create({
          id: game._id.toString(),
          messageId: messageSent.id,
          callbackPath: 'followGames.js',
          callbackName: 'followGame',
          args: [ game._id ],
        });

        else {
          savedButton.messageId = messageSent.id;
          await savedButton.save();
        }
      }
    }
  }
  
  return;
};
