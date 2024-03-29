//#region backEnd
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

//Edit functionality
let loop = false;

let edDat = {
    eM: -1,
    eC: -1
};

const client = new Discord.Client({
    intents: ["GUILDS","GUILD_MESSAGES","GUILD_VOICE_STATES"]
});

let settings = {
    prefix: '-',
    token: '',
};

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false,
    volume: 100
});

client.player = player;

client.on("ready", () => {
    loadData();
    console.log("DJ Arkus is in da house 🎶");
    updateStatus(null);
    createEmbed(null, false);
});

let edCh;
//#endregion

//#region commands
const { RepeatMode } = require('discord-music-player');

client.on('messageCreate', async (m) => {

    //Get arkus channel or create if not existant
    if(m.content == undefined) return;

    if(m.author.bot) { return; }

    let guildQueue = client.player.getQueue(m.guild.id);

    if(m.content.startsWith(settings.prefix)){

        if(m.content.startsWith(`${settings.prefix}setup`)){
            let ch = m.guild.channels.cache.find(x => x.name == "arkus-vibes");

            if(ch == null && edDat.eC == -1){

                m.guild.channels.create("arkus-vibes").then((c) => {
                    createEmbed(null, false, c);
                    edCh = c;
                }).catch((err) => {
                    sendMessage(m.channel, err, 3);
                });

            }
            else{
                sendMessage(m.channel, "There is already a arkus-vibes channel", 3);
            }
			m.delete();
            return;
        }

        if(m.channel.id != edDat.eC){
            
            if(edDat.eC == -1){
                sendMessage(m.channel, `Please use ${settings.prefix}setup to create the arkus-vibes channel`, 5);
            }
            m.delete();
            return;
        }

        switch(m.content.split(" ")[0]){
            case(`${settings.prefix}help`):
            var text = 
            `Use \`${settings.prefix}skip\` to skip the song which is currently playing \n` +
            `Use \`${settings.prefix}pause\` to pause the player \n` +
            `Use \`${settings.prefix}play\` to resume the player \n` +
            `Use \`${settings.prefix}stop\` to stop the player and clear the queue \n` +
			`Use \`${settings.prefix}remove index\` to remove the index from the queue\n` +
			`Use \`${settings.prefix}loop\` to loop the song which is currently playing \n` +
            `Use \`${settings.prefix}shuffle\` to skip the song which is currently playing \n` +
            `Use \`${settings.prefix}link\` to get the link leading to the current song (You can also click on the title of the info message)\n` +
            `Use \`${settings.prefix}queue\` to get the queue of songs to play`;

            sendMessage(m.channel, text, 6);
            break;
            case(`${settings.prefix}skip`):
			if(guildQueue == null){
				sendMessage(m.channel, "There isn't anything playing", 3);
				m.delete();
				return;
			}
            guildQueue.skip();
            sendMessage(m.channel, "Skipped song", 3);
            updateStatus(guildQueue.nowPlaying);
            break;
            case(`${settings.prefix}pause`):
			if(guildQueue == null){
				sendMessage(m.channel, "There isn't anything playing", 3);
				m.delete();
				return;
			}
            guildQueue.setPaused(true);
            updateStatus(null, true);
            sendMessage(m.channel, "Paused player", 3);
            break;
            case(`${settings.prefix}play`):
			if(guildQueue == null){
				sendMessage(m.channel, "There isn't anything playing", 3);
				m.delete();
				return;
			}
            guildQueue.setPaused(false);
            updateStatus(guildQueue.nowPlaying);
            sendMessage(m.channel, "Unpaused player", 3);
            break;
            case(`${settings.prefix}stop`):
			if(guildQueue == null){
				sendMessage(m.channel, "There isn't anything playing", 3);
				m.delete();
				return;
			}
            guildQueue.clearQueue();
            guildQueue.stop();
			loop = false;
            updateStatus(null);
            createEmbed(null, false);
            sendMessage(m.channel, "Stopped player", 3);
            break;
			case(`${settings.prefix}remove`):
			if(guildQueue == null){
				sendMessage(m.channel, "There isn't anything playing", 3);
				m.delete();
				return;
			}
			if(guildQueue.songs.length <= 1){
				sendMessage(m.channel, "There is no song queued!\nUse ``${settings.prefix}skip`` if you want to remove the current song", 3);
				m.delete();
				return;
			}
			let index = parseInt(m.content.split(" ")[1]) < 1 ? 1 : parseInt(m.content.split(" ")[1]) >= guildQueue.songs.length ? guildQueue.songs.length - 1 : parseInt(m.content.split(" ")[1]);
            guildQueue.remove(index);
			sendMessage(m.channel, `content ${index} has been removed.`, 3);
			createEmbed(guildQueue.nowPlaying, true, null);
            break;
			case(`${settings.prefix}loop`):
			if(guildQueue == null || guildQueue.nowPlaying == null)
				sendMessage(m.channel, "There isn't anything playing", 3);
            else if(!loop) {
				guildQueue.setRepeatMode(RepeatMode.SONG);
				loop = true;
				sendMessage(m.channel, "looped currend song.", 3);
				createEmbed(guildQueue.nowPlaying, true, null);
			}
			else {
				guildQueue.setRepeatMode(RepeatMode.DISABLED);
				loop = false;
				sendMessage(m.channel, "loop disabled.", 3);
				createEmbed(guildQueue.nowPlaying, true, null);
			}
            break;
            case(`${settings.prefix}shuffle`):
			if(guildQueue == null){
				sendMessage(m.channel, "There isn't anything playing.", 3);
				m.delete();
				return;
			}
            guildQueue.shuffle();
            updateStatus(guildQueue.nowPlaying);
			createEmbed(guildQueue.nowPlaying, true, null);
            sendMessage(m.channel, "Shuffled queue", 3);
            break;
            case(`${settings.prefix}link`):
            if(guildQueue != null && guildQueue.nowPlaying != null){
                m.channel.send({embeds: [
                    new Discord.MessageEmbed()
                    .setColor("#ff8800")
                    .setDescription(guildQueue.nowPlaying.url)
                ]});
            }
            else{
                sendMessage(m.channel, "There isn't anything playing", 4);
            }
            break;
            case(`${settings.prefix}queue`):
			if(guildQueue == null){
				sendMessage(m.channel, "There is no queue.", 3);
				m.delete();
				return;
			}
            let em = new Discord.MessageEmbed()
            .setTitle("**Queue**")
            .setColor('#596449')
            .setThumbnail("")

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

    var image = "https://ia801402.us.archive.org/7/items/djarkus/maxgrind.png";
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
    .setColor('#596449')
    .setDescription(desc)
    .setImage(image)
    .setTimestamp()
    .setThumbnail("https://ia801402.us.archive.org/7/items/djarkus/maxpb.png")
    .setFooter({ text: `| loop: ${loop} | the prefix is ${settings.prefix} |`, iconURL: 'https://ia801402.us.archive.org/7/items/djarkus/maxpb.png' })

    if(song != null){
        embed.setURL(song.url);
    }

    if(c != null){
        c.send({embeds: [embed]}).then((msg) => {
            edDat.eC = c.id;
            edDat.eM = msg.id;

            //console.log(`${edDat.eC}`);
            //console.log(`${edDat.eM}`);
    
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
    .setColor("#596449")
    .setDescription(text);
    
    c.send({embeds:[em]}).then(msg => {
        setTimeout(() => msg.delete() ,sec * 1000)
    });
}

function saveData(){
    //console.log(JSON.stringify(edDat));
    console.log("Saved Channel Data");
    fs.writeFileSync(path.resolve(__dirname, 'data.json'), JSON.stringify(edDat));
}
//#endregion

client.login(settings.token);