import { Client, TextChannel, MessageEmbed, WebhookClient } from "discord.js";
const client = new Client();
import config from "../config.json";
const prefix = config.prefix;
import dotenv from "dotenv";
import Mongoose from "mongoose";
import packageInfo from "../package.json";
dotenv.config();
client.login(process.env.DISCORD_TOKEN).catch((e) => console.error(e));
const URI: string = process.env.MONGO_URI || "";

import { COMMANDS } from "./COMMANDS";
import { hearts } from "./listeners/heartsListen";
import { levelListen } from "./listeners/levelsListen";
import { usageListen } from "./listeners/usageListen";

const hook = new WebhookClient(
  process.env.WH_ID || "none",
  process.env.WH_TOKEN || "none"
);

export const uptimeTimestamp = Date.now();

client.on("ready", () => {
  console.log("Activate the Omega");
  hook.send(
    `I, \`${client.user?.username}\`, am awake! I am in ${process.env.PRODDEV} mode, and version ${packageInfo.version}.`
  );
  client.user?.setActivity(`for commands! Try ${prefix}help`, {
    type: "WATCHING",
  });
  return;
});

Mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch((err) => console.log("Database connection failed.", err));

client.on("guildCreate", (guild) => {
  hook.send(
    `I, \`${client.user?.username}\`, have joined the ${guild.name} server!`
  );
});

client.on("guildDelete", (guild) => {
  hook.send(
    `I, \`${client.user?.username}\`, have left the ${guild.name} server...`
  );
});

client.on("guildMemberAdd", (member) => {
  const welcomeEmbed = new MessageEmbed()
    .setColor("#00ff00")
    .setTitle(`Welcome to ${member.guild.name}`)
    .setDescription("Thank you for joining us!")
    .addFields(
      {
        name: "Rules:",
        value: "Please read the rules in our Welcome channel!",
      },
      {
        name: "My Commands:",
        value: `Use the ${prefix} prefix to get my attention! Try '${prefix}help' to see what I can do!`,
      },
      {
        name: "Privacy Policy",
        value: `Use the \`${prefix}privacy\` command or [view my privacy policy](https://github.com/nhcarrigan/discord-bot/blob/main/PRIVACY.md)`,
      }
    );
  member.send(welcomeEmbed).catch((err) => console.error(err));
  const welcomeLogEmbed = new MessageEmbed()
    .setColor("#ab47e6")
    .setTitle("A new user has joined! 🙃")
    .setDescription(
      `Hello everyone! Let us give a warm welcome to <@!${member.user}>!`
    );
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === config.join_leave_channel
  ) as TextChannel;
  if (!welcomeChannel) {
    console.error("welcome channel not found.");
    return;
  }
  welcomeChannel.startTyping();
  setTimeout(() => {
    welcomeChannel.stopTyping();
    welcomeChannel.send(welcomeLogEmbed).catch((err) => console.error(err));
  }, 3000);
});

client.on("guildMemberRemove", (member) => {
  const goodbyeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === config.join_leave_channel
  ) as TextChannel;
  const departEmbed = new MessageEmbed()
    .setColor("#ab47e6")
    .setTitle("A user has left us! 😦")
    .setDescription(
      `Sad day... ${
        member.nickname || member.user?.username
      } has left us. You will be missed!`
    );
  if (!goodbyeChannel) {
    console.error("depart channel not found.");
    return;
  }
  goodbyeChannel.startTyping();
  setTimeout(() => {
    goodbyeChannel.stopTyping();
    goodbyeChannel.send(departEmbed).catch((err) => console.error(err));
  }, 3000);
});

client.on("message", (message) => {
  if (message.channel.type === "dm" && message.author.id !== client.user?.id) {
    message.channel.startTyping();
    setTimeout(() => {
      message.channel.stopTyping();
      message.channel.send(
        "Sorry, but would you please talk to me in a server, not a private message? If you need a server to join, check out my home! https://discord.gg/PHqDbkg"
      );
    }, 3000);
    return;
  }
  if (config.blocked_ids.includes(message.author.id.toString())) {
    return;
  }
  levelListen.listener(message);
  hearts.listener(message);
  if (message.attachments.array().length > 0) {
    if (!message.attachments.array()[0].height) {
      message.delete();
      message.channel.startTyping();
      setTimeout(() => {
        message.channel.stopTyping();
        message.channel.send(
          "Sorry, but please do not upload files. Only images and videos are allowed."
        );
      }, 3000);
    }
  }
  for (const command of COMMANDS) {
    if (message.content.split(" ")[0] === prefix + command.prefix) {
      message.channel.startTyping();
      usageListen.listener(message);
      setTimeout(() => {
        message.channel.stopTyping();
        command.command(message, client);
      }, 3000);
      break;
    }
  }
});

client.on("messageDelete", (message) => {
  const logChannel = message.guild?.channels.cache.find(
    (channel) => channel.name === config.log_channel
  ) as TextChannel;
  const deleteEmbed = new MessageEmbed()
    .setTitle("A message was deleted.")
    .setColor("#ff0000")
    .setDescription("Here is the record of that message.")
    .addFields(
      {
        name: "Message author:",
        value: message.author,
      },
      {
        name: "Channel:",
        value: message.channel,
      },
      {
        name: "Content:",
        value:
          message.content ||
          "Sorry, but I could not tell what the message said.",
      }
    );
  if (!logChannel) {
    console.error("logging channel not found");
    return;
  }
  logChannel.startTyping();
  setTimeout(() => {
    logChannel.stopTyping();
    logChannel.send(deleteEmbed);
  }, 3000);
});

client.on("messageUpdate", (oldMessage, message) => {
  const logChannel = message.guild?.channels.cache.find(
    (channel) => channel.name === config.log_channel
  ) as TextChannel;
  if (message.author?.bot) {
    return;
  }
  const editEmbed = new MessageEmbed()
    .setTitle("A message was updated!")
    .addFields(
      {
        name: "Old Content",
        value:
          oldMessage.content || "Sorry, but I could not find that message.",
      },
      {
        name: "New Content",
        value: message.content || "Sorry, but I could not find that message.",
      },
      {
        name: "Author",
        value: message.author || "Sorry, but I could not find that user.",
      }
    );
  if (!logChannel) {
    console.error("logging channel not found");
    return;
  }
  logChannel.startTyping();
  setTimeout(() => {
    logChannel.stopTyping();
    logChannel.send(editEmbed);
  }, 3000);
});

process.once("beforeExit", () => {
  hook.send(`I, ${client.user?.username}, am off to sleep. Goodbye.`);
});
