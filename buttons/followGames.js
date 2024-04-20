const {
  EmbedBuilder,
  ModalBuilder,
  Message,
  ButtonStyle,
  Colors,
  TextInputStyle,
  ButtonBuilder,
  ActionRowBuilder,
  TextInputBuilder,
} = require("discord.js");
const Game = require("../models/game.js");
const ButtonListener = require('../models/buttonListener');
const refreshFollowGames = require("../handlers/refreshFollowGames.js");
const addGame = require("../handlers/addGame");
const verifyImageForEmoji = require("../utils/verifyImageForEmoji");

const notify = async (interaction, message) => {
  const embed = new EmbedBuilder()
    .setDescription(message);

  await interaction.reply({
    embeds: [ embed ],
    ephemeral: true,
  });

  setTimeout(async () => {
    await interaction.deleteReply();
  }, 5_000);

  return;
};

const createRequestEmbedAndButtons = async (memberId, message, gameName, iconUrl) => {
  const member = await message.guild.members.fetch(memberId);

  const emojiVerification = iconUrl
    ? await verifyImageForEmoji(iconUrl)
    : { status: false, message: '❌ No emoji url provided.' };

  const requestEmbed = new EmbedBuilder()
    .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
    .setDescription(`## Request to Add Game\n`
      .concat(`### 💠 ${gameName}\n`)
      .concat(`${iconUrl? `Emoji URL: ${iconUrl}\n` : '​'}\n${emojiVerification.message}`));

  if (iconUrl && emojiVerification.status) requestEmbed.setThumbnail(iconUrl);

  const editButton = new ButtonBuilder()
    .setCustomId('edit')
    .setLabel('Edit 📝')
    .setStyle(ButtonStyle.Primary);

  await ButtonListener.create({
    id: editButton.data.custom_id,
    messageId: message.id,
    callbackPath: 'followGames',
    callbackName: 'editRequest',
    args: [gameName, iconUrl, memberId],
  });

  const approveButton = new ButtonBuilder()
    .setCustomId('approve')
    .setLabel('Approve 👍')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!emojiVerification.status);

  await ButtonListener.create({
    id: approveButton.data.custom_id,
    messageId: message.id,
    callbackPath: 'followGames',
    callbackName: 'approveRequest',
    args: [gameName, iconUrl, memberId]
  });

  const denyButton = new ButtonBuilder()
    .setCustomId('deny')
    .setLabel('Deny 👎')
    .setStyle(ButtonStyle.Danger);

  await ButtonListener.create({
    id: denyButton.data.custom_id,
    messageId: message.id,
    callbackPath: 'followGames',
    callbackName: 'denyRequest',
    args: [gameName]
  });

  const buttons = new ActionRowBuilder()
    .addComponents(editButton, approveButton, denyButton);

  return { requestEmbed, buttons };
}

module.exports = new Map([
  ['followGame', async (interaction, gameId) => {
    const game = await Game.findById(gameId).exec();

    console.log(`💠 ${game.name} button clicked by ${interaction.member.displayName}.`);

    if (!game) {
      notify(interaction, `❌ **Game not found.**`);
      return;
    }

    const role = interaction.guild.roles.cache.get(game.roleId);

    if (!role) {
      notify(interaction, `❌ **Role not found.**`);
      return;
    }

    const emoji = interaction.guild.emojis.cache.get(game.emojiId);

    if (interaction.member.roles.cache.has(game.roleId)) {
      await interaction.member.roles.remove(game.roleId);

      game.subscribers--;
      await game.save();

      notify(interaction, `⛔️ Stopped following ${emoji} **${game.name}**.`);
    } else {
      await interaction.member.roles.add(game.roleId);

      game.subscribers++;
      await game.save();

      notify(interaction, `⭐️ Now following ${emoji} **${game.name}**.`);
    }

    refreshFollowGames(interaction.guild);
  }],
  ['createRequest', async (interaction) => {
    const modal = new ModalBuilder()
      .setCustomId('createRequest')
      .setTitle('Request New Game');
      
    const gameNameInput = new TextInputBuilder()
      .setCustomId('gameNameInput')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setLabel('Game');

    const iconUrlInput = new TextInputBuilder()
      .setCustomId('iconUrlInput')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('(Optional) You can paste a URL to an image for the game\'s emoji here...')
      .setRequired(false)
      .setLabel('Emoji URL');

    modal.addComponents(
      new ActionRowBuilder().addComponents(gameNameInput),
      new ActionRowBuilder().addComponents(iconUrlInput),
    );

    await interaction.showModal(modal);

    var modalResponse;
    try {
      /**
       * @type {ModalSubmitInteraction} modalResponse
       */
      modalResponse = await interaction.awaitModalSubmit({
        time: 120000,
      });
    } catch (error) {
      // If the user doesn't respond in time
      return;
    }

    const gameName = modalResponse.fields.getTextInputValue('gameNameInput');
    const iconUrl = modalResponse.fields.getTextInputValue('iconUrlInput');

    modalResponse.update({ fetchReply: false });

    const games = await Game.find().exec();

    const existingGame = games.find((g) => {
      const existing = g.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const search = gameName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return existing === search;
    });

    if (existingGame) {
      await interaction.member.roles.add(existingGame.roleId);

      // await interaction.editReply({
      //   content: `${existingGame.name} already exists. You have been assigned the <@&${existingGame.roleId}> role and you can view <#${existingGame.channelId}>.`,
      // });
      return;
    }

    const moderatorChannel = interaction.guild.channels.cache.get(process.env.MODERATOR_CHANNEL);
    const message = await moderatorChannel.send({ content: '*Loading...*', });

    const { requestEmbed, buttons } = await createRequestEmbedAndButtons(interaction.member, message, gameName, iconUrl);

    await message.edit({
      content: '',
      embeds: [ requestEmbed ],
      components: [ buttons ],
    });

    await refreshFollowGames(interaction.guild);
  }],
  ['editRequest', async (interaction, gameName, iconUrl, memberId) => {
    const modal = new ModalBuilder()
      .setCustomId('editRequest')
      .setTitle('Edit Game Request');
      
    const gameNameInput = new TextInputBuilder()
      .setCustomId('gameNameInput')
      .setStyle(TextInputStyle.Short)
      .setValue(gameName)
      .setRequired(true)
      .setLabel('Game');

    const iconUrlInput = new TextInputBuilder()
      .setCustomId('iconUrlInput')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(iconUrl)
      .setPlaceholder('Paste a URL to an image for the game\'s emoji here...')
      .setRequired(false)
      .setLabel('Emoji URL');

    modal.addComponents(
      new ActionRowBuilder().addComponents(gameNameInput),
      new ActionRowBuilder().addComponents(iconUrlInput),
    );

    await interaction.showModal(modal);

    var modalResponse;
    try {
      /**
       * @type {ModalSubmitInteraction} modalResponse
       */
      modalResponse = await interaction.awaitModalSubmit({
        time: 120000,
      });
    } catch (error) {
      // If the user doesn't respond in time
      return;
    }

    const gameNameEdit = modalResponse.fields.getTextInputValue('gameNameInput');
    const iconUrlEdit = modalResponse.fields.getTextInputValue('iconUrlInput');

    modalResponse.update({ fetchReply: false });

    await ButtonListener.deleteMany({ messageId: interaction.message.id });

    const member = await interaction.guild.members.fetch(memberId);
    const { requestEmbed, buttons } = await createRequestEmbedAndButtons(member, interaction.message, gameNameEdit, iconUrlEdit);

    await interaction.message.edit({
      content: '',
      embeds: [ requestEmbed ],
      components: [ buttons ],
    });
  }],
  ['approveRequest', async (interaction, gameName, iconUrl, memberId) => {
    const member = await interaction.guild.members.fetch(memberId);
    const newGame = await addGame(gameName, iconUrl, interaction.guild);

    if (newGame.error) {
      notify(interaction, `❌ **Error creating game.**`);
      interaction.update();
      return;
    }

    await interaction.update({ fetchReply: false });

    await member.roles.add(newGame.role);
    const gameJustAdded = await Game.findOne({ roleId: newGame.role.id }).exec();
    gameJustAdded.subscribers++;
    await gameJustAdded.save();

    await refreshFollowGames(interaction.guild);

    const approveEmbed = new EmbedBuilder()
      .setDescription(`### 👍 Request for 💠 ${gameName} has been approved.\nApproved by ${interaction.member.displayName}.`)
      .setColor(Colors.Green)
      .setThumbnail(iconUrl);

    await ButtonListener.deleteMany({ messageId: interaction.message.id });

    await interaction.message.edit({
      content: '',
      embeds: [ approveEmbed ],
      components: [],
    });
  }],
  ['denyRequest', async (interaction, gameName) => {
    const denyEmbed = new EmbedBuilder()
      .setDescription(`### 👎 Request for 💠 ${gameName} has been denied.\nDenied by ${interaction.member.displayName}.`)
      .setColor(Colors.Red);

    await ButtonListener.deleteMany({ messageId: interaction.message.id });
    await refreshFollowGames(interaction.guild);

    await interaction.message.edit({
      content: '',
      embeds: [ denyEmbed ],
      components: [],
    });
  }],
]);
