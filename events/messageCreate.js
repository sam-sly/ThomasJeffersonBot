const { Events, Message, EmbedBuilder } = require('discord.js');
const sendWelcomeMessage = require('../handlers/sendWelcomeMessage');
const reportTheError = require('../utils/reportTheError');

const SYSTEM_WELCOME_MESSAGE = 7;

module.exports = {
	name: Events.MessageCreate,
  /**
   * @param {Message} message
   */
	execute: async (message) => {
    if (message.type !== SYSTEM_WELCOME_MESSAGE) return;

    try {
      await sendWelcomeMessage(message);
      console.log(`Sent ${message.member.displayName} the welcome message.`);
    } catch (error) {
      await reportTheError(error, '❌ Error during MessageCreate event.', null, message.guild);
    }
  },
};
