module.exports = async (category, socialChannels, gamingChannels) => {
  const membersChannels = category.children.cache.filter(ch => ch.isVoiceBased());

  let i = 0;
  let emptyChannel = null;
  
  for (const [id, channel] of membersChannels) {
    if (!socialChannels.some(s => s.id === id)) continue;

    if (channel.members.size === 0) {
      emptyChannel = channel;
      continue;
    }

    await channel.setPosition(i++);
    console.log(`Moved "${channel.name}" to position ${i-1}.`);
  }

  if (emptyChannel) {
    await emptyChannel.setPosition(i++);
    console.log(`Moved "${emptyChannel.name}" to position ${i-1}.`);
  }

  for (const g of gamingChannels) {
    const channel = membersChannels.get(g.id);

    if (!channel) continue;

    await channel.setPosition(i++);
    console.log(`Moved "${channel.name}" to position ${i-1}.`);
  }

  return;
};
