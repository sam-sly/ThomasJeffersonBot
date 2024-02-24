const {
  EmbedBuilder,
  ModalBuilder,
} = require("discord.js");
const Game = require("../models/game.js");
const refreshFollowGames = require("../handlers/refreshFollowGames.js");

const notify = async (interaction, message) => {
  const embed = new EmbedBuilder()
    .setDescription(message);

  await interaction.reply({
    embeds: [ embed ],
    ephemeral: true,
  });

  setTimeout(async () => {
    await interaction.deleteReply();
  }, 10_000);

  return;
};

module.exports = new Map([
  ['followGame', async (interaction, gameId) => {
    const game = await Game.findById(gameId).exec();

    console.log(`💠 ${game.name} button clicked by ${interaction.member.displayName}.`);

    if (!game) {
      notify(interaction, `❌ **Game not found.**`);
      return;
    }

    const role = interaction.guild.roles.cache.get(game.roleId);

    if (!role) {
      notify(interaction, `❌ **Role not found.**`);
      return;
    }

    const emoji = interaction.guild.emojis.cache.get(game.emojiId);

    if (interaction.member.roles.cache.has(game.roleId)) {
      await interaction.member.roles.remove(game.roleId);

      game.subscribers--;
      await game.save();

      notify(interaction, `⛔️ Stopped following ${emoji} **${game.name}**.`);
    } else {
      await interaction.member.roles.add(game.roleId);

      game.subscribers++;
      await game.save();

      notify(interaction, `⭐️ Now following ${emoji} **${game.name}**.`);
    }

    refreshFollowGames(interaction.guild);
  }],
  ['createRequest', async (interaction) => {
    const modal = new ModalBuilder()
      .setCustomId('createRequest')
      .setTitle('Request New Game');
      
    
  }],
]);
