// 1. ADD THESE TWO LINES AT the VERY TOP of index.js
const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const http = require('http');
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);
setInterval(() => http.get(`https://${process.env.RENDER_EXTERNAL_URL?.replace('https://', '')}`), 600000);

const { Client, GatewayIntentBits } = require('discord.js');
// 2. ADD StreamType to your imports here:
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const path = require('path');

const TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = "1365789773666582589";
const VC_ID = "1365963499213160518";

const LOCAL_FILE_PATH = path.join(__dirname, 'Elevator Music - aeiouFU (128k).mp3'); 

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Initializing offline local stream...`);
    
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) return console.error("Server not found!");

    const connection = joinVoiceChannel({
        channelId: VC_ID,
        guildId: SERVER_ID,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    async function playLocalFile() {
        try {
            // 3. UPDATE THIS LINE to explicitly use FFmpeg via Arbitrary Stream Type
            let resource = createAudioResource(LOCAL_FILE_PATH, {
                inputType: StreamType.Arbitrary
            });
            
            player.play(resource);
            console.log("Local music track successfully activated!");
        } catch (error) {
            console.error("Local playback engine error:", error);
        }
    }

    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Track finished. Restarting local loop...");
        playLocalFile();
    });

    player.on('error', error => console.error(`Player error: ${error.message}`));

    await playLocalFile();
});

client.login(TOKEN);
