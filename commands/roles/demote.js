const {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
} = require("discord.js");
const Game = require("../../models/game.js");
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
    const { value: usersCurrentRole, rank } = await getMembersRole(user);
    const { value: demotersRole } = await getMembersRole(interaction.member);

    let newRole;

    switch (usersCurrentRole) {
      case rank.admin:
        if (demotersRole < rank.owner) {
          await interaction.editReply({
            content: `You don't have permission to demote ${user}.`,
          });
          return;
        }
        await user.roles.add(process.env.MODERATOR_ROLE_ID);
        await user.roles.remove(process.env.ADMIN_ROLE_ID);
        newRole = process.env.MODERATOR_ROLE_ID;
        break;
      case rank.moderator:
        if (demotersRole < rank.admin) {
          await interaction.editReply({
            content: `You don't have permission to demote ${user}.`,
          });
          return;
        }
        await user.roles.remove(process.env.MODERATOR_ROLE_ID);
        newRole = process.env.MEMBER_ROLE_ID;
        break;
      case rank.member:
        if (demotersRole < rank.moderator) {
          await interaction.editReply({
            content: `You don't have permission to demote ${user}.`,
          });
          return;
        }

        const games = await Game.find().exec();
        for (const game of games) {
          if (user.roles.cache.find((r) => r.id === game.roleId)){
            await user.roles.remove(game.role.id);
            console.log(`Removed ${game.name} from ${user.displayName}.`);
          }
        }

        await user.roles.add(process.env.GUEST_ROLE_ID);
        await user.roles.remove(process.env.MEMBER_ROLE_ID);
        newRole = process.env.GUEST_ROLE_ID;
        break;
      case rank.guest:
        await interaction.editReply({
          content: `${user} can't be demoted lower than <@&${process.env.GUEST_ROLE_ID}>.`,
        });
        return;
      case rank.newJoin:
      default:
        console.log('No roles found.');
        await interaction.editReply({
          content: `${user} has no roles.`,
        });
        return;
    }

    console.log(`${user.displayName} has been demoted from ${usersCurrentRole}.`);
    await interaction.editReply({
      content: `${user} has been demoted to <@&${newRole}>.`,
    });
  },
};
