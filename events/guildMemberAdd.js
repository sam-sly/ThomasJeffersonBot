const {
  Events,
  GuildMember,
} = require('discord.js');
const reportTheError = require('../utils/reportTheError');

module.exports = {
	name: Events.GuildMemberAdd,
  /**
   * @param {GuildMember} member
   */
	execute: async (member) => {
    try {
      console.log(`${member.displayName} has joined ${member.guild.name}.`);
    } catch (error) {
      await reportTheError(error, '❌ Error during GuildMemberAdd event.', null, member.guild);
    }
	},
};
