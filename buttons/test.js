module.exports = new Map([
  ['test', async (interaction, creatorId) => {
    const creator = interaction.guild.members.cache.get(creatorId);
    const clicker = interaction.member;
    console.log(`${creator.displayName}'s button was clicked by ${clicker.displayName}.`);

    await interaction.message.edit({
      content: `Clicked by ${clicker}.`,
    });

    await interaction.update({ fetchReply: true });
  }],
]);
