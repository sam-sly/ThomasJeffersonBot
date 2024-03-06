const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} = require('discord.js');
const ButtonListener = require('../models/buttonListener');

const COLOR = 12133;

const onboardingSteps = [
  {
    name: 'welcome',
    content: `# 👋 Welcome, %MEMBER%!\n​\n`
    .concat(`Greetings, brave traveler, and thank you for stepping into our realm. We're thrilled to have you join our fellowship of gamers and adventurers. Whether you're a seasoned warrior or just starting your journey, you've found a place to call home.\n\n`)
    .concat(`♤ ***Learn more in*** <#946877814433513473>\n\n\n`)
    .concat(`**To commence your adventure in this glorious server, simply click the button below.**`),
    buttons: [
      new ButtonBuilder()
      .setCustomId('get-started')
      .setLabel('Get Started')
      .setStyle(ButtonStyle.Success),
    ],
  },
  {
    name: 'rules',
    content: '# 📜 Community Guidelines\n​\n'
    .concat('Before fully embarking on your gaming journey with us, please take a moment to familiarize yourself with our community guidelines. These rules are designed to ensure a respectful and enjoyable environment for all members. Your adherence to these principles is vital in maintaining the spirit of camaraderie within our ranks.\n\n')
    .concat('Below are the rules and expectations we uphold in Founding Sons Gaming Community:\n\n\n')
    .concat('1️⃣ **Respect for All:** Be respectful to everyone here. No harassment allowed. If you have an issue, try to resolve it maturely. If that doesn\'t work, reach out to an admin or moderator.\n\n')
    .concat('2️⃣ **Have Fun:** Your main goal is to enjoy yourself.\n\n')
    .concat('3️⃣ **Use the Right Channels:** Post your messages in the appropriate channels for organized discussions.\n\n')
    .concat('4️⃣ **Stay Connected:** While there\'s no set requirement, we appreciate it if you say \"Hi\" occasionally. Let\'s get to know each other!\n\n')
    .concat('5️⃣ **Play Your Way**: No need to be hardcore. Play the games you like, when you like.\n\n')
    .concat('6️⃣ **No Cheating**: Founding Sons is a strictly no cheating or hacking server.  Gamers here want to play fairly and don\'t want to play with others who are cheating.\n\n')
    .concat('\n**If you agree to abide by these rules, please click the button below.**'),
    buttons: [
      new ButtonBuilder()
      .setCustomId('agree')
      .setLabel('I Agree')
      .setStyle(ButtonStyle.Success),
    ],
  },
  {
    name: 'referral',
    content: '# 🌟 Where Did You Hear About Us?\n​\n'
    .concat('We\'re thrilled to learn how you discovered our legendary server.\n\n')
    .concat('***Select one of the options below.***\n\n')
    .concat('If you were invited by someone, a popup will open so that you can specify who.\n')
    .concat('If none of the options suits you, click on other and tell us in your own words.'),
    buttons: [
      new ButtonBuilder()
      .setCustomId('invited')
      .setLabel('Invited by... 📝')
      .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
      .setCustomId('DISBOARD')
      .setLabel('DISBOARD')
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId('the Ashes of Creation forum')
      .setLabel('Ashes of Creation Forum')
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId('other')
      .setLabel('Other... 📝')
      .setStyle(ButtonStyle.Success),
    ],
  },
  {
    name: 'introduction',
    content: '# 💬 Want to tell us more?\n​\n'
    .concat('If you\'re willing, we\'d love to learn more about you as we welcome you into our ranks! Take a moment to introduce yourself to the Founding Sons community. Share anything about yourself that you\'d like (e.g. why did you join the server, what are you looking for here, what games do you play, etc).\n\n')
    .concat('If not, that\'s okay too. Just click the button below to skip this step.'),
    buttons: [
      new ButtonBuilder()
      .setCustomId('share')
      .setLabel('Share your tale 📝')
      .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
      .setCustomId('skip')
      .setLabel('I\'m shy, just let me in')
      .setStyle(ButtonStyle.Danger),
    ],
  },
  {
    name: 'complete',
    content: '# 🎉 Welcome to the Founding Sons Gaming Community! 🎉\n​\n'
    .concat('Hail, valiant adventurer! Your introduction has been received with great joy, and we\'re excited to welcome you as a guest into the ranks of Founding Sons.\n\n')
    .concat('As a guest, you now have access to explore the various public channels and engage in lively discussions with our members. If you see people in a channel that is locked to you and you\'d like to join, don\'t hesitate to ping anyone in <#1161517879682928821>.  When you join <#1161518431015800892>, any member will be able to move you into their channel.\n\n')
    .concat('Happy gaming! 🎮🛡️🌌'),
    buttons: [],
  },
];

const handleReplacements = (content, replacements) => {
  for (const [tag, replaceWith] of replacements.entries()) {
    content = content.replace(tag, replaceWith);
  }
  return content;
};

module.exports = new Map([
  ['sendWelcomeMessage', async (systemMessage) => {
    const member = systemMessage.member;
    const content = handleReplacements(onboardingSteps[0].content, new Map([
      ['%MEMBER%', member.displayName],
      // Other replacements...
    ]));

    const embed = new EmbedBuilder()
      .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
      .setColor(COLOR)
      .setDescription(content)
      .setThumbnail(member.displayAvatarURL());

    const actionRow = new ActionRowBuilder().addComponents(onboardingSteps[0].buttons);

    const message = await systemMessage.reply({
      content: '*Loading...*',
    });

    for (const button of onboardingSteps[0].buttons) {
      await ButtonListener.create({
        id: button.data.custom_id,
        messageId: message.id,
        callbackPath: 'onboard',
        callbackName: 'nextStep',
        args: [
          1,
          member.id,
          message.id,
          {
            referral: {
              mode: null,
              custom: null,
            },
            introduction: null,
          },
        ],
      });
    }

    await message.edit({
      content: '',
      embeds: [ embed ],
      components: [ actionRow ],
    });

    return;
  }],
  ['nextStep', async (interaction, step, memberId, messageId, info) => {
    const member = interaction.guild.members.cache.get(memberId);
    const message = interaction.channel.messages.cache.get(messageId);

    if (interaction.member !== member) {
      await interaction.reply({
        content: `This message is for ${member}`,
        ephemeral: true,
      });
    }

    if (onboardingSteps[step].name === 'referral') {
      info.referral.mode = interaction.customId;

      if (interaction.customId === 'invited') {
        const modal = new ModalBuilder()
          .setCustomId('referralModal')
          .setTitle('Who Invited You?');

        const referralInput = new TextInputBuilder()
          .setCustomId('referralInput')
          .setLabel('​')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(referralInput));

        await interaction.showModal(modal);

        var modalResponse;
        try {
          /**
           * @type {ModalSubmitInteraction} modalResponse
           */
          modalResponse = await interaction.awaitModalSubmit({
            time: 60_000,
          });
        } catch (error) {
          if (error.message.endsWith('time')) {
            message.edit({
              content: 'Input timed out.',
            });
            return;
          } else throw error;
        }
        info.referral.custom = modalResponse.fields.getTextInputValue('referralInput');

        await modalResponse.update({ fetchReply: true });
      }

      else if (interaction.customId === 'other') {
        const modal = new ModalBuilder()
          .setCustomId('referralModal')
          .setTitle('How Did You Hear About Us?');

        const referralInput = new TextInputBuilder()
          .setCustomId('referralInput')
          .setLabel('​')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(referralInput));

        await interaction.showModal(modal);

        var modalResponse;
        try {
          /**
           * @type {ModalSubmitInteraction} modalResponse
           */
          modalResponse = await interaction.awaitModalSubmit({
            time: 60_000,
          });
        } catch (error) {
          if (error.message.endsWith('time')) {
            message.edit({
              content: 'Input timed out.',
            });
            return;
          } else throw error;
        }
        info.referral.custom = modalResponse.fields.getTextInputValue('referralInput');

        await modalResponse.update({ fetchReply: true });
      }
    }

    else if (onboardingSteps[step].name === 'introduction' && interaction.customId === 'share') {
      const modal = new ModalBuilder()
        .setCustomId('introductionModal')
        .setTitle('Introduce Yourself');

      const introductionInput = new TextInputBuilder()
        .setCustomId('introductionInput')
        .setLabel('​')
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(new ActionRowBuilder().addComponents(introductionInput));

      await interaction.showModal(modal);

      var modalResponse;
      try {
        /**
         * @type {ModalSubmitInteraction} modalResponse
         */
        modalResponse = await interaction.awaitModalSubmit({
          time: 120_000,
        });
      } catch (error) {
        if (error.message.endsWith('time')) {
          message.edit({
            content: 'Input timed out.',
          });
        } else throw error;
      }
      info.introduction = modalResponse.fields.getTextInputValue('introductionInput');

      await modalResponse.update({ fetchReply: true });
    }

    await interaction.update({ fetchReply: true });

    // Send the next step

    const nextStep = step + 1;

    if (onboardingSteps[nextStep].name === 'complete') {
      await message.channel.permissionOverwrites.create(member, { 'ViewChannel': true });
      await member.roles.add(process.env.GUEST_ROLE_ID);
      console.log(`${member.displayName} is now a Guest.`);
    }


    const embed = new EmbedBuilder()
      .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
      .setColor(COLOR)
      .setDescription(onboardingSteps[nextStep].content)
      .setThumbnail(member.displayAvatarURL());

    let components = [];
    if (onboardingSteps[nextStep].buttons.length > 0) {
      components = [new ActionRowBuilder().addComponents(onboardingSteps[nextStep].buttons)];
    }

    for (const button of onboardingSteps[nextStep].buttons) {
      await ButtonListener.create({
        id: button.data.custom_id,
        messageId: message.id,
        callbackPath: 'onboard',
        callbackName: 'nextStep',
        args: [
          nextStep,
          member.id,
          message.id,
          info,
        ],
      });
    }

    await message.edit({
      content: '',
      embeds: [ embed ],
      components: components,
    });

    for (const button of onboardingSteps[step].buttons) {
      await ButtonListener.findOneAndDelete({ id: button.data.custom_id, messageId: message.id }).exec();
    }

    if (onboardingSteps[nextStep].name === 'complete') {
      const introChannel = member.guild.channels.cache.get(process.env.INTRODUCTIONS_CHANNEL);

      const newIntroduction = new EmbedBuilder()
        .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
        .setDescription(
          info.referral.mode === 'invited'
          ? `*Invited by ${info.referral.custom}*\n\n`
          : `*Found us through${info.referral.mode === 'other' ? `: "${info.referral.custom}"` : ` ${info.referral.mode}`}*\n`
          .concat(
            info.introduction !== null
            ? `### 〝 ${info.introduction} 〞\n`
            :  `​`
          ).concat('​\n🎉 ***Founding Sons, welcome our new guest!***')
        ).setColor('DarkOrange');

      await introChannel.send({
        embeds: [ newIntroduction ],
      });

      await message.channel.permissionOverwrites.delete(member);
    }

    return;
  }],
]);
