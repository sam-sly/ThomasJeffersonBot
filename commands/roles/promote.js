const {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
} = require("discord.js");
const getMembersRole = require("../../utils/getMembersRole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a user to the next role up.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to promote.')
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
    const { value: promotersRole } = await getMembersRole(interaction.member);

    let newRole;

    switch (usersCurrentRole) {
      case rank.owner:
        await interaction.editReply({
          content: `${user} can't be promoted higher than <@&${process.env.OWNER_ROLE_ID}>.`,
        });
        return;
      case rank.admin:
        await interaction.editReply({
          content: `${user} can't be promoted higher than <@&${process.env.ADMIN_ROLE_ID}>.`,
        });
        return;
      case rank.moderator:
        if (promotersRole < rank.admin) {
          await interaction.editReply({
            content: `You don't have permission to promote ${user}.`,
          });
          return;
        }
        await user.roles.add(process.env.ADMIN_ROLE_ID);
        await user.roles.remove(process.env.MODERATOR_ROLE_ID);
        newRole = process.env.ADMIN_ROLE_ID;
        break;
      case rank.member:
        if (promotersRole < rank.moderator) {
          await interaction.editReply({
            content: `You don't have permission to promote ${user}.`,
          });
          return;
        }
        await user.roles.add(process.env.MODERATOR_ROLE_ID);
        newRole = process.env.MODERATOR_ROLE_ID;
        break;
      case rank.guest:
        if (promotersRole < rank.moderator) {
          await interaction.editReply({
            content: `You don't have permission to promote ${user}.`,
          });
          return;
        }
        await user.roles.add(process.env.MEMBER_ROLE_ID);
        await user.roles.remove(process.env.GUEST_ROLE_ID);
        newRole = process.env.MEMBER_ROLE_ID;
        break;
      case rank.newJoin:
      default:
        await interaction.editReply({
          content: `${user} needs to use the \`/get-started\` command to get promoted.`,
        });
        return;
    }
    
    console.log(`${user.displayName} has been promoted from ${usersCurrentRole}.`); 
    await interaction.editReply({
      content: `${user} has been promoted to <@&${newRole}>.`,
    });
  },
};
