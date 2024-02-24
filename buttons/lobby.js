const ButtonListener = require('../models/buttonListener');

module.exports = new Map([
  ['moveUserToMyChannel', async (interaction, memberToMoveId) => {
    const targetChannel = interaction.member.voice.channel;

    if (!targetChannel) {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({
        content: `You need to be connected to a voice channel to use this.`,
      });

      setTimeout(async () => await interaction.deleteReply(), 10_000);
      return;
    }

    if (targetChannel.id === process.env.LOBBY_CHANNEL) {
      await interaction.update({ fetchReply: true });
      return;
    }

    const memberToMove = await interaction.guild.members.fetch(memberToMoveId);

    if (memberToMove.voice?.channel?.id !== process.env.LOBBY_CHANNEL) {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({
        content: `${memberToMove} is not connected to <#${process.env.LOBBY_CHANNEL}> anymore.`,
      });

      setTimeout(async () => await interaction.deleteReply(), 10_000);
      return;
    }

    await memberToMove.voice.setChannel(targetChannel);
    console.log(`Moved ${memberToMove.displayName} to ${targetChannel.name}.`);
    
    // await interaction.message.delete();
    // await ButtonListener.deleteOne({ messageId: interaction.message.id });

    return;
  }],
]);
