const http = require('http');
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);
setInterval(() => http.get(`https://${process.env.RENDER_EXTERNAL_URL?.replace('https://', '')}`), 600000);

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const ytdl = require('ytdl-core'); // Switched to the official YouTube downloader engine

// Credentials and YouTube Video Configuration
const TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = "1365789773666582589";
const VC_ID = "1365963499213160518";
const YOUTUBE_URL = "https://www.youtube.com/watch?v=jj0ChLVTpaA"; // Your jazzy elevator music video

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Initializing YouTube engine...`);
    
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) return console.error("Server not found!");

    const connection = joinVoiceChannel({
        channelId: VC_ID,
        guildId: SERVER_ID,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    const player = createAudioPlayer({
        behaviors: { noSubscriber: 'pause' }
    });
    connection.subscribe(player);

    async function playStream() {
        try {
            // Scrape and extract only the audio layer directly from the YouTube link
            const stream = ytdl(YOUTUBE_URL, { 
                filter: 'audioonly', 
                highWaterMark: 1 << 25,
                liveBuffer: 40000
            });
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
            player.play(resource);
        } catch (error) {
            console.error("YouTube stream error, retrying...", error);
            setTimeout(playStream, 5000);
        }
    }

    // Automatically loop when the 1-hour video ends
    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Video finished. Restarting YouTube loop...");
        playStream();
    });

    player.on('error', error => console.error(`Player error: ${error.message}`));

    await playStream();
});

client.login(TOKEN);
