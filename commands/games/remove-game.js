const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} = require("discord.js");
const Game = require("../../models/game.js");
const ButtonListener = require('../../models/buttonListener');
const getMembersRole = require("../../utils/getMembersRole");
const refreshFollowGames = require("../../handlers/refreshFollowGames.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-game')
    .setDescription('Remove a game from the server, deleting the emoji, role, and channel.')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('The role of the game to remove.')
        .setRequired(true)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    const { value: usersRole, rank } = await getMembersRole(interaction.member);

    if (usersRole < rank.moderator) {
      await interaction.editReply({
        content: `You don't have permission to use this commmand.`,
      });
      return;
    }
    
    const gameRole = interaction.options.getRole('role');

    const gameToRemove = await Game.findOne({ roleId: gameRole.id }).exec();
    console.log(gameToRemove);

    if (!gameToRemove) {
      console.log('The requested role is not a game role.');
      await interaction.editReply({
        content: `${gameRole} is not a game role.`,
      });
      return;
    }

    const guild = interaction.guild;

    for (let member of guild.members.cache) {
      member = member[1];

      if (!member.roles.cache.find((r) => r.id === gameToRemove.roleId)) continue;
    }

    await guild.emojis.delete(guild.emojis.cache.get(gameToRemove.emojiId));
    await guild.roles.delete(guild.roles.cache.get(gameToRemove.roleId));
    await guild.channels.delete(guild.channels.cache.get(gameToRemove.channelId));

    await Game.deleteOne({ roleId: gameRole.id }).exec();

    await ButtonListener.deleteMany({ id: gameToRemove._id }).exec();

    refreshFollowGames(guild);
    console.log(`${gameToRemove.name} has been deleted.`);

    await interaction?.editReply({
      content: `${gameToRemove.name} has been removed.`,
    });
  },
};
