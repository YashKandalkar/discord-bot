import { CommandInt } from "../interfaces/CommandInt";
import fetch from "node-fetch";
import { MessageEmbed } from "discord.js";
import { DndMonInt } from "../interfaces/DndMonInt";

export const dndMon: CommandInt = {
  prefix: "dndmon",
  description:
    "Gets information on the provided Dungeons and Dragons **monster**.",
  parameters: "`<monster>`: the name of the monster to search",
  command: async (message) => {
    const query = message.content.split(" ").slice(1).join("-");
    if (!query) {
      message.channel.send("Sorry, but what did you want me to search for?");
      return;
    }
    const monster = await fetch(
      "https://www.dnd5eapi.co/api/monsters/" + query
    );
    const data: DndMonInt = await monster.json();
    if (!data || data.error) {
      message.channel.send("Sorry, but I was not able to find anything...");
      return;
    }
    const embed = new MessageEmbed()
      .setTitle(data.name)
      .setURL("https://www.dnd5eapi.co" + data.url)
      .addFields(
        { name: "Challenge Rating", value: data.challenge_rating },
        { name: "Type", value: `${data.type} - ${data.subtype}` },
        { name: "Alignment", value: data.alignment },
        {
          name: "Attributes",
          value: `STR: ${data.strength} DEX: ${data.dexterity}, CON: ${data.constitution}, INT: ${data.intelligence}, WIS: ${data.wisdom}, CHA: ${data.charisma}`,
        },
        { name: "Armour Class", value: data.armor_class }
      );
    message.channel.send(embed);
  },
};
