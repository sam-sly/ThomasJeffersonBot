const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} = require("discord.js");
const { readFile, writeFile } = require("../../utils/json");
const getMembersRole = require("../../utils/getMembersRole");

const MODERATOR = 3;

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
    const { value: usersRole } = await getMembersRole(interaction.member);

    if (usersRole < MODERATOR) {
      await interaction.editReply({
        content: `You don't have permission to use this commmand.`,
      });
      return;
    }

    const { games, requests } = await readFile('data/games.json');

    const gameRole = interaction.options.getRole('role');

    const index = games.findIndex((g) => g.role.id === gameRole.id);

    if (index === -1) {
      console.log('The requested role is not a game role.');
      await interaction.editReply({
        content: `${gameRole} is not a game role.`,
      });
      return;
    }

    const gameToRemove = games[index];
    const guild = interaction.guild;

    const { roles } = await readFile('data/settings.json');

    for (let member of guild.members.cache) {
      member = member[1];

      if (!member.roles.cache.find((r) => r.id === gameToRemove.role.id)) continue;

      let userHasNoGames = true;
      for (const game of games) {
        if (game.role.id !== gameToRemove.role.id && member.roles.cache.find((r) => r.id === game.role.id)) {
          userHasNoGames = false;
          break;
        }
      }
      if (userHasNoGames) await member.roles.add(roles.noGames.id);
    }

    await guild.emojis.delete(guild.emojis.cache.get(gameToRemove.emoji.id));
    await guild.roles.delete(guild.roles.cache.get(gameToRemove.role.id));
    await guild.channels.delete(guild.channels.cache.get(gameToRemove.channel.id));

    games.splice(index, 1);
    console.log(`${gameToRemove.name} has been deleted.`);

    await writeFile({ games, requests }, 'data/games.json');

    await interaction.editReply({
      content: `${gameToRemove.name} has been removed.`,
    });
  },
};
