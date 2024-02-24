const mongoose = require('mongoose');

const run = async () => {
	// MongoDB Connection
	await mongoose.connect('mongodb+srv://CoopTroop:d8YsR54hvu1TXTLq@cluster.olqny6n.mongodb.net/?retryWrites=true&w=majority');
	console.log('Connected to MongoDB-cloud');

	const Game = require('../models/game');
	const ButtonListener = require('../models/buttonListener');
	const GamingChannel = require('../models/gamingChannel');
	const SocialChannel = require('../models/socialChannel');

	const games = await Game.find().exec();
	const buttonListeners = await ButtonListener.find().exec();
	const gamingChannels = await GamingChannel.find().exec();
	const socialChannels = await SocialChannel.find().exec();

	await mongoose.connection.close();

	await mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.5');
	console.log('Connected to MongoDB-local');

	console.log('Games...\n\n');
	for (const game of games) {
		const exists = await Game.find({ name: game.name }).exec();
		if (exists) {
			console.log(`\n\nExists:\n${exists}\n\n`);
			continue;
		}
		const newD = await Game.create({
			name: game.name,
			emojiId: game.emojiId,
			roleId: game.roleId,
			channelId: game.channelId,
			subscribers: game.subscribers,
		});
		console.log(`\n\nCreated:\n${newD}\n\n`);
	}
	console.log('ButtonListeners...\n\n');
	for (const buttonListener of buttonListeners) {
		const exists = await ButtonListener.find({ id: buttonListener.id, messageId: buttonListener.messageId }).exec();
		if (exists) {
			console.log(`\n\nExists:\n${exists}\n\n`);
			continue;
		}
		const newD = await ButtonListener.create({
			id: buttonListener.id,
			messageId: buttonListener.messageId,
			callbackPath: buttonListener.callbackPath,
			callbackName: buttonListener.callbackName,
			args: buttonListener.args,
		});
		console.log(`\n\nCreated:\n${newD}\n\n`);
	}
	console.log('GamingChannels...\n\n');
	for (const gamingChannel of gamingChannels) {
		const exists = await GamingChannel.find({ id: gamingChannel.id }).exec();
		if (exists) {
			console.log(`\n\nExists:\n${exists}\n\n`);
			continue;
		}
		const newD = await GamingChannel.create({
			name: gamingChannel.name,
			icon: gamingChannel.icon,
			fullName: gamingChannel.fullName,
			number: gamingChannel.number,
			id: gamingChannel.id,
			activity: gamingChannel.activity,
			influence: gamingChannel.influence,
			ownerId: gamingChannel.ownerId,
			nameChanges: gamingChannel.nameChanges,
			updateQueue: gamingChannel.updateQueue,
		});
		console.log(`\n\nCreated:\n${newD}\n\n`);
	} 
	console.log('SocialChannels...\n\n');
	for (const socialChannel of socialChannels) {
		const exists = await SocialChannel.find({ name: socialChannel.name }).exec();
		if (exists) {
			console.log(`\n\nExists:\n${exists}\n\n`);
			continue;
		}
		const newD = await SocialChannel.create({
			name: socialChannel.name,
			icon: socialChannel.icon,
			fullName: socialChannel.fullName,
			location: socialChannel.location,
			description: socialChannel.description,
			id: socialChannel.id,
			isActive: socialChannel.isActive,
		});
		console.log(`\n\nCreated:\n${newD}\n\n`);
	}
	return;
}

run();
