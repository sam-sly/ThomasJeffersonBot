const { GuildMember, Role } = require("discord.js");

/**
 * @param {GuildMember} member
 * @returns {
 *  @type {Role} role
 *  @type {Number} value
 * }
 */
module.exports = async (member) => {
  const hierarchy = [
    process.env.GUEST_ROLE_ID,
    process.env.MEMBER_ROLE_ID,
    process.env.MODERATOR_ROLE_ID,
    process.env.ADMIN_ROLE_ID,
    process.env.OWNER_ROLE_ID
  ];

  let membersRole = -1;

  for (const role of member.roles.cache) {
    const roleValue = hierarchy.findIndex((i) => i === role[0]);
    if (roleValue > membersRole) {
      membersRole = roleValue;
    }
  }

  console.log(`${member.displayName}'s role: ${membersRole}`);

  return {
    value: membersRole,
    role: member.roles.cache.get(hierarchy[membersRole]),
    rank: {
      owner: 4,
      admin: 3,
      moderator: 2,
      member: 1,
      guest: 0,
      newJoin: -1,
    },
  };
};
