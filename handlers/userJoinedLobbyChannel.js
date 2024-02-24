const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const ButtonListener = require('../models/buttonListener');

module.exports = async (newState) => {
  const embed = new EmbedBuilder()
    .setAuthor({ name: newState.member.displayName, iconURL: newState.member.displayAvatarURL() });

  const button = new ButtonBuilder()
    .setCustomId(newState.member.id)
    .setLabel('Move to my channel')
    .setStyle(ButtonStyle.Success);
    
  const row = new ActionRowBuilder().addComponents(button);

  const message = await newState.channel.send({
    content: 'Loading...',
  });

  await ButtonListener.create({
    id: button.data.custom_id,
    messageId: message.id,
    callbackPath: 'lobby.js',
    callbackName: 'moveUserToMyChannel',
    args: [newState.member.id],
  });

  await message.edit({
    content: '',
    embeds: [embed],
    components: [row],
  });

  return;
};
