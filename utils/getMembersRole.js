const { GuildMember, Role } = require("discord.js");
const { readFile } = require("./json");

/**
 * @param {GuildMember} member
 * @returns {
 *  @type {Role} role
 *  @type {Number} value
 * }
 */
module.exports = async (member) => {
  const { roles } = await readFile('data/settings.json');

  const hierarchy = [
    roles.newJoin.id,
    roles.guest.id,
    roles.member.id,
    roles.moderator.id,
    roles.admin.id,
  ];

  let membersRole = -1;

  for (const role of member.roles.cache) {
    const roleValue = hierarchy.findIndex((i) => i === role[0]);
    if (roleValue > membersRole) {
      membersRole = roleValue;
    }
  }

  return {
    value: membersRole,
    role: member.roles.cache.get(hierarchy[membersRole]),
  };
};
