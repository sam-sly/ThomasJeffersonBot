const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChatInputCommandInteraction,
} = require("discord.js");
const { readFile } = require('../../utils/json');
const getMembersRole = require("../../utils/getMembersRole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('get-started')
    .setDescription('Get started as a new user in Founding Sons Gaming Community.'),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    const { value: usersRole, rank } = await getMembersRole(interaction.member);

    if (usersRole !== rank.newJoin) {
      interaction.editReply({
        content: `You don't need to use this command.`,
      });
      return;
    }

    const rulesMessage = await readFile('data/rules.json');

    const rulesEmbed = new EmbedBuilder()
      .setColor(rulesMessage.color)
      .setTitle(rulesMessage.title)
      .setDescription(rulesMessage.intro)
      .setThumbnail('attachment://founding-sons-logo.png')
      .addFields({ name: ' ', value: ' ' });

    for (let i = 0; i < rulesMessage.rules.length; i++) {
      rulesEmbed.addFields(
        {
          name: rulesMessage.numbers[i].emoji.concat(rulesMessage.rules[i].title),
          value: rulesMessage.rules[i].description,
        },
        { name: ' ', value: ' ' },
      );
    }

    rulesEmbed.addFields({ name: ' ', value: rulesMessage.outro });

    const agreeButton = new ButtonBuilder()
      .setCustomId('agree')
      .setLabel('Agree 👍')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(agreeButton);

    const response = await interaction.editReply({
      embeds: [ rulesEmbed ],
      components: [ row ],
      files: [{
        attachment: "resources/founding-sons-logo.png",
        name: "founding-sons-logo.png",
        description: "Founding Sons Logo"
      }],
    });

    const input = await response.awaitMessageComponent();
    await input.update({ fetchReply: true });

    const introductionEmbed = new EmbedBuilder()
      .setTitle('🔥 The Final Step 🔥')
      .setDescription('We\'re excited to learn more about you and welcome you into our ranks!\n\nTake a moment to introduce yourself to the Founding Sons community. Share how you discovered our legendary server and anything else about you that you\'d like.\n\n**Click the button below labeled "Share Your Tale" to open a text box where you can craft your introduction.**')
      .setThumbnail('attachment://founding-sons-logo.png');

    const introButton = new ButtonBuilder()
      .setCustomId('intro')
      .setLabel('Share Your Tale 📝')
      .setStyle(ButtonStyle.Success);

    const introRow = new ActionRowBuilder().addComponents(introButton);

    const introResponse = await interaction.editReply({
      embeds: [ introductionEmbed ],
      components: [ introRow ],
      files: [{
        attachment: "resources/founding-sons-logo.png",
        name: "founding-sons-logo.png",
        description: "Founding Sons Logo"
      }],
    });

    const introInput = await introResponse.awaitMessageComponent();

    const modal = new ModalBuilder()
      .setCustomId('introModal')
      .setTitle('Introduce Yourself');

    const introductionInput = new TextInputBuilder()
      .setCustomId('introductionInput')
      .setLabel('Introduction')
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(new ActionRowBuilder().addComponents(introductionInput));

    await introInput.showModal(modal);

    var modalResponse;
    try {
      /**
       * @type {ModalSubmitInteraction} modalResponse
       */
      modalResponse = await interaction.awaitModalSubmit({
        time: 300000,
      });
    } catch (error) {
      if (error.message.endsWith('time')) {
        interaction.editReply({
          content: 'Input timed out.',
          embeds: [],
          components: [],
        });
        return;
      }
    }

    const newIntroduction = new EmbedBuilder()
      .setAuthor({ name: interaction.user.globalName, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(modalResponse.fields.getTextInputValue('introductionInput'))
      .setColor('DarkOrange');

    await modalResponse.update({ fetchReply: false });

    const completeEmbed = new EmbedBuilder()
      .setTitle('Welcome to Founding Sons Gaming Community! 🎉')
      .setDescription('Hail, valiant adventurer! Your introduction has been received with great joy, and we\'re excited to welcome you as a guest into the ranks of Founding Sons. As a guest, you now have access to explore the various public channels and engage in lively discussions with our members.\n\nFeel free to immerse yourself in the gaming conversations, join ongoing quests, and experience the camaraderie that defines our vibrant community. Should you need any assistance or have any queries, our friendly moderators and members are always here to lend a hand. May your time with us be filled with thrilling escapades and unforgettable gaming moments.\n\n**Once again, welcome to Founding Sons Gaming Community, where legends are born and friendships are forged!** 🎮🛡️🌌')
      .setThumbnail('attachment://founding-sons-logo.png');

    await interaction.editReply({
      content: '',
      embeds: [ completeEmbed ],
      components: [],
      files: [{
        attachment: "resources/founding-sons-logo.png",
        name: "founding-sons-logo.png",
        description: "Founding Sons Logo"
      }],
    });

    const introChannel = await interaction.guild.channels.cache.get(process.env.INTRODUCTIONS_CHANNEL);

    await introChannel.send({
      embeds: [ newIntroduction ],
    });

    await interaction.member.roles.add(process.env.GUEST_ROLE_ID);
    console.log(`${interaction.member.displayName} is now a Guest.`)
  },
};
