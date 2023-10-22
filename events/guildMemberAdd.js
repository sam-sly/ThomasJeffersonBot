const {
  Events,
  GuildMember,
} = require('discord.js');
const { readFile } = require('../utils/json');
const reportTheError = require('../utils/reportTheError');

module.exports = {
	name: Events.GuildMemberAdd,
  /**
   * @param {GuildMember} member
   */
	execute: async (member) => {
    try {
      console.log(`${member.displayName} has joined ${member.guild.name}.`);
      const { roles } = await readFile('data/settings.json');
      await member.roles.add(roles.newJoin.id);
      console.log(member.guild.invites);

      // TODO: log invite link new member used
    } catch (error) {
      await reportTheError(error, '❌ Error during GuildMemberAdd event.', null, member.guild);
    }
	},
};
