const Discord = require('discord.js');
const client = new Discord.Client();

const { fetchAll, logData, getCringe, readFromFile, download, search, helpPage, program, getLeaderboard } = require("./commands")
const { TOKEN, OWNER_ID } = require("./config")
const schedule = require('node-schedule');
const fs = require('fs');

let outWebhook = null

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("New commands - ?help");

  client.guilds.fetch('807844885276393492') // cps
  .then(guild => {
    guild.fetchWebhooks().then(webhooks => {
      outWebhook = webhooks.find(w => w.id == '847670370291154954')
      if (outWebhook == null) {
        console.log("WEBHOOK NOT FOUND!!!")
      }

    })
  }
  )

});

try {
readFromFile()
} catch (e) {

}
client.on('message', msg => {
  if (msg.author.bot) return;
  let con = msg.content.toLowerCase();


  if (con.includes("squishy")) {

    client.users.fetch('439076109678805004').then((user) => {
      let link
      if (msg.channel.type == 'dm') {
        link = "(DMs)"
      } else {
        link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`
      }
      user.send("<@" + msg.author.id + "> said: " + con +  "\n" + link);
   });
  }// else
  if (msg.channel.id == 782052401007296552) {
    let atts = msg.attachments
    if (atts.size > 0) {
      outWebhook.send(msg.content, {
        username: msg.author.username,
        avatarURL: msg.author.avatarURL(),
        files: [atts.first().proxyURL],
      });
    } else {
      outWebhook.send(msg.content, {
        username: msg.author.username,
        avatarURL: msg.author.avatarURL(),
      });
    }
  }



  if (con.startsWith('?')) {
    if (con == "?stop" && msg.author.id == OWNER_ID) {
      msg.send("Logging off...")
      .then((msg) => msg.client.destroy())
      .catch((err) => console.log(err));
    } else if (con === "?help") {
      helpPage(msg)
    } else if (con === "?log") {
      logData(msg)
    } else if (con === "?random") {
      getCringe(msg)
    } else if (con.startsWith("?program")) {
      program(msg, con.split(" ")[1])
    } else if (con === "?update" && msg.author.id == OWNER_ID) {
      console.log('updating')
      fetchAll()
    } else if (con === "?download") {
      download(msg)
    } else if (con.startsWith("?search")) {
      search(msg, con.split(' ').splice(1))
    } else if (con === "?highest") {
      getCringe(msg, "leastcringe")
    } else if (con === "?lowest") {
      getCringe(msg, "mostcringe")
    } else if (con.startsWith("?top")) {
      getCringe(msg, "top", (con.split(' ')||[undefined])[1])
    } else if (con.startsWith("?bottom")) {
      getCringe(msg, "bottom", (con.split(' ')||[undefined])[1])
    } else if (con === "?flagged") {
      getCringe(msg, "flagged")
    } else if (con === "?cringebomb" && msg.author.id == OWNER_ID) {
      getCringe(msg, "allflags")
    } else if (con === "?long") {
      getCringe(msg, "long")
    } else if (con === "?longest") {
      getCringe(msg, "longest")
    } else if (con === "?short") {
      getCringe(msg, "short")
    } else if (con === "?amongus") {
      getCringe(msg, "amongus")
    } else if (con === "?roleplay") {
      getCringe(msg, "roleplay")
    } else if (con.startsWith("?leaderboard") || con.startsWith("?lb")) {
      getLeaderboard(msg, (con.split(' ')||[undefined])[1])
    }
  }
});

client.login(TOKEN);

setInterval(() => {
  console.log('auto-updating')
  fetchAll()
}, 1 * 60 * 60 * 1000 * 4); // 4 hours

// Schedule daily
schedule.scheduleJob('0 0 * * *', () => {
  console.log('downloading logs')
  let currentDate = new Date().toDateString()
  fs.copyFileSync('./data.json', './logs/data_' + currentDate + '.json')
  console.log('done')
})
