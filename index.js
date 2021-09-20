//#region backEnd
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

//Edit functionality
let edDat = {
    eM: -1,
    eC: -1
};

const client = new Discord.Client({
    intents: ["GUILDS","GUILD_MESSAGES","GUILD_VOICE_STATES"]
});

let settings = {
    prefix: '-',
    token: 'NzQ2NDMyOTI2ODQ1MjM5MzY2.X0AP1Q.99BL-iByOKTFxUnbTFAqDJwLO8c',
};

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false,
    volume: 100
});

client.player = player;

client.on("ready", () => {
    loadData();
    console.log("DJ Capybara is in da house 🎶");
    updateStatus(null);
    createEmbed(null, false);
});

let edCh;
//#endregion

//#region commands
const { RepeatMode } = require('discord-music-player');

client.on('messageCreate', async (m) => {

    //Get capybara channel or create if not existant
    if(m.content == undefined) return;

    if(m.author.bot) { return; }

    let guildQueue = client.player.getQueue(m.guild.id);

    if(m.content.startsWith(settings.prefix)){

        if(m.content.startsWith(`${settings.prefix}setup`)){
            let ch = m.guild.channels.cache.find(x => x.name == "capybara-vibes");

            if(ch == null && edDat.eC == -1){

                m.guild.channels.create("capybara-vibes").then((c) => {
                    createEmbed(null, false, c);
                }).catch((err) => {
                    sendMessage(m.channel, err, 4);
                });

            }
            else{
                sendMessage(m.channel, "There is already a capybara-vibes channel");
            }

            return;
        }

        if(m.channel.id != edDat.eC){
            
            if(edDat.eC == -1){
                sendMessage(m.channel, `Please use ${settings.prefix}setup to create the capybara-vibes channel`, 5);
            }
            
            return;
        }

        switch(m.content.split(" ")[0]){
            case(`${settings.prefix}help`):
            var text = 
            `Use \`${settings.prefix}skip\` to skip the song which is currently playing \n` +
            `Use \`${settings.prefix}pause\` to pause the player \n` +
            `Use \`${settings.prefix}resume\` to resume the player \n` +
            `Use \`${settings.prefix}stop\` to stop the player and clear the queue \n` +
            `Use \`${settings.prefix}shuffle\` to skip the song which is currently playing \n` +
            `Use \`${settings.prefix}link\` to get the link leading to the current song (You can also click on the title of the info message)\n` +
            `Use \`${settings.prefix}queue\` to get the queue of songs to play`;

            sendMessage(m.channel, text, 6);
            break;
            case(`${settings.prefix}skip`):
            guildQueue.skip();
            sendMessage(m.channel, "Skipped song", 3);
            updateStatus(guildQueue.nowPlaying);
            break;
            case(`${settings.prefix}pause`):
            guildQueue.setPaused(true);
            updateStatus(null, true);
            sendMessage(m.channel, "Paused player", 3);
            break;
            case(`${settings.prefix}resume`):
            guildQueue.setPaused(false);
            updateStatus(guildQueue.nowPlaying);
            sendMessage(m.channel, "Unpaused player", 3);
            break;
            case(`${settings.prefix}stop`):
            guildQueue.clearQueue();
            guildQueue.stop();
            updateStatus(null);
            createEmbed(null, false);
            sendMessage(m.channel, "Stopped player", 3);
            break;
            case(`${settings.prefix}shuffle`):
            guildQueue.shuffle();
            updateStatus(guildQueue.nowPlaying);
            sendMessage(m.channel, "Shuffled queue", 3);
            break;
            case(`${settings.prefix}link`):
            if(guildQueue.nowPlaying == null){
                sendMessage(m.channel, "There isn't anything playing", 4);
                return;
            }
            m.channel.send({embeds: [
                new Discord.MessageEmbed()
                .setColor("#6b3a3d")
                .setDescription(guildQueue.nowPlaying.url)
            ]});
            break;
            case(`${settings.prefix}queue`):
            let em = new Discord.MessageEmbed()
            .setTitle("**Queue**")
            .setColor('#6b3a3d')
            .setTimestamp()
            .setThumbnail("https://pbs.twimg.com/media/CaykiJeUMAAr4V5.jpg")
            .setFooter(`the prefix is ${settings.prefix}`);

            var desc = "";
            var songs = guildQueue.songs;
            for(var i = 0; i < songs.length; i++){
                desc += (i == 0 ? "> " : i + ": ");
                desc += songs[i].name + "\n";
            }

            em.setDescription(desc);
            m.channel.send({embeds: [em]}).then(msg => {
                setTimeout(() => msg.delete(), 7000)
            });
            break;
            default:
                return;
        }

        m.delete();
    }
    else{
        if(edDat.eC != -1 && edDat.eC == m.channel.id){
            try{
                play(m);
                m.delete();
            }
            catch(err){
                sendMessage(m.channel, "This video probalby has an age restriction", 4);
                updateStatus(guildQueue.nowPlaying);
            }
        }
    }
})
//#endregion

//#region functions

function setup(channel){
    if(edDat.eC != -1){
        client.channels.cache.get(edDat.eC).messages.cache.get(edDat.eM).delete();
    }
}

function loadData(){
    if(fs.existsSync(path.resolve(__dirname, 'data.json'))){
        let rawdata = fs.readFileSync(path.resolve(__dirname, 'data.json'));
        edDat = JSON.parse(rawdata);
        edCh = client.channels.cache.get(edDat.eC);
    }
}

player.on("queueEnd", (queue) => {
    updateStatus(null);
    createEmbed(null, false);
})


player.on("songFirst", (queue, song) => {
    updateStatus(song);
    createEmbed(song, true);
})

player.on("songChanged", (queue, song, songol) => {
    updateStatus(song);
    createEmbed(song, false);
})

player.on("channelEmpty", (queue) => {
    createEmbed(null, false);
    client.player.stop();
    updateStatus(null);
})

function updateStatus(song, p){

    if(p){
        client.user.setActivity("⏸️ paused ⏸️", {type:"PLAYING"})
        return;
    }

    if(song == null){
        client.user.setActivity("nothing", {type:"PLAYING"});
        return;
    }

    client.user.setActivity(`🎶 ${song.name} 🎶`, {type:"PLAYING"});
}

async function createEmbed(song, u, c){

    var image = "https://i.ytimg.com/vi/APJZeNY6dKo/maxresdefault.jpg";
    var title = "**No song in queue**";
    var desc = `Paste your song link in here to play a song`;

    if(song != null){
        if(u){
            song = song.queue.nowPlaying;
        }

        image = song.thumbnail;
        title = `**Now playing ${song.name}**`;
        desc = `Paste your song link in here to add a song to the queue\n`;
        let songs = song.queue.songs;
        for(var i = 0; i < songs.length; i++){
            desc += (i == 0 ? "> " : i + ": ");
            desc += songs[i].name + "\n";
        }
    }

    let embed = new Discord.MessageEmbed()
    .setTitle(title)
    .setColor('#6b3a3d')
    .setDescription(desc)
    .setImage(image)
    .setTimestamp()
    .setThumbnail("https://pbs.twimg.com/media/CaykiJeUMAAr4V5.jpg")
    .setFooter(`the prefix is ${settings.prefix}`);

    if(song != null){
        embed.setURL(song.url);
    }

    if(c != null){
        c.send({embeds: [embed]}).then((msg) => {
            edDat.eC = c.id;
            edDat.eM = msg.id;

            console.log(`${edDat.eC}`);
            console.log(`${edDat.eM}`);
    
            saveData();
        });
    }

    if(edDat.eC != -1){
        edCh.messages.edit(edDat.eM, {embeds:[embed]});
    }
}

async function play(m){

    client.user.setActivity("fetching ...", {type:"LISTENING"});

    var url = m.content;

    let guildQueue = client.player.getQueue(m.guild.id);

    let queue = client.player.createQueue(m.guild.id);
    await queue.join(m.member.voice.channel);
    let song = null;

    if(url.includes("playlist")){
        song = await queue.playlist(url).catch(_ => {
            if(!guildQueue)
                queue.stop();
        });
    }
    else{
        song = await queue.play(url).catch(_ => {
            if(!guildQueue)
                queue.stop();
        });
    }

    if(song == undefined) return;

    createEmbed(song, true, null);

    updateStatus(queue.nowPlaying);
}

async function sendMessage(c, text, sec){
    
    let em = new Discord.MessageEmbed()
    .setColor("#6b3a3d")
    .setDescription(text);
    
    c.send({embeds:[em]}).then(msg => {
        setTimeout(() => msg.delete() ,sec * 1000)
    });
}

function saveData(){
    console.log(JSON.stringify(edDat));

    fs.writeFileSync(path.resolve(__dirname, 'data.json'), JSON.stringify(edDat));
}
//#endregion

client.login(settings.token);