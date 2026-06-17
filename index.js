const http = require('http');
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);
setInterval(() => http.get(`https://${process.env.RENDER_EXTERNAL_URL?.replace('https://', '')}`), 600000);

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, VoiceConnectionStatus } = require('@discordjs/voice');
const play = require('play-dl');

// Paste your exact credentials inside the quotes below:
const TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = "1365789773666582589";
const VC_ID = "1365963499213160518";
const YOUTUBE_URL = "https://jazz.fm";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
    rest: { timeout: 60000 } // Gives the network plenty of time to clear firewalls
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Initializing loop...`);
    
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) return console.error("Server not found!");

    const connection = joinVoiceChannel({
        channelId: VC_ID,
        guildId: SERVER_ID,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: 'pause'
        }
    });
    connection.subscribe(player);

    async function playStream() {
        try {
            // Stream the raw jazz MP3 directly into the voice channel
            let resource = createAudioResource(YOUTUBE_URL, { inputType: StreamType.Arbitrary });
            player.play(resource);
        } catch (error) {
            console.error("Stream error, retrying...", error);
            setTimeout(playStream, 5000);
        }
    }

    // Auto-loop when the video finishes
    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Track finished. Restarting loop...");
        playStream();
    });

    player.on('error', error => console.error(`Player error: ${error.message}`));

    // Start playing immediately on startup
    await playStream();
});

client.login(TOKEN);
