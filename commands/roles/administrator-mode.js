const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  Role,
} = require("discord.js");
const getMembersRole = require("../../utils/getMembersRole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('administrator-mode')
    .setDescription('Toggle administrator mode for only you.'),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    const member = interaction.member;

    const { value: usersRole, rank } = await getMembersRole(member);

    if (usersRole < rank.owner) {
      await interaction.editReply({
        content: `You don't have permission to use this command.`,
      });
      return;
    }

    let administratorStatus;
    /**
     * @type {Role} administratorRole
     */
    let administratorRole = await member.roles.cache.find((r) => r.name === 'Administrator');

    if (administratorRole === undefined) {
      administratorRole = interaction.guild.roles.cache.find((r) => r.name === 'Administrator');
      
      if (administratorRole === undefined) {
        administratorRole = await interaction.guild.roles.create({
          name: 'Administrator',
          permissions: [ PermissionsBitField.Flags.Administrator ],
        });
      }

      await member.roles.add(administratorRole);
      administratorStatus = 'on';
    }
    else {
      await member.roles.remove(administratorRole);

      const otherMembersInAdministratorMode = interaction.guild.members.cache.find(
        (m) => m.roles.cache.find((r) => r.name === 'Administrator')
      );

      if (!otherMembersInAdministratorMode) {
        await administratorRole.delete();
      }

      administratorStatus = 'off';
    }

    console.log(`Administrator mode is ${administratorStatus} for ${interaction.member.displayName}.`);
    await interaction.editReply({
      content: `Administrator mode is **${administratorStatus}**.`,
    });

    // TODO: maybe add timeout for administrator role
  },
};
