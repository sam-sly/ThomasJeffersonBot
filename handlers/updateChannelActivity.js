const {
  VoiceChannel,
} = require("discord.js");
const { readFile, writeFile } = require("../utils/json");

/**
 * @param {VoiceChannel} channel
 * @param {Number} i
 */
module.exports = async (channel, i) => {
  console.log(`Updating activity for ${channel.name}.`);
  const { active, templates, skipActivities } = await readFile('data/dynamicChannels.json');
  let activity = null;

  switch (active[i].influence) {
    case 'none':
      activity = null;
      break;
    case 'owner':
    default:
      const owner = channel.members.get(active[i].owner.userId);
      if (owner) {
        for (const a of owner.presence.activities) {
          if (skipActivities.includes(a.name)) continue;
          activity = {
            icon: '🎮',
            name: a.name,
          };
          break;
        }
      }
      break;
      // TODO: find majority activity
  }

  if (JSON.stringify(activity) === JSON.stringify(active[i].activity)) {
    console.log('No change to activity.');
    return;
  }

  active[i].activity = activity;

  await writeFile({ active, templates, skipActivities }, 'data/dynamicChannels.json');

  await channel?.setName((activity)
    ? `${activity.icon}・${activity.name}`
    : `${active[i].icon}・${active[i].name}`
  );
  console.log(`Successfully changed activity to ${(activity)? `${activity.icon}・${activity.name}` : 'none'}.`);
};
