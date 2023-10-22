const {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  DMChannel,
} = require('discord.js');

/**
 * @param {Error} error
 * @param {String} title
 * @param {ChatInputCommandInteraction} interaction
 * @param {Guild} guild
 */
module.exports = async (error, title='❌ An error has occurred.', interaction=undefined, guild=undefined) => {
  console.error(title);
  console.error(error);

  const errorEmbed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(error.message);

  if (interaction) {
    if (!guild) guild = interaction.guild;

    errorEmbed.setAuthor({
      name: interaction.user.globalName,
      iconURL: interaction.user.displayAvatarURL(),
    });

    await interaction.editReply({
      content: '❌ An error has occurred during this command.',
      embeds: [],
      components: [],
      files: [],
    });
  }

  /**
   * @type {GuildMember} botManager
   */
  const botManager = await guild.members.fetch('281626322340675585');

  /**
   * @type {DMChannel} botManagerDM
   */
  const botManagerDM = await botManager.createDM();

  await botManagerDM.send({
    embeds: [ errorEmbed ],
  });
}
