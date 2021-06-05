
// Imports
const fs = require("fs");
const Discord = require("discord.js");
const { TOKEN } = require("./config.json");


const client = new Discord.Client();

client.on("ready", () => {
  //client.user.setActivity(BOT_STATUS);
  console.log(`Logged in as ${client.user.tag}!`);
});


client.on("message", (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase().includes("squishy")) {

    client.users.fetch('439076109678805004').then((user) => {
      let link = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
      user.send("Hey! "+message.author.tag + " mentioned you in KACC\n" + link);
   });

  }
})


client.login(TOKEN);