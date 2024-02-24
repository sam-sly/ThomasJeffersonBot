const SocialChannel = require('../models/socialChannel');
const GamingChannel = require('../models/gamingChannel');
const updateChannelActivity = require('./updateChannelActivity');
const fixChannelPositions = require('../utils/fixChannelPositions');

module.exports = async (client) => {
  const socialChannels = await SocialChannel.find({ isActive: true }).exec();
  const gamingChannels = await GamingChannel.find().exec();

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  const membersCategory = guild.channels.cache.get(process.env.MEMBERS_CATEGORY);
  const membersChannels = membersCategory.children.cache.filter(ch => ch.isVoiceBased());

  let count = 0;
  for (const s of socialChannels) {
    const channel = membersChannels.get(s.id);

    if (!channel) {
      // s.id = null;
      // s.isActive = false;
      // await s.save();
      // socialChannels.splice(socialChannels.indexOf(s), 1);
      continue;
    }
    if (channel.members.size > 0) continue;
    if (count++ < 1) continue;

    s.id = null;
    s.isActive = false;

    await channel.delete();
    await s.save();
    socialChannels.splice(socialChannels.indexOf(s), 1);
  }

  for (const g of gamingChannels) {
    if (g.number === 0) continue;
    const channel = membersChannels.get(g.id);

    if (!channel) {
      // g.id = null;
      // await g.save();
      // gamingChannels.splice(gamingChannels.indexOf(g), 1);
      continue;
    }
    if (channel.members.size > 0) continue;

    await channel.delete();
    gamingChannels.splice(gamingChannels.indexOf(g), 1);
    await GamingChannel.findOneAndDelete({ id: g.id }).exec();
  }

  // Reset voice channel positions
  await fixChannelPositions(membersCategory, socialChannels, gamingChannels);

  // Update gaming channels if an update was queued
  
  for (const g of gamingChannels) {
    if (!g.updateQueue) continue;

    g.updateQueue = null;
    await g.save();

    const channel = membersChannels.get(g.id);
    if (!channel) continue;

    await updateChannelActivity(channel, g);
  }

  return;
};
