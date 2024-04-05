const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const ButtonListener = require('../models/buttonListener');
const Game = require('../models/game');

const SILENT_FLAG = 4096;

const shift = (messages, i, num) => {
  let j = messages[i].length - 1;

  do {
    const move = messages[i][j].splice(messages[i][j].length - num, num);

    if (j < messages[i].length - 1) j++;
    else { j = 0; i++; }

    messages[i][j].unshift(move);
  } while (messages[i][j].length > 5);

  return messages;
};

const groupGames = (games) => {
  let messages = [];
  let messageOfRows = [];
  let rowOfGames = [];

  const sortedGames = games.sort((a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  for (const game of sortedGames) {
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

  if (rowOfGames.length > 0) {
    messageOfRows.push(rowOfGames);
    messages.push(messageOfRows);
  }

  console.log(messages);

  // for (let i = 0; i < messages.length - 1; i++) {
  //   const lastRowOfThisMessage = messages[i][messages[i].length-1];
  //   const lastGameOfThisMessage = lastRowOfThisMessage[lastRowOfThisMessage.length-1].name;
  //   const firstGameOfNextMessage = messages[i+1][0][0].name;
  //   const firstLetterOfLastGameOfThisMessage = lastGameOfThisMessage.toLowerCase().charAt(0);
  //   const firstLetterOfFirstGameOfNextMessage = firstGameOfNextMessage.toLowerCase().charAt(0);
  //   console.log(lastGameOfThisMessage, firstGameOfNextMessage);
  //   if (firstLetterOfLastGameOfThisMessage === firstLetterOfFirstGameOfNextMessage) {
  //     let count = 0;
  //     let firstLetterOfNextGameBack;
  //     do {
  //       count++;
  //       const nextGameBack = lastRowOfThisMessage[lastRowOfThisMessage.length-count-1].name;
  //       console.log(nextGameBack);
  //       firstLetterOfNextGameBack = nextGameBack.toLowerCase().charAt(0);
  //     } while (firstLetterOfNextGameBack === firstLetterOfFirstGameOfNextMessage);
  //     messages = shift(messages, i, count);
  //   }
  // }
  //
  // console.log(messages);

  return messages;
};

module.exports = async (guild) => {
  console.log('Refreshing follow-games...')

  const games = await Game.find().exec();
  const groupedGames = groupGames(games);

  const followGamesChannel = guild.channels.cache.get(process.env.FOLLOW_GAMES_CHANNEL);
  const messagesMap = await followGamesChannel.messages.fetch();
  const messages = Array.from(messagesMap, ([_, message]) => (message)).reverse();
  console.log(messages);

  console.log('Updating follow-games header message...');

  const activeGameRequestsButtons = await ButtonListener.find({ callbackPath: 'followGames', callbackName: 'approveRequest' }).exec();
  const activeGameRequests = activeGameRequestsButtons.map((button) => button.args[0]);

  let introMessage = `# ⭐️ Welcome to the Game Selection Hub! ⭐️\n`
    .concat(`## 💠 Select Your Games\n`)
    .concat(`**Browse the list below** and click on the buttons corresponding to the games you play. Gain access to exclusive channels and stay up-to-date with the latest discussions and updates.\n\n`)
    .concat(`## 📮 Request New Games\n`)
    .concat(`**Can't find your favorite game?** 🤔 Click the button below to request its addition! Our moderators will review your suggestion and add it if it aligns with our community's interests.`)
    .concat(`\n​`);

  if (activeGameRequests.length > 0) {
    introMessage = introMessage.concat(`\n🚩 **Active Game Requests:**\n`);
    for (const game of activeGameRequests) introMessage = introMessage.concat(`- ${game}\n`);
  }

  const newGameButton = new ButtonBuilder()
    .setCustomId('request-new-game')
    .setLabel('➕ Request New Game')
    .setStyle(ButtonStyle.Success);

  const actionRow = new ActionRowBuilder().addComponents(newGameButton);
  let headerMessage;

  if (messages.length === 0) {
    headerMessage = await followGamesChannel.send({
      content: introMessage,
      embeds: [],
      components: [ actionRow ],
      flags: [ SILENT_FLAG ],
    });

    await ButtonListener.create({
      id: 'request-new-game',
      messageId: headerMessage.id,
      callbackPath: 'followGames',
      callbackName: 'createRequest',
    });
  } else {
    headerMessage = await messages[0].edit({
      content: introMessage,
      embeds: [],
      components: [ actionRow ],
      flags: [ SILENT_FLAG ],
    });

    const newGameListener = await ButtonListener.findOne({ id: 'request-new-game', messageId: headerMessage.id }).exec();

    if (!newGameListener) {
      await ButtonListener.create({
        id: 'request-new-game',
        messageId: headerMessage.id,
        callbackPath: 'followGames',
        callbackName: 'createRequest',
      });
    }
  }

  messages.splice(0, 1);

  console.log('Updating game buttons...');

  const emojis = guild.emojis.cache;

  let messageNum = 0;
  for (const message of groupedGames) {
    if (message[0].length === 0) break;

    const actionRows = [];
    for (const row of message) {
      const buttons = [];
      for (const game of row) {
        const emoji = emojis.get(game.emojiId);

        const button = new ButtonBuilder()
          .setCustomId(game._id.toString())
          .setLabel(`${game.name}・👤 ${game.subscribers}`)
          .setStyle(ButtonStyle.Secondary)
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
      messageNum++;
    }

    for (const row of message) {
      for (const game of row) {
        const savedButton = await ButtonListener.findOne({ id: game._id.toString() });

        if (!savedButton) await ButtonListener.create({
          id: game._id.toString(),
          messageId: messageSent.id,
          callbackPath: 'followGames',
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

  for (let i = messageNum; i < messages.length; i++) {
    await messages[i].delete();
  }
  
  return;
};
