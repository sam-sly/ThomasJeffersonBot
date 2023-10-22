const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  ButtonStyle,
  Colors,
  TextInputStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");
const { readFile } = require("../../utils/json");
const getMembersRole = require("../../utils/getMembersRole");
const addGame = require("../../handlers/addGame");
const verifyImageForEmoji = require("../../utils/verifyImageForEmoji");

const MEMBER = 2;
const MODERATOR = 3;

module.exports = {
  data: new SlashCommandBuilder()
  .setName('add-game')
  .setDescription('Add a game channel and role to the server.')
  .addStringOption(option =>
    option
    .setName('name')
    .setDescription('The name of the game to add.')
    .setRequired(true)
  )
  .addStringOption(option =>
    option
    .setName('icon-url')
    .setDescription('The url to an image of the game\'s icon.')
  ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    const { value: usersRole } = await getMembersRole(interaction.member);

    if (usersRole < MEMBER) {
      await interaction.editReply({
        content: `You don't have permission to use this command.`,
      });
      return;
    }

    const { games } = await readFile('data/games.json');
    const { roles, channels } = await readFile('data/settings.json');

    let gameName = interaction.options.getString('name').trim();
    let iconUrl = interaction.options.getString('icon-url')?.trim() ?? null;

    let emojiVerification = {
      status: false,
      message: '❌ No emoji url provided.',
    }

    const existingGame = games.find((g) => {
      const existing = g.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const search = gameName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return existing === search;
    });

    if (existingGame) {
      await interaction.member.roles.add(existingGame.role.id);

      if (interaction.member.roles.cache.find((r) => r.id === roles.noGames.id)) {
        await interaction.member.roles.remove(roles.noGames.id);
      }

      await interaction.editReply({
        content: `${existingGame.name} already exists. You have been assigned the <@&${existingGame.role.id}> role and you can view <#${existingGame.channel.id}>.`,
      });
      return;
    }

    if (iconUrl) {
      emojiVerification = await verifyImageForEmoji(iconUrl);
    }

    if (usersRole >= MODERATOR) {
      if (!emojiVerification.status) {
        await interaction.editReply({
          content: `Must provide a valid emoji for the game.\n\n${emojiVerification.message}`,
        });
        return;
      }
      const newGame = await addGame(
        gameName,
        iconUrl,
        games,
        channels,
        interaction.guild,
      );
      if (newGame.error) {
        interaction.editReply({
          content: newGame.error.message,
        });
      }
      await interaction.editReply({
        content: `${gameName} has been added.\n${newGame.emoji}${newGame.role}\n${newGame.channel}`,
      });
      return;
    }

    // Otherwise, send request for game
    const moderatorChannel = interaction.guild.channels.cache.get(channels.moderator.id);
    /**
     * @type {Message} message
     */
    const message = await moderatorChannel.send({
      embeds: [{
        title: 'Request to add game:',
        description: 'Loading...',
      }],
    });
    await interaction.editReply({
      content: `Your request for ${gameName} has been sent.\n\n**Do not dissmiss this message.**\n\nIf you dismiss this message, your request will be cancelled.`,
    });

    while (true) {
      const requestEmbed = new EmbedBuilder()
        .setTitle(`Request to add game:`)
        .setAuthor({ name: interaction.member.displayName, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(' ')
        .addFields(
          { name: ' ', value: ' ' },
          { name: `\n💠 ${gameName}`, value: ' ' },
          { name: ' ', value: ' ' },
          {
            name: ' ',
            value: `URL for Emoji\n${(iconUrl)? iconUrl:'None.'}\n\n${emojiVerification.message}`,
          }
        );
      if (iconUrl && emojiVerification.status) {
        requestEmbed.setThumbnail(iconUrl);
      }

      const editButton = new ButtonBuilder()
        .setCustomId('edit')
        .setLabel('Edit 📝')
        .setStyle(ButtonStyle.Primary);

      const approveButton = new ButtonBuilder()
        .setCustomId('approve')
        .setLabel('Approve 👍')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!emojiVerification.status);

      const denyButton = new ButtonBuilder()
        .setCustomId('deny')
        .setLabel('Deny 👎')
        .setStyle(ButtonStyle.Danger);

      const buttons = new ActionRowBuilder()
        .addComponents(editButton, approveButton, denyButton);

      await message.edit({
        content: '',
        embeds: [ requestEmbed ],
        components: [ buttons ],
      });

      const input = await message.awaitMessageComponent();

      if (input.customId === 'deny') {
        await input.update({ fetchReply: false });
        const denyEmbed = new EmbedBuilder()
          .setTitle(`👎 Request for 💠 ${gameName} has been denied.`)
          .setDescription(' ')
          .setColor(Colors.Red);
        if (iconUrl && emojiVerification.status) {
          denyEmbed.setThumbnail(iconUrl);
        }
        await message.edit({
          content: '',
          embeds: [ denyEmbed ],
          components: [],
        });
        if (await interaction.fetchReply()) {
          await interaction.editReply({
            content: `${interaction.member}\n\nYour request for ${gameName} has been denied. 👎`,
          });
        }
        return;
      }
      else if (input.customId === 'approve') {
        await input.update({ fetchReply: false });
        const newGame = await addGame(
          gameName,
          iconUrl,
          games,
          channels,
          interaction.guild,
        );
        if (newGame.error) {
          await interaction.editReply({
            content: '❌ An error has ocurred during this command.',
          });
          await message.edit({
            content: `❌ Error: ${newGame.error.message}`,
            components: [],
          });
          return;
        }
        await interaction.member.roles.add(newGame.role);
        if (interaction.member.roles.cache.find((r) => r.id === roles.noGames.id)) {
          await interaction.member.roles.remove(roles.noGames.id);
        }
        const approveEmbed = new EmbedBuilder()
          .setTitle(`👍 Request for 💠 ${gameName} has been approved.`)
          .setDescription(' ')
          .setColor(Colors.Green);
        if (iconUrl && emojiVerification.status) {
          approveEmbed.setThumbnail(iconUrl);
        }
        await message.edit({
          content: '',
          embeds: [ approveEmbed ],
          components: [],
        });
        if (await interaction.fetchReply()) {
          await interaction?.editReply({
            content: `${interaction.member}\n\nYour request for ${gameName} has been approved. 👍\n\nYou have been assigned the ${newGame.role} role and you can view ${newGame.channel}.`,
          });
        }
        return;
      }
      // Otherwise, input.customId === 'edit'
      const modal = new ModalBuilder()
        .setCustomId('editModal')
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
        .setPlaceholder('Paste image url here...')
        .setRequired(true)
        .setLabel('Emoji URL');

      if (iconUrl) {
        iconUrlInput.setValue(iconUrl);
      }

      modal.addComponents(
        new ActionRowBuilder().addComponents(gameNameInput),
        new ActionRowBuilder().addComponents(iconUrlInput),
      );

      await input.showModal(modal);
      await message.edit({
        content: `If you click \`Cancel\` on the input window, you will have to wait for the **2 minute** timeout before interacting again.\n\n⏳ **Please wait before performing another action...**`,
        components: [],
      });

      var modalResponse;
      try {
        /**
         * @type {ModalSubmitInteraction} modalResponse
         */
        modalResponse = await input.awaitModalSubmit({
          time: 120000,
        });
      } catch (error) {
        if (error.message.endsWith('time')) {
          message.edit({
            content: 'If you click \`Cancel\` on the input window, you will have to wait for the **2 minute** timeout before interacting again.\n\n⌛️ **Continue**',
          });
          continue;
        }
      }

      gameName = modalResponse.fields.getTextInputValue('gameNameInput');
      iconUrl = modalResponse.fields.getTextInputValue('iconUrlInput');

      modalResponse.update({ fetchReply: false });

      emojiVerification = await verifyImageForEmoji(iconUrl);
    }
  },
};
