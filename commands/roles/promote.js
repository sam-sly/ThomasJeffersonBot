const {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
} = require("discord.js");
const { readFile } = require("../../utils/json");
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
    const { role: usersCurrentRole } = await getMembersRole(user);
    const { role: promotersRole } = await getMembersRole(interaction.member);

    let newRole;
    const { roles } = await readFile('data/settings.json');

    switch (usersCurrentRole.id) {
      case roles.admin.id:
        await interaction.editReply({
          content: `${user} can't be promoted higher than <@&${roles.admin.id}>.`,
        });
        return;
      case roles.moderator.id:
        if (![ roles.admin.id ].includes(promotersRole.id)) {
          await interaction.editReply({
            content: `You don't have permission to promote ${user}.`,
          });
          return;
        }
        await user.roles.remove(roles.moderator.id);
        await user.roles.add(roles.admin.id);
        newRole = roles.admin.id;
        break;
      case roles.member.id:
        if (![ roles.admin.id ].includes(promotersRole.id)) {
          await interaction.editReply({
            content: `You don't have permission to promote ${user}.`,
          });
          return;
        }
        await user.roles.add(roles.moderator.id);
        newRole = roles.moderator.id;
        break;
      case roles.guest.id:
        if (![ roles.admin.id, roles.moderator.id ].includes(promotersRole.id)) {
          await interaction.editReply({
            content: `You don't have permission to promote ${user}.`,
          });
          return;
        }
        await user.roles.remove(roles.guest.id);
        await user.roles.add(roles.member.id);
        await user.roles.add(roles.noGames.id);
        newRole = roles.member.id;
        break;
      case roles.newJoin.id:
        await interaction.editReply({
          content: `${user} needs to use the \`/get-started\` command to get promoted.`,
        });
        return;
      default:
        console.log('No roles found.');
        await interaction.editReply({
          content: `${user} has no roles.`,
        });
        return;
    }
    
    console.log(`${user.displayName} has been promoted from ${usersCurrentRole.name}.`); 
    await interaction.editReply({
      content: `${user} has been promoted to <@&${newRole}>.`,
    });
  },
};
