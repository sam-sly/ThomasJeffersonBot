const {
  VoiceChannel,
} = require("discord.js");
const GamingChannel = require('../models/gamingChannel');

const skipActivities = ['Custom Status', 'Spotify'];

const DISCORD_NAME_CHANGE_LIMIT = {
  count: 2,
  time: 10 * 60_000,
};
const TIME_BUFFER = 1_000;

const checkNameChanges = async (savedChannel) => {
  for (let i = 0; i < savedChannel.nameChanges.length; i++) {
    if (Date.now() - savedChannel.nameChanges[i] > DISCORD_NAME_CHANGE_LIMIT.time + TIME_BUFFER) {
      savedChannel.nameChanges.splice(i, 1);
      await savedChannel.save();
      i--;
    }
  }
  return savedChannel.nameChanges.length;
}

/**
 * @param {VoiceChannel} channel
 * @param {DynamicVoiceChannel} savedChannel
 */
module.exports = async (channel, savedChannel) => {
  if (await checkNameChanges(savedChannel) >= DISCORD_NAME_CHANGE_LIMIT.count) {
    console.log(`${channel.name} cannot be changed at this time.`);

    if (savedChannel.updateQueue) return Math.ceil((savedChannel.updateQueue._idleStart + savedChannel.updateQueue._idleTimeout - Date.now()) / 1000);

    const delay = DISCORD_NAME_CHANGE_LIMIT.time - (Date.now() - savedChannel.nameChanges[0]) + TIME_BUFFER;

    const timeoutId = setTimeout(async () => {
      const savedChannel = await GamingChannel.findOne({ id: channel.id }).exec();

      if (!savedChannel) return;

      const updateChannelActivity = require('./updateChannelActivity');
      await updateChannelActivity(channel, savedChannel);
    }, delay);

    savedChannel.updateQueue = timeoutId;
    await savedChannel.save();

    return delay;
  }

  if (savedChannel.updateQueue) {
    clearTimeout(savedChannel.updateQueue);
    savedChannel.updateQueue = null;
    await savedChannel.save();
  }

  console.log(`Updating activity for ${savedChannel.icon}・${savedChannel.name}.`);
  let activity = null;

  switch (savedChannel.influence) {
    case 'none':
      activity = savedChannel.name;
      break;
    case 'game':
      console.log('Checking owner activity.');
      const owner = channel.members.get(savedChannel.ownerId);

      if (owner) {
        for (const a of owner.presence.activities) {
          if (skipActivities.includes(a.name)) continue;
          activity = a.name;
          break;
        }
      }

      if (activity != null) {
        console.log(`Owner activity: ${activity}`);
        break;
      }
      console.log('No owner activity.');

      // TODO: change activity detection to use activity type codes

      const allActivities = new Map();

      for (const member of channel.members.values()) {
        if (!member.presence) continue;
        for (const a of member.presence.activities) {
          if (skipActivities.includes(a.name)) continue;
          if (allActivities.has(a.name)) {
            allActivities.get(a.name).count++;
            continue;
          }
          allActivities.set(a.name, {
            name: a.name,
            count: 1,
          });
        }
      }

      console.log(allActivities);

      let maxCount = 0;
      for (const a of allActivities.values()) {
        if (a.count > maxCount) {
          maxCount = a.count;
          activity = a.name;
          console.log(`New activity: ${activity} with ${a.count} users.`)
        }
        else if (a.count === maxCount) {
          console.log(`No new activity. ${a.name} and ${activity} both have ${a.count} users.`)
          activity = null
        };
      }

      break;
  }

  const sameSavedActivity = activity === savedChannel.activity;
  const sameChannelName = activity? channel.name.slice(3) === activity : channel.name.slice(3) === savedChannel.name;

  if (sameSavedActivity && sameChannelName) {
    console.log('No change to activity.');
    return;
  }

  savedChannel.activity = activity;
  savedChannel.nameChanges.push(Date.now());

  await savedChannel.save();

  await channel.setName(activity
    ? `${savedChannel.icon}・${activity}`
    : `${savedChannel.icon}・${savedChannel.name}`
  );
  console.log(`Changed ${savedChannel.icon}・${savedChannel.name} activity to ${activity ? `${savedChannel.icon}・${activity}` : 'none'}.`);
};
