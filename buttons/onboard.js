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

const onboardingSteps = new Map([
  ['welcome', {
    content: `# 👋 Welcome, %MEMBER%!\n​\n`
      .concat(`Greetings, brave traveler, and thank you for stepping into our realm. We're thrilled to have you join our fellowship of gamers and adventurers. Whether you're a seasoned warrior or just starting your journey, you've found a place to call home.\n\n`)
      .concat('Before fully embarking on your gaming journey with us, please take a moment to familiarize yourself with our community guidelines. These rules are designed to ensure a respectful and enjoyable environment for all members. Your adherence to these principles is vital in maintaining the spirit of camaraderie within our ranks.\n\n')
      .concat('## 📜 Rules & Expectations\n​\n')
      .concat("1️⃣ **Be respectful of others:** Don't harass or provoke other members.  Founding Sons is a place to hang out with friends, not to spark conflict.\n\n")
      .concat("2️⃣ **No cheating:** Founding Sons is a strictly no cheating or hacking server.  Gamers here want to play fairly and don't want to play with others who are cheating.\n\n")
      .concat("3️⃣ **Act like an adult:** Children don't know how to control or compose themselves around others, adults should.  Founding Sons is a strictly 18+ community; act like you belong.\n\n")
      .concat("4️⃣ **Reach out if you have a problem:** Moderators and Admins are here to help you if a problem becomes something that you can't handle.  Or if you just need help with anything.\n\n")
      .concat('*You can always reference these rules in the* <#946877814433513473> *channel.*\n\n'),
    buttons: [
      new ButtonBuilder()
      .setCustomId('agree')
      .setLabel('I have read and agree to the rules.')
      .setStyle(ButtonStyle.Success),
    ],
    nextStep: 'referral',
  }],
  ['referral', {
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
    nextStep: 'complete',
  }],
  ['complete', {
    content: '# 🎉 Welcome to the Founding Sons Gaming Community! 🎉\n​\n'
      .concat('Hail, valiant adventurer! Your introduction has been received with great joy, and we\'re excited to welcome you as a guest into the ranks of Founding Sons.\n\n')
      .concat('As a guest, you now have access to explore the various public channels and engage in lively discussions with our members. If you see people in a channel that is locked to you and you\'d like to join, don\'t hesitate to ping anyone in <#930262149647962162>.  When you join <#903306964476518470>, any member will be able to move you into their channel.\n\n')
      .concat('Happy gaming! 🎮🛡️🌌'),
    buttons: [],
  }],
]);

const handleReplacements = (content, replacements) => {
  for (const [tag, replaceWith] of replacements.entries()) {
    content = content.replace(tag, replaceWith);
  }
  return content;
};

const sendMessage = async (step, member, message, info) => {
    const content = handleReplacements(step.content, new Map([
      ['%MEMBER%', member.displayName],
      // Other replacements...
    ]));

    const embed = new EmbedBuilder()
      .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
      .setColor(COLOR)
      .setDescription(content)
      .setThumbnail(member.displayAvatarURL());

    let components = [];
    if (step.buttons.length > 0) {
      components = [new ActionRowBuilder().addComponents(step.buttons)];
    }

    for (const button of step.buttons) {
      await ButtonListener.create({
        id: button.data.custom_id,
        messageId: message.id,
        callbackPath: 'onboard',
        callbackName: step.nextStep,
        args: [
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
};

module.exports = new Map([
  ['sendWelcomeMessage', async (systemMessage) => {
    const member = systemMessage.member;

    const message = await systemMessage.reply({
      content: '*Loading...*',
    });

    await sendMessage(onboardingSteps.get('welcome'), member, message, {
      referral: {
        mode: null,
        custom: null,
      },
      introduction: null,
    });

    return;
  }],
  ['referral', async (interaction, memberId, messageId, info) => {
    const member = interaction.guild.members.cache.get(memberId);
    const message = interaction.channel.messages.cache.get(messageId);

    if (interaction.member !== member) {
      await interaction.reply({
        content: `This message is for ${member}`,
        ephemeral: true,
      });
      return;
    }

    await interaction.update({ fetchReply: true });

    await sendMessage(onboardingSteps.get('referral'), member, message, info);

    for (const button of onboardingSteps.get('welcome').buttons) {
      await ButtonListener.findOneAndDelete({ id: button.data.custom_id, messageId: message.id }).exec();
    }
  }],
  ['complete', async (interaction, memberId, messageId, info) => {
    const member = interaction.guild.members.cache.get(memberId);
    const message = interaction.channel.messages.cache.get(messageId);

    if (interaction.member !== member) {
      await interaction.reply({
        content: `This message is for ${member}`,
        ephemeral: true,
      });
      return;
    }

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

    else await interaction.update({ fetchReply: true });

    await message.channel.permissionOverwrites.create(member, { 'ViewChannel': true });
    await member.roles.add(process.env.GUEST_ROLE_ID);
    console.log(`${member.displayName} is now a Guest.`);

    await sendMessage(onboardingSteps.get('complete'), member, message, info);

    for (const button of onboardingSteps.get('referral').buttons) {
      await ButtonListener.findOneAndDelete({ id: button.data.custom_id, messageId: message.id }).exec();
    }

    const introChannel = member.guild.channels.cache.get(process.env.INTRODUCTIONS_CHANNEL);
    const introductionMessage = info.referral.mode === 'invited'
      ? `*Invited by ${info.referral.custom}*\n`
      : `*Found us through${info.referral.mode === 'other' ? `: "${info.referral.custom}"` : ` ${info.referral.mode}`}*\n`;

    const newIntroduction = new EmbedBuilder()
      .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
      .setDescription(introductionMessage.concat('\n🎉 ***Founding Sons, welcome our new guest!***'))
      .setColor('DarkOrange');

    await introChannel.send({
      embeds: [ newIntroduction ],
    });

    await message.channel.permissionOverwrites.delete(member);
  }],
]);
