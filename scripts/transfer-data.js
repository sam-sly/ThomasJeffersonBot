const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');

  // const Game = require('./models/game');
  const DynamicVoiceChannel = require('./models/dynamicVoiceChannel');
  const SocialChannel = require('./models/socialChannel');
  const GamingChannel = require('./models/gamingChannel');

  const dynamicChannels = await DynamicVoiceChannel.find({});

  for (const channel of dynamicChannels) {
    const newChannel = new SocialChannel({
      name: channel.name,
      icon: channel.icon,
      fullName: channel.fullName,
      location: channel.location,
      description: channel.description,
      id: channel.id,
      isActive: channel.isActive,
    });
    await newChannel.save();
    console.log(newChannel);
    console.log(`Social Channel ${newChannel.name} saved`);
  }

  // const { games } = require('./data/games.json');
  //
  // for (const game of games) {
  //   if (await Game.exists({ name: game.name })) {
  //     console.log(`Game ${game.name} already exists`);
  //     continue;
  //   }
  //   const newGame = new Game({ 
  //     name: game.name,
  //     emojiId: game.emoji.id,
  //     roleId: game.role.id,
  //     channelId: game.channel.id
  //   });
  //   await newGame.save();
  //   console.log(newGame);
  //   console.log(`Game ${newGame.name} saved`);
  // }
  //
  //
  // const { templates } = require('./data/dynamicChannels.json');
  //
  // for (const template of templates) {
  //   if (await DynamicVoiceChannel.exists({ name: template.name })) {
  //     console.log(`DVC ${template.name} already exists`);
  //     continue;
  //   }
  //   const newDVC = new DynamicVoiceChannel({
  //     name: template.name,
  //     icon: template.icon,
  //     fullName: template.fullName,
  //     location: template.location,
  //     description: template.description,
  //   });
  //   await newDVC.save();
  //   console.log(newDVC);
  //   console.log(`DVC ${newDVC.name} saved`);
  // }
  //
  // console.log(await Game.find({}));
  // console.log(await DynamicVoiceChannel.find({}));

  return;
}).catch(err => console.error(err));
