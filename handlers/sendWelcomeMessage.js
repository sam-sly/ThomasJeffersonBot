const { Message } = require("discord.js");
const { readFile } = require("../utils/json");

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  var welcomeMessage = await readFile('data/welcomeMessage.json');
  
  for (const replacement of welcomeMessage.replacements) {
    if (replacement.name === 'user') {
      welcomeMessage.embed.title = welcomeMessage.embed.title.replace(
        replacement.tag,
        message.member.displayName,
      );
      welcomeMessage.embed.description = welcomeMessage.embed.description.replace(
        replacement.tag,
        message.member.displayName,
      );
    }
  }

  await message.reply({
    embeds: [ welcomeMessage.embed ],
    files: welcomeMessage.attachments,
  });
};
