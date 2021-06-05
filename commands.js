const fs = require('fs');
const fetch = require('node-fetch');
const { MessageEmbed, MessageAttachment } = require('discord.js')
const { svg2png } = require('svg-png-converter')

let allContent = []
let programContent = []
var cringe = null; // Active cringe
var msgGlobal = null;
var embedGlobal = null;

const FILE_PATH = "data";

function fetchProfile(kaid, callback) {
  fetch(`https://www.khanacademy.org/api/internal/user/profile?kaid=${kaid}`, { headers: {}, method: "GET", mode: "cors" })
    .then(r=>r.json())
    .then(callback)
    .catch(console.error);
}

function fetchHotlist(callback) {
  fetch(`https://www.khanacademy.org/api/internal/scratchpads/top?sort=3&page=0&limit=100`, { headers: {}, method: "GET", mode: "cors" })
    .then(r=>r.json())
    .then(callback)
    .catch(console.error);

}

function fetchProject(id, callback) {
  fetch(
  `https://www.khanacademy.org/api/labs/scratchpads/${id}`, { headers: {}, method: "GET", mode: "cors" })
  .then(r=>r.json())
  .then(callback)
  .catch(console.error);
}

function fetchQuestions(id, callback) {
  fetch(`https://www.khanacademy.org/api/internal/discussions/scratchpad/${id}/questions?limit=1000&sort=1`
  , { headers: {}, method: "GET", mode: "cors" })
  .then(r=>r.json())
  .then(callback)
  .catch(console.error);
}

function fetchTTs(id, callback) {
  fetch(`https://www.khanacademy.org/api/internal/discussions/scratchpad/${id}/comments?limit=1000&page=0&sort=1`
  , { headers: {}, method: "GET", mode: "cors" })
  .then(r=>r.json())
  .then(callback)
  .catch(console.error);
}

function fetchComment(kaencrypted, callback) {
  //`ag5zfmtoYW4tYWNhZGVteXJACxIIVXNlckRhdGEiHWthaWRfOTQ4NDQ5NjE4MzA1MTM0Nzg0OTA5OTAyDAsSCEZlZWRiYWNrGICAvbPfnbwKDA`
  //`kaencrypted_56e0fa25aae9a1ba43b0750d80cac4cc_5aec511b4bf74698df790e9b414b4d98f3148ee92523ecf4d9945ac3b0f7508b9144594d764fe56f78ce4c63f460ed9201d953bf63293044d5cdbf7c5d0603f0d819677da0784b1cd8ba40d064fd4e6266fa4019cb6e8de701a17332813c3a8a714167a0ec9ad216da77a78ca9e4eeb54890d2fab8aa515080d16d74808c62aa`
  fetch(`https://www.khanacademy.org/api/internal/discussions/${kaencrypted}/replies`
  ,{ headers: {}, method: "GET", mode: "cors" })
  .then(r=>r.json())
  .then(callback)
  .catch(console.error);
}

const downloadFile = (async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", resolve);
    });
});

const sendLater = async(avatarSrc) => {
  await downloadFile(avatarSrc, "./avatar.svg")

  let outputBuffer = await svg2png({ 
    input: fs.readFileSync('./avatar.svg'), 
    encoding: 'buffer', 
    format: 'png',
  })

  let attachment = new MessageAttachment(outputBuffer, 'avatar.png')
  embedGlobal.attachFiles(attachment)

  msgGlobal.reply(embedGlobal)

  cringe = null; // Active cringe
  msgGlobal = null;
  embedGlobal = null;
}

function addPost(post, type) {
  allContent.push({
    content: post.content,
    type: type,
    authorKaid: post.authorKaid,
    votes: post.sumVotesIncremented,
    flags: post.flags,
    lowQualityScore: post.lowQualityScore,
    link: `https://www.khanacademy.org/cs/i/${post.permalink.slice(post.permalink.length-16)}?qa_expand_key=${post.expandKey}`,
  });
  if (post.replyCount) {
    fetchComment(post.key, (c) => {
      for (let comment of c) {
        allContent.push({
          content: comment.content,
          type: "comment",
          authorKaid: comment.authorKaid,
          votes: comment.sumVotesIncremented,
          flags: comment.flags,
          lowQualityScore: comment.lowQualityScore,
          link: `https://www.khanacademy.org/cs/i/${post.permalink.slice(post.permalink.length-16)}?qa_expand_key=${post.expandKey}`,
        });
      }
    })
  }
}

function addPostToProgramDB(post, type) {
  programContent.push({
    content: post.content,
    type: type,
    authorKaid: post.authorKaid,
    votes: post.sumVotesIncremented,
    flags: post.flags,
    lowQualityScore: post.lowQualityScore,
    link: `https://www.khanacademy.org/cs/i/${post.permalink.slice(post.permalink.length-16)}?qa_expand_key=${post.expandKey}`,

  });
  if (post.replyCount) {
    fetchComment(post.key, (c) => {
      for (let comment of c) {
        programContent.push({
          content: comment.content,
          type: "comment",
          authorKaid: comment.authorKaid,
          votes: comment.sumVotesIncremented,
          flags: comment.flags,
          lowQualityScore: comment.lowQualityScore,
          link: `https://www.khanacademy.org/cs/i/${post.permalink.slice(post.permalink.length-16)}?qa_expand_key=${post.expandKey}`,
        });
      }
    })
  }
}

function capitalize(t) {
  return t.toLowerCase()
  .split(' ')
  .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
  .join(' ');
}

function finishFetching() {
    console.log("done")
    allContent.sort((a, b) =>
      a.lowQualityScore > b.lowQualityScore ? 1 : -1
    );
    fs.writeFileSync(
      `${FILE_PATH}.json`,
      JSON.stringify(allContent, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      `botdata.json`,
      JSON.stringify({ lastUpdated: new Date().getTime() }, null, 2),
      "utf8"
    );
}

module.exports = {
  readFromFile: () => {
    allContent = JSON.parse(fs.readFileSync(`${FILE_PATH}.json`, "utf8"));
  },

  fetchAll: () => {
    allContent = [];
    fetchHotlist((d) => {
      let timer = 0
      for (let scratchpad of d.scratchpads) {
        setTimeout(() => {
          timer += 1000
          
          fetchProject(scratchpad.url.slice(scratchpad.url.length - 16), (d) => {
            fetchQuestions(d.id, (d) => {
              for (let question of d.feedback) {
                addPost(question, "question");
                for (let answer of question.answers) {
                  addPost(answer, "answer");
                }
              }
            });
            fetchTTs(d.id, (d) => {
              for (let tAndT of d.feedback) {
                addPost(tAndT, "tips & thanks");
              }
            });
          });
        }, timer)
      }
    });

    setTimeout(() => {
      finishFetching();
    }, 110 * 1000);
  },

  logData: (msg) => {
    finishFetching();
  },

  getCringe: (msg, option, option2) => {
    let index;
    let cringes = null
    if (option === "leastcringe") {
      index = 0;
      cringe = allContent[index]
    } else if (option === "mostcringe") {
      index = allContent.length - 1;
      cringe = allContent[index]
    } else if (option === "top") {
      cringe = [...allContent].sort(
        (a, b) => b.votes - a.votes
      )[(parseInt(option2) || 1) - 1];
    } else if (option === "bottom") {
      cringe = [...allContent].sort(
        (a, b) => (a.votes - b.votes)
      )[(parseInt(option2) || 1) - 1];
    } else if (option === "short") {
      let criteria = allContent.filter((p) => p.content.length <= 5);
      cringe = criteria[Math.floor(criteria.length * Math.random())];
    } else if (option === "long") {
      let criteria = allContent.filter((p) => p.content.length > 1000);
      cringe = criteria[Math.floor(criteria.length * Math.random())];
    } else if (option === "flagged") {
      let criteria = allContent.filter((p) => p.flags.length > 0);
      if (criteria.length > 0) {
        cringe = criteria[Math.floor(criteria.length * Math.random())];
      } else {
        cringe = false
      }
    } else if (option === "allflags") {
      cringes = allContent.filter((p) => p.flags.length > 0)
    } else if (option === "longest") {
      cringe = [...allContent].sort(
        (a, b) => b.content.length - a.content.length
      )[0];
    } else if (option === "amongus") {
      let triggerWords = [
        "among us",
        "amogus",
        "sus",
        "sussy",
        "amongus",
        "imposter",
        "impostor",
      ];
      let criteria = allContent.filter((p) =>
        triggerWords.some((v) =>
          p.content.toLowerCase().includes(v.toLowerCase())
        )
      );
      let index = Math.floor(criteria.length * Math.random());
      cringe = criteria[index];
    } else if (option === "roleplay") {

      let criteria = allContent.filter((p) => p.content.split("*").length >= 4 && // Contains expressions
        p.content.length / p.content.split("\n").length < 40 && // Many line breaks
        !p.content.includes("function()") && // Not code
        !p.content.includes("var ") &&
        !p.content.includes("https://www.")  // No links
      )

      let index = Math.floor(criteria.length * Math.random());
      cringe = criteria[index];
    } else {
      index = Math.floor(Math.random() * allContent.length);
      cringe = allContent[index];
    }


    if (!cringe && !cringes) {
      return msg.reply("No comments found with criteria: " + option);
    }
    if (cringes == null) {
      cringes = [cringe]
      cringes = cringes.slice(0, 20)
    }
    for (let ii = 0; ii < cringes.length; ii ++) {
      setTimeout(() => {
        cringe = cringes[ii]
        msgGlobal = msg;

        fetchProfile(cringe.authorKaid, (d) => {
          let content = cringe.content;
          content =
            content.length > 1750 ? content.slice(0, 1750) + "..." : content;
          embedGlobal = new MessageEmbed()
            .setDescription(
              `${content} [${capitalize(cringe.type)} link](${cringe.link})`
            )
            .setAuthor(
              d.nickname,
              `attachment://avatar.png`,
              `https://www.khanacademy.org/profile/${cringe.authorKaid}`
            )
            .addFields({
                name: `Low quality score:`,
                value: cringe.lowQualityScore.toFixed(3),
                inline: true
              });
            if (cringe.votes != 1) {
              embedGlobal.addFields({
                name: `Votes:`,
                value: cringe.votes,
                inline: true
              })
            }
            if (cringe.flags && cringe.flags.length > 0) {
              embedGlobal.addFields({
                name: `Flags:`,
                value: JSON.stringify(cringe.flags),
                inline: true
              })
            }
          sendLater(d.avatarSrc);
        });
      }, 2000 * ii)
    }
  },

  search: (msg, triggerWords) => {
    let criteria = allContent.filter((p) =>
      triggerWords.some((v) =>
        p.content
          .toLowerCase()
          .split(/[^A-Za-z]/)
          .includes(v.toLowerCase())
      )
    );
    if (criteria.length < 1) {
      return msg.reply("No posts contain the following: " + triggerWords);
    }
    fs.writeFileSync(`search.json`, JSON.stringify(criteria, null, 2), "utf8");
    const embed = new MessageEmbed()
      .setTitle("Search")
      .setDescription(`Query: ${triggerWords}\nMatches: ${criteria.length}`);
    msg.reply("", embed).then((msg) => {
      msg.reply(
        new MessageAttachment(fs.readFileSync("./search.json"), "search.json")
      );
    });
  },

  program: (msg, id) => {
    if (!id || isNaN(id)) {
      return msg.reply("Not a valid ID");
    }
    msg.reply("Loading...");
    programContent = [];
    fetchProject(id, (d) => {
      fetchQuestions(d.id, (d) => {
        for (let question of d.feedback) {
          addPostToProgramDB(question, "question");
          for (let answer of question.answers) {
            addPostToProgramDB(answer, "answer");
          }
        }
      });
      fetchTTs(d.id, (d) => {
        for (let tAndT of d.feedback) {
          addPostToProgramDB(tAndT, "tips & thanks");
        }
      });
    });
    setTimeout(() => {
      fs.writeFileSync(
        "./program.json",
        JSON.stringify(programContent, null, 2)
      );
      const embed = new MessageEmbed()
        .setTitle("Program")
        .setDescription(`ID: ${id}\nPosts: ${programContent.length}`);
      msg.reply("", embed).then((msg) => {
        msg.reply(
          new MessageAttachment(
            fs.readFileSync("./program.json"),
            "program.json"
          )
        );
      });
    }, 10 * 1000); // Wait 10 seconds because I don't know how to properly implement this await sequence
  },

  download: (msg) => {
    msg.reply(
      "",
      new MessageAttachment(fs.readFileSync("./data.json"), "cringe_data.json")
    );
  },

  getLeaderboard: (msg, page) => {
    if (!page || isNaN(page)) {
      page = 1
    } else {
      page = parseInt(page)
    }
    let top10Authors = []

    const finish = () => {
      let description = ""
      let medals = {
        "1": ":first_place:",
        "2": ":second_place:",
        "3": ":third_place:",
      }
      let place = -9 + 10 * page
      for (let author of top10Authors) {
        description += `${medals[place] ? medals[place]: place+"." } **${author.count} posts** from [${author.nickname.slice(0,128)}](https://www.khanacademy.org/profile/${author.authorKaid})\n`
        place ++
      }
      embed = new MessageEmbed()
      .setTitle("Leaderboard")
      .setDescription(description)
      msg.reply(embed)
    }

    let authorsFetched = 0
    let authors = []
    for (let post of allContent) {
      let entry = authors.find(x => post.authorKaid === x.authorKaid)
      if (entry) {
        entry.count++
      } else {
        authors.push({
          authorKaid: post.authorKaid,
          count: 1,
        });
      }
    }
    authors.sort((a, b) => b.count - a.count)
    top10Authors = authors.splice(10 * (page-1), 10)
    if (!top10Authors.length) {
      return msg.reply("Too high")
    }

    for (let author of top10Authors) {
      fetchProfile(author.authorKaid, (d) => {
        author.nickname = d.nickname
        authorsFetched ++
        if (authorsFetched >= top10Authors.length) {
          finish()
        }
      })
    }


  },

  helpPage: (msg) => {
    let hoursDiff;
    try {
      let timeDiff =
        new Date() -
        new Date(
          JSON.parse(fs.readFileSync("botdata.json", "utf-8")).lastUpdated
        );
      hoursDiff = (timeDiff / (60 * 60 * 1000)).toFixed(1);
    } catch (e) {
      hoursDiff = "?";
    }
    const embed = new MessageEmbed()
      .setTitle("Commands")
      .setDescription(`
**General**
?random - Random post
?lowest - Post with lowest quality
?highest - Post with highest quality
?top [rank] - Post with most upvotes
?bottom [rank] - Post with most downvotes
?flagged - Random flagged post
?short - Post with 5 or less characters
?long - Post with 1000 or more characters
?longest - Longest post
?amongus - Random post containing among us content
?roleplay - Random post in roleplay format
?leaderboard - Show discussion leaderboard

**Return as JSON**
?download  ?search [word]  ?program [id]

**Squishy only**
?cringebomb  ?update  ?log  ?stop`
      )
      .setFooter(
        "Source: Top 100 projects on the hotlist\nLast updated " +
          hoursDiff +
          " hours ago"
      );
    msg.reply(embed);
  },
};
