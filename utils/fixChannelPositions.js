module.exports = async (category, socialChannels, gamingChannels) => {
  const membersChannels = category.children.cache.filter(ch => ch.isVoiceBased());

  let i = 0;
  
  for (const [id, channel] of membersChannels) {
    if (!socialChannels.some(s => s.id === id)) continue;

    await channel.setPosition(i++);
    console.log(`Moved "${channel.name}" to position ${i}.`);
  }

  for (const g of gamingChannels) {
    const channel = membersChannels.get(g.id);

    if (!channel) continue;

    await channel.setPosition(i++);
    console.log(`Moved "${channel.name}" to position ${i}.`);
  }

  return;
};
