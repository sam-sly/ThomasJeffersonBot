const {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
  Role,
} = require("discord.js");
const { readFile } = require("../../utils/json");
const getMembersRole = require("../../utils/getMembersRole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demote')
    .setDescription('Demote a user to the next role down.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to demote.')
        .setRequired(true)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    /**
     * @type {GuildMember} user
     */
    const user = interaction.options.getMember('user');
    const { role: usersCurrentRole } = await getMembersRole(user);
    const { role: demotersRole } = await getMembersRole(interaction.member);

    let newRole;
    const { roles } = await readFile('data/settings.json');

    switch (usersCurrentRole.id) {
      case roles.admin.id:
        if (interaction.member.id !== interaction.guild.ownerId) {
          await interaction.editReply({
            content: `You don't have permission to demote ${user}.`,
          });
          return;
        }
        await user.roles.remove(roles.admin.id);
        await user.roles.add(roles.moderator.id);
        newRole = roles.moderator.id;
        break;
      case roles.moderator.id:
        if (![ roles.admin.id ].includes(demotersRole.id)) {
          await interaction.editReply({
            content: `You don't have permission to demote ${user}.`,
          });
          return;
        }
        await user.roles.remove(roles.moderator.id);
        newRole = roles.member.id;
        break;
      case roles.member.id:
        if (![ roles.admin.id, roles.moderator.id ].includes(demotersRole.id)) {
          await interaction.editReply({
            content: `You don't have permission to demote ${user}.`,
          });
          return;
        }
        await user.roles.remove(roles.member.id);
        
        if (user.roles.cache.find((r) => r.id === roles.noGames.id)) {
          await user.roles.remove(roles.noGames.id);
        }
        else {
          const { games } = await readFile('data/games.json');
          for (const game of games) {
            if (user.roles.cache.find((r) => r.id === game.role.id)){
              await user.roles.remove(game.role.id);
              console.log(`Removed ${game.name} from ${user.displayName}.`);
            }
          }
        }
        await user.roles.add(roles.guest.id);
        newRole = roles.guest.id;
        break;
      case roles.guest.id:
        await interaction.editReply({
          content: `${user} can't be demoted lower than <@&${roles.guest.id}>.`,
        });
        return;
      case roles.newJoin.id:
        await interaction.editReply({
          content: `${user} can't be demoted lower than <@&${roles.newJoin.id}>.`,
        });
        return;
      default:
        console.log('No roles found.');
        await interaction.editReply({
          content: `${user} has no roles.`,
        });
        return;
    }

    console.log(`${user.displayName} has been demoted from ${usersCurrentRole.name}.`);
    await interaction.editReply({
      content: `${user} has been demoted to <@&${newRole}>.`,
    });
  },
};
