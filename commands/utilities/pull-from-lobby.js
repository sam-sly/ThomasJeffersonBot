const {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
} = require("discord.js");
const { readFile } = require("../../utils/json");
const getMembersRole = require("../../utils/getMembersRole");

const MEMBER = 2;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pull-from-lobby')
    .setDescription('Move a user from the lobby voice channel to the voice channel you are in.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to move.')
        .setRequired(true)
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

    const targetChannel = interaction.member.voice.channel;

    if (!targetChannel) {
      await interaction.editReply({
        content: `You need to be connected to a voice channel to use this command.`,
      });
      return;
    }

    /**
     * @type {GuildMember} userToMove
     */
    const userToMove = interaction.options.getMember('user');

    const { channels } = await readFile('data/settings.json');

    if (userToMove.voice.channel === null || userToMove.voice.channel.id !== channels.lobby.id) {
      await interaction.editReply({
        content: `${userToMove} is not connected to <#${channels.lobby.id}>.`,
      });
      return;
    }

    await userToMove.voice.setChannel(targetChannel);
    console.log(`Moved ${userToMove} to ${targetChannel}.`);

    await interaction.deleteReply();
  },
};
